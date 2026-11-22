import React, { useEffect } from 'react'
import { AlertCircle, CheckCircle, Flame, Users, X } from 'lucide-react'
import type { SSEMessage } from '../types/incident'

interface AlertToastProps {
  alerts: SSEMessage[]
  onDismiss: (index: number) => void
}

export const AlertToast: React.FC<AlertToastProps> = ({ alerts, onDismiss }) => {
  useEffect(() => {
    if (alerts.length > 0) {
      const timer = setTimeout(() => {
        onDismiss(alerts.length - 1)
      }, 7000)
      return () => clearTimeout(timer)
    }
  }, [alerts, onDismiss])

  if (alerts.length === 0) return null

  return (
    <div className="fixed top-16 right-6 z-50 space-y-2.5 max-w-sm w-full pointer-events-none select-none">
      {alerts.map((al, idx) => {
        const isCritical = al.type === 'CRITICAL_ALERT'
        const isCoordinator = al.type === 'COORDINATOR_ALERT'
        const isResolved = al.type === 'INCIDENT_RESOLVED'

        let bg = 'bg-white border-slate-200 text-slate-800'
        let icon = <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />

        if (isCritical) {
          bg = 'bg-[#FFF5F5] border-red-200 text-slate-900 shadow-xl shadow-red-500/10 ring-1 ring-red-400'
          icon = <Flame className="h-5 w-5 text-[#E30611] flex-shrink-0 animate-bounce" />
        } else if (isCoordinator) {
          bg = 'bg-[#FFFBEB] border-amber-200 text-slate-900 shadow-xl shadow-amber-500/10'
          icon = <Users className="h-5 w-5 text-amber-600 flex-shrink-0" />
        } else if (isResolved) {
          bg = 'bg-[#F0FDF4] border-emerald-200 text-slate-900 shadow-xl shadow-emerald-500/10'
          icon = <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
        }

        return (
          <div
            key={idx}
            className={`pointer-events-auto p-4 rounded-xl border flex items-start gap-3 backdrop-blur transition-all duration-200 ${bg}`}
          >
            {icon}
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                  {isCritical
                    ? '🔥 Критическое оповещение'
                    : isCoordinator
                    ? '👥 Назначение координатору'
                    : isResolved
                    ? '✅ Инцидент решен'
                    : 'Событие дашборда'}
                </span>
                <span className="text-[10px] text-slate-400">Только что</span>
              </div>
              <p className="font-medium text-slate-900 leading-snug">
                {al.message}
              </p>
            </div>
            <button
              onClick={() => onDismiss(idx)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
