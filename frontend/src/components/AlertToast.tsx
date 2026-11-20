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
    <div className="fixed top-16 right-6 z-50 space-y-2 max-w-md w-full pointer-events-none">
      {alerts.map((al, idx) => {
        const isCritical = al.type === 'CRITICAL_ALERT'
        const isCoordinator = al.type === 'COORDINATOR_ALERT'
        const isResolved = al.type === 'INCIDENT_RESOLVED'

        let bg = 'bg-slate-900 border-slate-750 text-slate-100'
        let icon = <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />

        if (isCritical) {
          bg = 'bg-red-950/95 border-red-600 text-white shadow-xl shadow-red-950/60 ring-1 ring-red-500 animate-bounce'
          icon = <Flame className="h-5 w-5 text-red-400 flex-shrink-0" />
        } else if (isCoordinator) {
          bg = 'bg-amber-950/95 border-amber-600 text-amber-50 shadow-xl shadow-amber-950/40 ring-1 ring-amber-500'
          icon = <Users className="h-5 w-5 text-amber-400 flex-shrink-0" />
        } else if (isResolved) {
          bg = 'bg-emerald-950/95 border-emerald-600 text-emerald-50 shadow-xl shadow-emerald-950/40'
          icon = <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
        }

        return (
          <div
            key={idx}
            className={`pointer-events-auto p-4 rounded-xl border flex items-start gap-3 backdrop-blur transition-all duration-200 ${bg}`}
          >
            {icon}
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold uppercase tracking-wider text-[10px] opacity-80">
                  {isCritical
                    ? 'Срочное оповещение'
                    : isCoordinator
                    ? 'Назначение координатору'
                    : isResolved
                    ? 'Инцидент решен'
                    : 'Событие дашборда'}
                </span>
                <span className="text-[10px] opacity-60">Только что</span>
              </div>
              <p className="font-medium leading-snug">{al.message}</p>
            </div>
            <button
              onClick={() => onDismiss(idx)}
              className="p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
