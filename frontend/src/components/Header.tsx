import React, { useState, useEffect } from 'react'
import {
  Bell,
  Search,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import type { DashboardStats, SSEMessage } from '../types/incident'
import { soundAlert } from '../utils/audio'

interface HeaderProps {
  connected: boolean
  search: string
  onSearchChange: (val: string) => void
  soundEnabled: boolean
  onToggleSound: () => void
  stats?: DashboardStats | null
  alerts?: SSEMessage[]
}

export const Header: React.FC<HeaderProps> = ({
  connected,
  search,
  onSearchChange,
  soundEnabled,
  onToggleSound,
  alerts = [],
}) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      setCurrentTime(`${hours}:${minutes}`)
    }
    updateTime()
    const timer = setInterval(updateTime, 10000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 px-4 md:px-6 py-2.5 flex items-center justify-between gap-4 text-xs select-none">
      {/* Left: MTS Logo & Title */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Red MTS Square Logo */}
        <div className="w-8 h-8 bg-[#E30611] rounded flex items-center justify-center font-black text-white text-[12px] tracking-tight shadow-sm">
          МТС
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-slate-200" />

        {/* MTS Brand text */}
        <span className="font-semibold text-slate-400 text-xs tracking-wider">
          МТС
        </span>

        {/* Separator */}
        <div className="h-5 w-px bg-slate-200" />

        {/* Section title */}
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-slate-900 text-sm tracking-tight">
            Мониторинг инцидентов
          </span>
        </div>
      </div>

      {/* Center: Search input */}
      <div className="flex-1 max-w-md mx-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по ID, продукту или команде"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#F1F5F9] border border-transparent hover:border-slate-300 focus:border-[#E30611] focus:bg-white rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-xs"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Live Status, Controls & Profile */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Live SSE Pulse */}
        <div className="flex items-center gap-2 text-slate-600 font-medium bg-slate-100/80 px-2.5 py-1 rounded-full text-[11px]">
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
          <span>Обновлено {currentTime || '21:45'}</span>
        </div>

        {/* Sound toggle button */}
        <button
          onClick={() => {
            soundAlert.unlock()
            onToggleSound()
            if (!soundEnabled) {
              soundAlert.playCoordinatorAlert()
            }
          }}
          title={soundEnabled ? 'Звуковые оповещения включены (нажмите для проверки/отключения)' : 'Звук выключен (нажмите для включения)'}
          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
            soundEnabled
              ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
          }`}
        >
          {soundEnabled ? (
            <Volume2 className="h-4 w-4 text-[#E30611]" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Уведомления"
          >
            <Bell className="h-4 w-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E30611] text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900">События дашборда</span>
                <span className="text-[10px] text-slate-500">{alerts.length} событий</span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {alerts.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">Нет новых уведомлений</p>
                ) : (
                  alerts.slice(0, 5).map((al, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1 font-semibold">
                        <span
                          className={
                            al.type === 'CRITICAL_ALERT'
                              ? 'text-[#E30611]'
                              : al.type === 'COORDINATOR_ALERT'
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }
                        >
                          {al.type === 'CRITICAL_ALERT'
                            ? '🔥 Критический инцидент'
                            : al.type === 'COORDINATOR_ALERT'
                            ? '👥 Назначение координатору'
                            : '✅ Решено'}
                        </span>
                        <span className="text-slate-400 font-normal">
                          {new Date(al.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-800 text-[11px] font-medium leading-snug">
                        {al.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile avatar */}
        <div
          className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shadow-xs cursor-pointer hover:bg-slate-200 transition-colors"
          title="Профиль оператора"
        >
          <User className="h-4 w-4 text-slate-700" />
        </div>
      </div>
    </header>
  )
}
