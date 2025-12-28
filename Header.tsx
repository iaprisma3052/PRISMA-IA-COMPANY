import { Brain, Settings } from 'lucide-react'
import { Button } from '../ui/button'

export default function Header() {
  return (
    <header className="border-b border-white/10 backdrop-blur-xl bg-black/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 rounded-xl blur-lg opacity-75 animate-pulse-glow"></div>
              <div className="relative bg-gradient-to-br from-purple-600 to-blue-500 p-2 rounded-xl">
                <Brain className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">PRISMA IA</h1>
              <p className="text-xs text-muted-foreground">Trading Bot com Visão Computacional</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full glass-effect">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-white">Sistema Online</span>
            </div>
            
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
