import React from 'react'
import type { Incident } from '../types/incident'
import { IncidentCard } from './IncidentCard'

interface ColumnGroupProps {
  title: string
  count: number
  headerBg: string
  headerTextClass?: string
  badgeBg?: string
  incidents: Incident[]
  onCardClick: (inc: Incident) => void
  onQuickReassign?: (inc: Incident, targetGroup: string) => void
}

export const ColumnGroup: React.FC<ColumnGroupProps> = ({
  title,
  count,
  headerBg,
  headerTextClass = 'text-slate-900',
  badgeBg = 'bg-white/80 text-slate-800',
  incidents,
  onCardClick,
  onQuickReassign,
}) => {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-[#F8FAFC] h-[calc(100vh-170px)] min-h-[500px] overflow-hidden shadow-xs">
      {/* Column Header */}
      <div className={`px-4 py-2.5 ${headerBg} flex items-center justify-between border-b border-black/5 flex-shrink-0`}>
        <h2 className={`text-sm font-bold tracking-tight ${headerTextClass}`}>
          {title}
        </h2>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full shadow-xs ${badgeBg}`}>
          {count}
        </span>
      </div>

      {/* Cards Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-300">
        {incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400 text-xs px-4">
            <span className="font-medium">Нет активных инцидентов</span>
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
