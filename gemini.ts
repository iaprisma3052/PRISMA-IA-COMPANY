// Gemini API Integration with Key Pool and Auto-Rotation
// Similar to GitHub proxy key rotation system

interface ApiKey {
  key: string
  available: boolean
  cooldownUntil: number | null
  requestCount: number
  lastUsed: number
}

interface AnalysisResponse {
  signal: 'COMPRA' | 'VENDA' | 'NEUTRO'
  confidence: number
  analysis: string
}

class GeminiKeyPool {
  private keys: ApiKey[] = []
  private currentIndex = 0
  private readonly COOLDOWN_TIME = 60000 // 1 minute cooldown after 429
  private readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

  constructor() {
    // Initialize key pool - Add more keys here for rotation
    const apiKeys = [
      'AIzaSyBY3xgjyOJCHw6GNL0bGKKVpOqNQM-P_d0',
      // Add more API keys here for automatic rotation
      // 'AIzaSy...',
      // 'AIzaSy...',
    ]

    this.keys = apiKeys.map(key => ({
      key,
      available: true,
      cooldownUntil: null,
      requestCount: 0,
      lastUsed: 0
    }))

    // Start cooldown monitor
    this.startCooldownMonitor()
  }

  private startCooldownMonitor() {
    setInterval(() => {
      const now = Date.now()
      this.keys.forEach(key => {
        if (key.cooldownUntil && now >= key.cooldownUntil) {
          key.available = true
          key.cooldownUntil = null
          console.log(`🔓 API Key ${this.maskKey(key.key)} is now available again`)
        }
      })
    }, 5000) // Check every 5 seconds
  }

  private maskKey(key: string): string {
    return `${key.slice(0, 10)}...${key.slice(-4)}`
  }

  private getNextAvailableKey(): ApiKey | null {
    const now = Date.now()
    
    // Try to find an available key
    for (let i = 0; i < this.keys.length; i++) {
      const index = (this.currentIndex + i) % this.keys.length
      const key = this.keys[index]
      
      if (key.available && (!key.cooldownUntil || now >= key.cooldownUntil)) {
        this.currentIndex = (index + 1) % this.keys.length
        key.lastUsed = now
        key.requestCount++
        
        console.log(`✅ Using API Key ${this.maskKey(key.key)} (${key.requestCount} requests)`)
        return key
      }
    }

    return null
  }

  private markKeyAsUnavailable(key: ApiKey, reason: string = '429') {
    key.available = false
    key.cooldownUntil = Date.now() + this.COOLDOWN_TIME
    
    console.log(`⏸️ API Key ${this.maskKey(key.key)} in cooldown until ${new Date(key.cooldownUntil).toLocaleTimeString()} (Reason: ${reason})`)
  }

  async analyzeWithRetry(imageFile: File, maxRetries: number = 3): Promise<AnalysisResponse> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const keyData = this.getNextAvailableKey()
      
      if (!keyData) {
        const waitTime = Math.min(
          ...this.keys
            .filter(k => k.cooldownUntil)
            .map(k => k.cooldownUntil! - Date.now())
        )
        
        if (waitTime > 0) {
          console.log(`⏳ All keys in cooldown. Waiting ${Math.ceil(waitTime / 1000)}s...`)
          await new Promise(resolve => setTimeout(resolve, waitTime + 1000))
          continue
        } else {
          throw new Error('No API keys available. Please add more keys to the pool.')
        }
      }

      try {
        const result = await this.makeRequest(keyData.key, imageFile)
        console.log(`✅ Analysis successful with key ${this.maskKey(keyData.key)}`)
        return result
      } catch (error) {
        lastError = error as Error
        
        if (error instanceof Error && error.message.includes('429')) {
          this.markKeyAsUnavailable(keyData, '429 - Rate Limit')
          console.log(`🔄 Retrying with next key (Attempt ${attempt + 1}/${maxRetries})...`)
          continue
        } else if (error instanceof Error && error.message.includes('quota')) {
          this.markKeyAsUnavailable(keyData, 'Quota Exceeded')
          console.log(`🔄 Quota exceeded, trying next key...`)
          continue
        } else {
          // For other errors, throw immediately
          throw error
        }
      }
    }

    throw lastError || new Error('Failed after maximum retries')
  }

  private async makeRequest(apiKey: string, imageFile: File): Promise<AnalysisResponse> {
    // Convert image to base64
    const base64Image = await this.fileToBase64(imageFile)
    
    const prompt = `Você é um especialista em análise técnica de trading. Analise este gráfico de trading e forneça:

1. SINAL: Determine se é um sinal de COMPRA, VENDA ou NEUTRO
2. CONFIANÇA: Nível de confiança da análise (0-100%)
3. ANÁLISE: Explicação detalhada da análise técnica

Considere:
- Padrões de candlestick
- Suportes e resistências
- Médias móveis
- Volume
- Tendências de mercado
- Indicadores técnicos visíveis

Responda APENAS no formato JSON:
{
  "signal": "COMPRA|VENDA|NEUTRO",
  "confidence": 0-100,
  "analysis": "sua análise detalhada aqui"
}

Seja preciso, objetivo e baseie-se apenas no que você vê no gráfico.`

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: imageFile.type,
              data: base64Image.split(',')[1]
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      }
    }

    const response = await fetch(`${this.GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json()
      
      if (response.status === 429) {
        throw new Error('429 - Rate limit exceeded')
      }
      
      throw new Error(`Gemini API Error (${response.status}): ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No analysis generated')
    }

    const text = data.candidates[0].content.parts[0].text
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini')
    }

    const result = JSON.parse(jsonMatch[0])
    
    // Validate response
    if (!['COMPRA', 'VENDA', 'NEUTRO'].includes(result.signal)) {
      throw new Error('Invalid signal type')
    }

    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 100) {
      throw new Error('Invalid confidence value')
    }

    return result
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  getPoolStatus() {
    return this.keys.map(key => ({
      key: this.maskKey(key.key),
      available: key.available,
      requestCount: key.requestCount,
      cooldownUntil: key.cooldownUntil ? new Date(key.cooldownUntil).toLocaleTimeString() : null
    }))
  }
}

// Singleton instance
const geminiPool = new GeminiKeyPool()

// Public API
export async function analyzeChartWithGemini(imageFile: File): Promise<AnalysisResponse> {
  try {
    console.log('🔍 Starting chart analysis with Gemini AI...')
    const result = await geminiPool.analyzeWithRetry(imageFile)
    
    // Save to history
    saveToHistory({
      signal: result.signal,
      confidence: result.confidence,
      timestamp: Date.now()
    })

    console.log('✅ Analysis completed successfully')
    return result
  } catch (error) {
    console.error('❌ Gemini analysis error:', error)
    throw error
  }
}

export function getApiPoolStatus() {
  return geminiPool.getPoolStatus()
}

function saveToHistory(signal: { signal: string; confidence: number; timestamp: number }) {
  const history = JSON.parse(localStorage.getItem('prisma-signals') || '[]')
  history.unshift({
    id: crypto.randomUUID(),
    ...signal
  })
  
  // Keep only last 50 signals
  const trimmed = history.slice(0, 50)
  localStorage.setItem('prisma-signals', JSON.stringify(trimmed))
  
  // Dispatch event for real-time update
  window.dispatchEvent(new Event('storage'))
}
