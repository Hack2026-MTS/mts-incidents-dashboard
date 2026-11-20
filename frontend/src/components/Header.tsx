import React from 'react'
import { Bell, BellOff, Radio, Search } from 'lucide-react'

interface HeaderProps {
  connected: boolean
  search: string
  onSearchChange: (val: string) => void
  soundEnabled: boolean
  onToggleSound: () => void
  showResolved: boolean
  onToggleShowResolved: () => void
}

export const Header: React.FC<HeaderProps> = ({
  connected,
  search,
  onSearchChange,
  soundEnabled,
  onToggleSound,
  showResolved,
  onToggleShowResolved,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-6 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded tracking-wider shadow-sm shadow-red-900/30">
            МТС
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Инциденты в фокусе
              <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                Дашборд Координатора
              </span>
            </h1>
          </div>
        </div>

        {/* Center Search */}
        <div className="flex-1 max-w-md min-w-[240px]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по номеру (INC...), сервису, описанию или команде..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
            />
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 text-xs">
          {/* Active / Resolved Toggle */}
          <button
            onClick={onToggleShowResolved}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              showResolved
                ? 'bg-slate-800 text-slate-200 border-slate-700'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {showResolved ? 'Показаны все' : 'Только активные'}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Звуковые алерты включены' : 'Звук выключен'}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-red-950/40 text-red-400 border-red-900/60 hover:bg-red-900/40'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </button>

          {/* SSE Connection Status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${
              connected
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60'
                : 'bg-amber-950/40 text-amber-400 border-amber-900/60 animate-pulse'
            }`}
          >
            <Radio className="h-3 w-3" />
            <span>{connected ? 'LIVE (SSE)' : 'Подключение...'}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
