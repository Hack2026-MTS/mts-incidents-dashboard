import React from 'react'
import { ArrowUpRight, Flame, X } from 'lucide-react'
import type { Incident } from '../types/incident'

interface EmergencyAlertBannerProps {
  incident: Incident | null
  onOpen: (inc: Incident) => void
  onDismiss: () => void
}

export const EmergencyAlertBanner: React.FC<EmergencyAlertBannerProps> = ({
  incident,
  onOpen,
  onDismiss,
}) => {
  if (!incident) return null

  return (
    <div className="mb-4 bg-[#E30611] text-white rounded-xl shadow-lg p-3.5 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-200">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
          <Flame className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm truncate">{incident.header}</span>
            <span className="text-[10px] font-bold bg-white text-[#E30611] px-1.5 py-0.5 rounded uppercase">
              Срочно
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-red-100 font-mono mt-0.5">
            <span>{incident.id}</span>
            <span>•</span>
            <span>{new Date(incident.submitDate || Date.now()).toLocaleTimeString()}</span>
            {incident.productName && (
              <>
                <span>•</span>
                <span className="text-white font-medium">{incident.productName}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onOpen(incident)}
          className="bg-white text-[#E30611] hover:bg-red-50 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-colors"
        >
          <span>Открыть инцидент</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
