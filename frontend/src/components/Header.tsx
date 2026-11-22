import React, { useState, useEffect, useRef } from 'react'
import {
  Bell,
  Check,
  CheckCircle2,
  Flame,
  Search,
  Trash2,
  User,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import type { DashboardStats, NotificationItem } from '../types/incident'
import { soundAlert } from '../utils/audio'

interface HeaderProps {
  connected: boolean
  search: string
  onSearchChange: (val: string) => void
  soundEnabled: boolean
  onToggleSound: () => void
  stats?: DashboardStats | null
  notifications?: NotificationItem[]
  onMarkAllRead?: () => void
  onClearNotifications?: () => void
  onSelectIncidentById?: (id: string) => void
}

export const Header: React.FC<HeaderProps> = ({
  connected,
  search,
  onSearchChange,
  soundEnabled,
  onToggleSound,
  notifications = [],
  onMarkAllRead,
  onClearNotifications,
  onSelectIncidentById,
}) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  const handleOpenNotifications = () => {
    setShowNotifications((prev) => !prev)
    if (!showNotifications && unreadCount > 0 && onMarkAllRead) {
      // Mark as read when opening
      onMarkAllRead()
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 px-4 md:px-6 py-2.5 flex items-center justify-between gap-4 text-xs select-none">
      {/* Left: MTS Logo & Title */}
      <div className="flex items-center gap-3.5 flex-shrink-0">
        {/* Red MTS Square Logo (Official 2023 brandmark: М top-left, Т top-right, С bottom-right) */}
        <div
          className="w-8 h-8 bg-[#E30611] rounded-[5px] p-1 flex flex-col justify-between select-none flex-shrink-0 shadow-xs"
          title="МТС"
        >
          <div className="flex justify-between items-start leading-none font-black text-white text-[10.5px] px-0.5">
            <span>М</span>
            <span>Т</span>
          </div>
          <div className="flex justify-end items-end leading-none font-black text-white text-[10.5px] px-0.5">
            <span>С</span>
          </div>
        </div>

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
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
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
          title={
            soundEnabled
              ? 'Звуковые оповещения включены (нажмите для выключения)'
              : 'Звук выключен (нажмите для включения)'
          }
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

        {/* Notification Bell with Badge and Persistent History Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleOpenNotifications}
            className={`relative p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showNotifications
                ? 'bg-slate-200 border-slate-300 text-slate-900'
                : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Уведомления и события"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-[#E30611] text-white text-[9px] font-bold rounded-full px-1 flex items-center justify-center animate-pulse shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-3.5 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">Центр уведомлений</span>
                  {notifications.length > 0 && (
                    <span className="bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                      {notifications.length}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && onMarkAllRead && (
                    <button
                      onClick={onMarkAllRead}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                      title="Отметить все прочитанными"
                    >
                      <Check className="h-3 w-3" />
                      <span>Прочитано</span>
                    </button>
                  )}
                  {notifications.length > 0 && onClearNotifications && (
                    <button
                      onClick={onClearNotifications}
                      className="text-[11px] font-semibold text-slate-400 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                      title="Очистить историю"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 space-y-1">
                    <Bell className="h-6 w-6 mx-auto text-slate-300 opacity-60" />
                    <p className="font-medium text-slate-500">Нет уведомлений</p>
                    <p className="text-[11px]">Все оповещения о сбоях и переходах отображаются здесь</p>
                  </div>
                ) : (
                  notifications.map((item) => {
                    const isCritical = item.type === 'CRITICAL_ALERT'
                    const isCoordinator = item.type === 'COORDINATOR_ALERT'
                    const isResolved = item.type === 'INCIDENT_RESOLVED'
                    const targetIncidentId = item.incidentId || item.message.match(/INC\d+/)?.[0]

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (targetIncidentId && onSelectIncidentById) {
                            onSelectIncidentById(targetIncidentId)
                            setShowNotifications(false)
                          }
                        }}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          !item.read
                            ? 'bg-red-50/30 border-red-100 hover:bg-red-50/60'
                            : 'bg-slate-50 border-slate-100 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] mb-1 font-semibold">
                          <span className="flex items-center gap-1.5">
                            {isCritical && <Flame className="h-3.5 w-3.5 text-[#E30611]" />}
                            {isCoordinator && <Users className="h-3.5 w-3.5 text-amber-600" />}
                            {isResolved && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                            <span
                              className={
                                isCritical
                                  ? 'text-[#E30611]'
                                  : isCoordinator
                                  ? 'text-amber-700'
                                  : isResolved
                                  ? 'text-emerald-700'
                                  : 'text-slate-700'
                              }
                            >
                              {item.title}
                            </span>
                          </span>
                          <span className="text-slate-400 font-mono font-normal">
                            {new Date(item.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-800 text-[11px] font-medium leading-snug">
                          {item.message}
                        </p>
                        {targetIncidentId && (
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1">
                              <span>Перейти к инциденту #{targetIncidentId}</span>
                              <span>→</span>
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile avatar */}
        <div
          className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shadow-xs cursor-pointer hover:bg-slate-200 transition-colors"
          title="Оператор Ситуационного Центра МТС"
        >
          <User className="h-4 w-4 text-slate-700" />
        </div>
      </div>
    </header>
  )
}
