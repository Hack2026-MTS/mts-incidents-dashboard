import React from 'react'
import type { Incident } from '../types/incident'
import { IncidentCard } from './IncidentCard'

interface ColumnGroupProps {
  title: string
  subtitle: string
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
  subtitle,
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
    <div className={`flex flex-col rounded-2xl border ${borderColor} bg-slate-900/40 backdrop-blur min-w-[300px] flex-1 h-[calc(100vh-210px)] overflow-hidden shadow-sm`}>
      {/* Column Header */}
      <div className={`p-3.5 border-b ${borderColor} ${colorHeader}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-sm font-bold text-slate-100">{title}</h2>
          </div>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${badgeColor}`}>
            {count}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 line-clamp-1">{subtitle}</p>
      </div>

      {/* Cards Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 text-xs px-4">
            <p className="font-medium text-slate-400">Нет инцидентов</p>
            <p className="text-[11px] mt-1">В этой категории сейчас нет требующих внимания задач</p>
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
