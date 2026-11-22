import React, { useState, useEffect } from 'react'
import { Flame, X } from 'lucide-react'
import type { Incident } from '../types/incident'

export interface EmergencyAlertItem {
  id: string
  incident: Incident
  appearedAt: number
}

interface EmergencyAlertBannerProps {
  alerts: EmergencyAlertItem[]
  onOpen: (inc: Incident) => void
  onDismiss: (id: string) => void
}

export const EmergencyAlertBanner: React.FC<EmergencyAlertBannerProps> = ({
  alerts,
  onOpen,
  onDismiss,
}) => {
  const [now, setNow] = useState(Date.now())

  // Update timer every second and auto-dismiss after 60 seconds
  useEffect(() => {
    if (alerts.length === 0) return

    const timer = setInterval(() => {
      const current = Date.now()
      setNow(current)

      alerts.forEach((alert) => {
        if (current - alert.appearedAt >= 60000) {
          onDismiss(alert.id)
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [alerts, onDismiss])

  if (alerts.length === 0) return null

  // Отображаем максимум 6 уведомлений (2 столбца по 3 штуки)
  const displayedAlerts = alerts.slice(0, 6)

  return (
    <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-2.5 flex-shrink-0 select-none">
      {displayedAlerts.map((alert) => {
        const secondsAgo = Math.max(0, Math.floor((now - alert.appearedAt) / 1000))

        return (
          <div
            key={alert.id}
            onClick={() => onOpen(alert.incident)}
            className="bg-[#E30611] text-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer px-3.5 py-2.5 sm:py-3 relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDismiss(alert.id)
              }}
              className="absolute right-2 top-2 p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer z-10"
              title="Скрыть оповещение"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Banner Header + Seconds Ago */}
            <div className="flex items-center justify-between gap-3 pr-7">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-white flex-shrink-0 animate-pulse" />
                <h2
                  className="text-xs sm:text-sm font-bold tracking-tight text-white leading-tight truncate"
                  title={alert.incident.header}
                >
                  {alert.incident.header || 'Массовый сбой в системе'}
                </h2>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-xs sm:text-sm font-black text-white font-mono tracking-tight drop-shadow-xs whitespace-nowrap">
                  {secondsAgo} сек назад
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
