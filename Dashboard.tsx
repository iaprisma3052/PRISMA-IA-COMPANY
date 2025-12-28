import { useState, useEffect } from 'react'
import Header from '../components/layout/Header'
import ChartAnalyzer from '../components/features/ChartAnalyzer'
import SignalHistory from '../components/features/SignalHistory'
import StatsCard from '../components/features/StatsCard'
import { Activity, TrendingUp, Eye, Zap } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    successRate: 0,
    activeSignals: 0,
    uptime: 0
  })

  useEffect(() => {
    // Simulate uptime counter
    const interval = setInterval(() => {
      setStats(prev => ({ ...prev, uptime: prev.uptime + 1 }))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total de Análises"
            value={stats.totalAnalyses}
            icon={Activity}
            trend="+12%"
            trendUp
          />
          <StatsCard
            title="Taxa de Sucesso"
            value={`${stats.successRate.toFixed(1)}%`}
            icon={TrendingUp}
            trend="+5.2%"
            trendUp
          />
          <StatsCard
            title="Sinais Ativos"
            value={stats.activeSignals}
            icon={Eye}
            trend="3 novos"
            trendUp
          />
          <StatsCard
            title="Tempo Ativo"
            value={`${Math.floor(stats.uptime / 60)}m ${stats.uptime % 60}s`}
            icon={Zap}
            trend="Online"
            trendUp
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Analyzer - Takes 2 columns */}
          <div className="lg:col-span-2">
            <ChartAnalyzer onAnalysisComplete={(data) => {
              setStats(prev => ({
                ...prev,
                totalAnalyses: prev.totalAnalyses + 1,
                activeSignals: data.signal !== 'NEUTRO' ? prev.activeSignals + 1 : prev.activeSignals,
                successRate: data.confidence || prev.successRate
              }))
            }} />
          </div>

          {/* Signal History - Takes 1 column */}
          <div className="lg:col-span-1">
            <SignalHistory />
          </div>
        </div>
      </main>
    </div>
  )
}
