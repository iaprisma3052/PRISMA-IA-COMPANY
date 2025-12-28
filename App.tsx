import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import { Toaster } from './components/ui/toaster'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 dark">
      <Dashboard />
      <Toaster />
    </div>
  )
}

export default App
