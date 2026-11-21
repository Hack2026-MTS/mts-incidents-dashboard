import React from 'react'
import { Bell, BellOff, Radio, Search } from 'lucide-react'
import type { DashboardStats } from '../types/incident'

interface HeaderProps {
  connected: boolean
  search: string
  onSearchChange: (val: string) => void
  soundEnabled: boolean
  onToggleSound: () => void
  stats: DashboardStats | null
}

export const Header: React.FC<HeaderProps> = ({
  connected,
  search,
  onSearchChange,
  soundEnabled,
  onToggleSound,
  stats,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/95 sticky top-0 z-30 px-4 py-2 flex items-center justify-between gap-3 text-xs">
      {/* Brand & Title */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <span className="bg-red-600 text-white font-black text-[11px] px-2 py-0.5 rounded tracking-wide shadow-sm shadow-red-950">
          МТС
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-slate-100 text-sm tracking-tight">
            Инциденты в фокусе
          </span>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Мониторинг 24/7
          </span>
        </div>
      </div>

      {/* Quick Status Ticker (compact glanceable stats) */}
      {stats && (
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-medium bg-slate-950/70 px-3 py-1 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${stats.critical > 0 ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
            <span className="text-slate-400">Критических:</span>
            <span className={`font-bold font-mono ${stats.critical > 0 ? 'text-red-400' : 'text-slate-300'}`}>
              {stats.critical}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">На координаторах:</span>
            <span className={`font-bold font-mono ${stats.assignedCoordinators > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
              {stats.assignedCoordinators}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Высокий приоритет:</span>
            <span className="font-bold font-mono text-orange-400">{stats.highPriority}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">В работе:</span>
            <span className="font-bold font-mono text-emerald-400">{stats.active}</span>
          </div>
          {stats.slaRiskCount !== undefined && stats.slaRiskCount > 0 && (
            <>
              <span className="text-slate-700">|</span>
              <div className="flex items-center gap-1.5" title="Интеллектуальный прогноз риска срыва SLA">
                <span className="text-amber-400">⏱️ Риск SLA:</span>
                <span className="font-bold font-mono text-amber-300 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/60">
                  {stats.slaRiskCount}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Search & Status Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Compact Search */}
        <div className="relative w-48 sm:w-64">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Поиск по инцидентам..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        {/* Audio Mute toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Звуковой сигнал включен' : 'Звук отключен'}
          className={`p-1.5 rounded-lg border transition-colors ${
            soundEnabled
              ? 'bg-red-950/40 text-red-400 border-red-900/60 hover:bg-red-900/40'
              : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
          }`}
        >
          {soundEnabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
        </button>

        {/* SSE Live status */}
        <div
          title={connected ? 'SSE подключено в реальном времени' : 'Переподключение к серверу...'}
          className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-semibold tracking-wide uppercase ${
            connected
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
              : 'bg-amber-950/40 text-amber-400 border-amber-900/50 animate-pulse'
          }`}
        >
          <Radio className="h-3 w-3" />
          <span className="hidden sm:inline">{connected ? 'LIVE' : 'CONN'}</span>
        </div>
      </div>
    </header>
  )
}
