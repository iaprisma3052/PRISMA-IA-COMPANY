import { LucideIcon } from 'lucide-react'
import { Card } from '../ui/card'
import { ArrowUp, ArrowDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
}

export default function StatsCard({ title, value, icon: Icon, trend, trendUp }: StatsCardProps) {
  return (
    <Card className="p-6 glass-effect border-white/10 hover:border-purple-500/50 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
              {trendUp ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              <span>{trend}</span>
            </div>
          )}
        </div>
        
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-500/20 group-hover:from-purple-600/30 group-hover:to-blue-500/30 transition-all duration-300">
          <Icon className="h-6 w-6 text-purple-400" />
        </div>
      </div>
    </Card>
  )
}
