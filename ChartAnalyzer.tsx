import { useState, useRef } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { useToast } from '../../hooks/use-toast'
import { Camera, Upload, Play, Square, Loader2, Info } from 'lucide-react'
import { analyzeChartWithGemini, getApiPoolStatus } from '../../lib/gemini'
import SignalDisplay from './SignalDisplay'

interface AnalysisResult {
  signal: 'COMPRA' | 'VENDA' | 'NEUTRO'
  confidence: number
  analysis: string
  timestamp: number
}

interface ChartAnalyzerProps {
  onAnalysisComplete: (data: AnalysisResult) => void
}

export default function ChartAnalyzer({ onAnalysisComplete }: ChartAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [autoMode, setAutoMode] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const autoIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem',
        variant: 'destructive'
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 10MB',
        variant: 'destructive'
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Analyze
    await analyzeImage(file)
  }

  const analyzeImage = async (file: File) => {
    setAnalyzing(true)
    try {
      const analysis = await analyzeChartWithGemini(file)
      
      const result: AnalysisResult = {
        signal: analysis.signal,
        confidence: analysis.confidence,
        analysis: analysis.analysis,
        timestamp: Date.now()
      }

      setResult(result)
      onAnalysisComplete(result)

      toast({
        title: `Sinal ${analysis.signal} detectado`,
        description: `Confiança: ${analysis.confidence}%`,
        variant: analysis.signal === 'COMPRA' ? 'default' : analysis.signal === 'VENDA' ? 'destructive' : 'default'
      })
    } catch (error) {
      toast({
        title: 'Erro na análise',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
      console.error('Analysis error:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const captureScreen = async () => {
    try {
      console.log('🎥 Requesting screen capture...')
      
      // Enhanced display media constraints for better compatibility
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'never',
          displaySurface: 'monitor',
          logicalSurface: true,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        } as MediaTrackConstraints,
        audio: false,
        preferCurrentTab: false
      } as any)

      console.log('✅ Screen capture granted')

      const video = document.createElement('video')
      video.srcObject = stream
      video.autoplay = true
      video.playsInline = true

      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play().then(() => resolve())
        }
      })

      // Small delay to ensure first frame is rendered
      await new Promise(resolve => setTimeout(resolve, 500))

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Stop all tracks immediately after capture
      stream.getTracks().forEach(track => {
        track.stop()
        console.log('🛑 Track stopped:', track.kind)
      })

      // Convert to blob with high quality
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast({
            title: 'Erro ao processar imagem',
            description: 'Não foi possível converter a captura',
            variant: 'destructive'
          })
          return
        }

        const file = new File([blob], `chart-${Date.now()}.png`, { type: 'image/png' })
        const preview = canvas.toDataURL('image/png', 1.0)
        
        setImagePreview(preview)
        console.log('📸 Screenshot captured:', file.size, 'bytes')
        
        await analyzeImage(file)
      }, 'image/png', 1.0)

    } catch (error) {
      console.error('❌ Screen capture error:', error)
      
      let errorMessage = 'Não foi possível capturar a tela'
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Permissão de captura de tela negada. Por favor, permita o acesso.'
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Nenhuma tela disponível para captura.'
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Captura de tela não suportada neste navegador.'
        }
      }

      toast({
        title: 'Erro ao capturar tela',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  const toggleAutoMode = () => {
    const newAutoMode = !autoMode
    setAutoMode(newAutoMode)
    
    if (newAutoMode) {
      toast({
        title: 'Modo automático ativado',
        description: 'Análises serão feitas a cada 30 segundos'
      })
      
      // Start auto capture
      autoIntervalRef.current = setInterval(() => {
        if (!analyzing) {
          captureScreen()
        }
      }, 30000) // 30 seconds
    } else {
      toast({
        title: 'Modo automático desativado',
        description: 'Análises automáticas foram pausadas'
      })
      
      // Stop auto capture
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current)
        autoIntervalRef.current = null
      }
    }
  }

  const showApiStatus = () => {
    const status = getApiPoolStatus()
    console.table(status)
    
    toast({
      title: 'Status do Pool de APIs',
      description: `${status.filter(k => k.available).length}/${status.length} chaves disponíveis`,
    })
  }

  return (
    <Card className="p-6 glass-effect border-white/10">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Análise de Gráfico</h2>
            <p className="text-sm text-muted-foreground">Envie ou capture um gráfico para análise com IA</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={showApiStatus}
              className="rounded-full"
              title="Ver status das APIs"
            >
              <Info className="h-4 w-4" />
            </Button>
            
            <Button
              variant={autoMode ? 'destructive' : 'default'}
              onClick={toggleAutoMode}
              className="gap-2 rounded-full"
            >
              {autoMode ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {autoMode ? 'Parar' : 'Auto'}
            </Button>
          </div>
        </div>

        {/* Image Preview Area */}
        <div className="relative aspect-video bg-gradient-to-br from-slate-900/50 to-purple-900/20 rounded-2xl overflow-hidden border-2 border-dashed border-white/10">
          {imagePreview ? (
            <img 
              src={imagePreview} 
              alt="Chart preview" 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">Nenhuma imagem carregada</p>
                <p className="text-xs text-muted-foreground/60">
                  Clique em "Capturar Tela" ou "Enviar Imagem"
                </p>
              </div>
            </div>
          )}
          
          {analyzing && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-12 w-12 text-purple-400 animate-spin mx-auto mb-4" />
                <p className="text-white font-medium">Analisando com IA...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Usando sistema de rotação de chaves
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={captureScreen}
            disabled={analyzing}
            className="gap-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
          >
            <Camera className="h-4 w-4" />
            Capturar Tela
          </Button>
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={analyzing}
            variant="outline"
            className="gap-2 rounded-full border-white/20 hover:bg-white/10"
          >
            <Upload className="h-4 w-4" />
            Enviar Imagem
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Analysis Result */}
        {result && <SignalDisplay result={result} />}
      </div>
    </Card>
  )
}
