import React from 'react'
import type { Incident } from '../types/incident'
import { IncidentCard } from './IncidentCard'

interface ColumnGroupProps {
  title: string
  count: number
  icon: React.ReactNode
  colorHeader: string
  borderColor: string
  badgeColor: string
  incidents: Incident[]
  onCardClick: (inc: Incident) => void
  onQuickReassign?: (inc: Incident, targetGroup: string) => void
}

export const ColumnGroup: React.FC<ColumnGroupProps> = ({
  title,
  count,
  icon,
  colorHeader,
  borderColor,
  badgeColor,
  incidents,
  onCardClick,
  onQuickReassign,
}) => {
  return (
    <div className={`flex flex-col rounded-xl border ${borderColor} bg-slate-900/50 backdrop-blur h-[calc(100vh-56px)] overflow-hidden shadow-sm`}>
      {/* Slim Column Header */}
      <div className={`px-3 py-2 border-b ${borderColor} ${colorHeader} flex items-center justify-between`}>
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <h2 className="text-xs font-bold text-slate-100 truncate">{title}</h2>
        </div>
        <span className={`text-xs font-black px-2 py-0.5 rounded-full ${badgeColor}`}>
          {count}
        </span>
      </div>

      {/* Cards Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center text-slate-500 text-xs px-2">
            <span className="font-medium text-slate-400">Нет задач</span>
          </div>
        ) : (
          incidents.map((inc) => (
            <IncidentCard
              key={inc.id}
              incident={inc}
              onClick={onCardClick}
              onQuickReassign={onQuickReassign}
            />
          ))
        )}
      </div>
    </div>
  )
}
