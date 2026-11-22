import React, { useEffect } from 'react'
import { AlertCircle, ArrowRightLeft, CheckCircle, Flame, Users, X } from 'lucide-react'
import type { NotificationItem } from '../types/incident'

interface AlertToastProps {
  toasts: NotificationItem[]
  onDismiss: (id: string) => void
  onSelectIncidentById?: (id: string) => void
}

export const AlertToast: React.FC<AlertToastProps> = ({ toasts, onDismiss, onSelectIncidentById }) => {
  // Individual auto-dismiss for each toast
  useEffect(() => {
    if (toasts.length === 0) return
    const newest = toasts[0]
    const timer = setTimeout(() => {
      onDismiss(newest.id)
    }, 6000)
    return () => clearTimeout(timer)
  }, [toasts, onDismiss])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-16 right-6 z-50 space-y-2.5 max-w-sm w-full pointer-events-none select-none">
      {toasts.map((toast) => {
        const isCritical = toast.type === 'CRITICAL_ALERT'
        const isCoordinator = toast.type === 'COORDINATOR_ALERT'
        const isResolved = toast.type === 'INCIDENT_RESOLVED'
        const isStateChanged = toast.type === 'STATE_CHANGED'
        const isReassigned = toast.type === 'REASSIGNED'

        let bg = 'bg-white border-slate-200 text-slate-800 shadow-lg'
        let icon = <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />

        if (isCritical) {
          bg = 'bg-[#FFF5F5] border-red-300 text-slate-900 shadow-xl shadow-red-500/15 ring-1 ring-red-400'
          icon = <Flame className="h-5 w-5 text-[#E30611] flex-shrink-0 animate-bounce" />
        } else if (isCoordinator) {
          bg = 'bg-[#FFFBEB] border-amber-300 text-slate-900 shadow-xl shadow-amber-500/10'
          icon = <Users className="h-5 w-5 text-amber-600 flex-shrink-0" />
        } else if (isResolved) {
          bg = 'bg-[#F0FDF4] border-emerald-300 text-slate-900 shadow-xl shadow-emerald-500/10'
          icon = <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
        } else if (isStateChanged) {
          bg = 'bg-[#EFF6FF] border-blue-200 text-slate-900 shadow-lg'
          icon = <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
        } else if (isReassigned) {
          bg = 'bg-[#FAF5FF] border-purple-200 text-slate-900 shadow-lg'
          icon = <ArrowRightLeft className="h-5 w-5 text-purple-600 flex-shrink-0" />
        }

        const targetIncidentId = toast.incidentId || toast.message.match(/INC\d+/)?.[0]

        return (
          <div
            key={toast.id}
            onClick={() => {
              if (targetIncidentId && onSelectIncidentById) {
                onSelectIncidentById(targetIncidentId)
                onDismiss(toast.id)
              }
            }}
            className={`pointer-events-auto p-3.5 rounded-xl border flex items-start gap-3 backdrop-blur-sm transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${
              targetIncidentId ? 'cursor-pointer hover:scale-[1.01]' : ''
            } ${bg}`}
          >
            {icon}
            <div className="flex-1 text-xs min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 truncate mr-2">
                  {toast.title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                  {new Date(toast.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
              <p className="font-semibold text-slate-900 leading-snug break-words">
                {toast.message}
              </p>
              {targetIncidentId && (
                <span className="inline-block mt-1.5 text-[10px] font-bold text-sky-600 hover:underline">
                  Перейти к инциденту #{targetIncidentId} →
                </span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDismiss(toast.id)
              }}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer flex-shrink-0"
              title="Закрыть"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
