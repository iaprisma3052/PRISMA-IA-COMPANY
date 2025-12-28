import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card } from '../ui/card'

interface SignalDisplayProps {
  result: {
    signal: 'COMPRA' | 'VENDA' | 'NEUTRO'
    confidence: number
    analysis: string
    timestamp: number
  }
}

export default function SignalDisplay({ result }: SignalDisplayProps) {
  const signalConfig = {
    COMPRA: {
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/50',
      label: 'SINAL DE COMPRA'
    },
    VENDA: {
      icon: TrendingDown,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/50',
      label: 'SINAL DE VENDA'
    },
    NEUTRO: {
      icon: Minus,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/50',
      label: 'SINAL NEUTRO'
    }
  }

  const config = signalConfig[result.signal]
  const Icon = config.icon

  return (
    <Card className={`p-6 border-2 ${config.borderColor} ${config.bgColor} animate-slide-up`}>
      <div className="space-y-4">
        {/* Signal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${config.bgColor}`}>
              <Icon className={`h-6 w-6 ${config.color}`} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${config.color}`}>{config.label}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(result.timestamp).toLocaleTimeString('pt-BR')}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Confiança</p>
            <p className={`text-2xl font-bold ${config.color}`}>{result.confidence}%</p>
          </div>
        </div>

        {/* Confidence Bar */}
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full ${config.bgColor} transition-all duration-1000`}
            style={{ width: `${result.confidence}%` }}
          />
        </div>

        {/* Analysis Text */}
        <div className="p-4 rounded-xl bg-black/20 border border-white/10">
          <p className="text-sm text-white/90 leading-relaxed">{result.analysis}</p>
        </div>
      </div>
    </Card>
  )
}
