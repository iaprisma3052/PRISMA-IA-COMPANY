import { useState, useEffect } from 'react'
import { Card } from '../ui/card'
import { ScrollArea } from '../ui/scroll-area'
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react'

interface Signal {
  id: string
  signal: 'COMPRA' | 'VENDA' | 'NEUTRO'
  confidence: number
  timestamp: number
}

export default function SignalHistory() {
  const [signals, setSignals] = useState<Signal[]>([])

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('prisma-signals')
    if (stored) {
      setSignals(JSON.parse(stored))
    }
  }, [])

  const signalIcon = {
    COMPRA: TrendingUp,
    VENDA: TrendingDown,
    NEUTRO: Minus
  }

  const signalColor = {
    COMPRA: 'text-green-400',
    VENDA: 'text-red-400',
    NEUTRO: 'text-yellow-400'
  }

  return (
    <Card className="p-6 glass-effect border-white/10 h-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Histórico de Sinais</h2>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{signals.length} sinais</span>
          </div>
        </div>

        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-3">
            {signals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum sinal registrado ainda</p>
              </div>
            ) : (
              signals.map((signal) => {
                const Icon = signalIcon[signal.signal]
                const color = signalColor[signal.signal]

                return (
                  <div
                    key={signal.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${color}`} />
                        <span className={`font-semibold ${color}`}>{signal.signal}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {signal.confidence}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {new Date(signal.timestamp).toLocaleDateString('pt-BR')}
                      </span>
                      <span>
                        {new Date(signal.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>

                    {/* Confidence bar */}
                    <div className="mt-2 w-full bg-white/10 rounded-full h-1 overflow-hidden">
                      <div 
                        className={`h-full ${color.replace('text-', 'bg-')} transition-all duration-500`}
                        style={{ width: `${signal.confidence}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  )
}
