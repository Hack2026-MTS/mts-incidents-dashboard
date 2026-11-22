import React from 'react'
import { X } from 'lucide-react'
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

  const timestamp = incident.submitDate
    ? new Date(incident.submitDate).toISOString().replace(/\.\d{3}Z$/, 'Z')
    : new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')

  return (
    <div
      onClick={() => onOpen(incident)}
      className="mb-4 bg-[#E30611] text-white rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer p-3.5 relative overflow-hidden select-none animate-in fade-in slide-in-from-top-3 duration-200"
    >
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDismiss()
        }}
        className="absolute right-3 top-3 p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        title="Скрыть оповещение"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Top Line: Alert Header */}
      <div className="pr-8">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
          {incident.header || 'Отказ Объектив (Камера-сканер)'}
        </h2>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-white/25 my-2.5" />

      {/* Bottom Line: Incident ID on left, ISO timestamp on right */}
      <div className="flex items-center justify-between text-xs sm:text-sm font-mono tracking-wide text-white/95">
        <span className="font-bold">{incident.id}</span>
        <span className="font-medium text-white/90">{timestamp}</span>
      </div>
    </div>
  )
}
