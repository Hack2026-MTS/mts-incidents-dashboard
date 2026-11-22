import React from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  Users,
} from 'lucide-react'
import type { Incident } from '../types/incident'

interface SlaBreachColumnProps {
  incidents: Incident[]
  onCardClick: (inc: Incident) => void
  onQuickReassign?: (inc: Incident, targetGroup: string) => void
}

export const SlaBreachColumn: React.FC<SlaBreachColumnProps> = ({
  incidents,
  onCardClick,
  onQuickReassign,
}) => {
  // Format overdue duration
  const formatSlaOverdue = (deadlineStr?: string) => {
    if (!deadlineStr) return 'Срок истёк'
    const deadline = new Date(deadlineStr).getTime()
    const diffMs = Date.now() - deadline
    if (diffMs <= 0) return '0 мин'
    const totalMinutes = Math.floor(diffMs / (1000 * 60))
    const totalHours = Math.floor(totalMinutes / 60)
    const days = Math.floor(totalHours / 24)
    const hours = totalHours % 24
    const minutes = totalMinutes % 60

    if (days > 0) {
      return `${days}д ${hours}ч`
    }
    if (hours > 0) {
      return `${hours}ч ${minutes}м`
    }
    return `${minutes}м`
  }

  // Priority chip styling
  const getPriorityBadge = (priority: string, priorityId: number) => {
    if (priorityId === 4 || priority === 'Наивысший' || priority === 'Критический') {
      return (
        <span className="bg-[#E30611] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
          Наивысший
        </span>
      )
    }
    if (priorityId === 3 || priority === 'Высокий') {
      return (
        <span className="bg-[#F97316] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
          Высокий
        </span>
      )
    }
    if (priorityId === 2 || priority === 'Средний') {
      return (
        <span className="bg-[#EAB308] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
          Средний
        </span>
      )
    }
    return (
      <span className="bg-[#3B82F6] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
        Низкий
      </span>
    )
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-[#E30611]'
    if (score >= 40) return 'text-[#F97316]'
    return 'text-slate-700'
  }

  return (
    <div className="flex flex-col rounded-2xl border border-rose-300/80 bg-[#FFF5F5]/60 h-[calc(100vh-170px)] min-h-[500px] overflow-hidden shadow-xs">
      {/* Column Header */}
      <div className="px-3.5 py-2.5 bg-[#FFE4E6] flex items-center justify-between border-b border-rose-200/90 flex-shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Clock className="h-4 w-4 text-[#E11D48] flex-shrink-0 animate-pulse" />
          <h2 className="text-sm font-bold tracking-tight text-[#9F1239] truncate">
            Просрочен SLA
          </h2>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full shadow-xs bg-[#E11D48] text-white flex-shrink-0">
          {incidents.length}
        </span>
      </div>

      {/* Cards Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 scrollbar-thin scrollbar-thumb-rose-200">
        {incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400 text-xs px-4 space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-500/80" />
            <span className="font-semibold text-slate-600">Все SLA соблюдаются</span>
            <span className="text-[11px] text-slate-400">Просроченных инцидентов нет</span>
          </div>
        ) : (
          incidents.map((incident) => {
            const escalationRisk = Math.round(incident.aiRiskScore || 0)
            const slaRisk = 100 // Breached / expired
            const avgRisk = Math.round((escalationRisk + slaRisk) / 2)

            return (
              <div
                key={incident.id}
                onClick={() => onCardClick(incident)}
                className="group bg-white rounded-xl border border-rose-200 hover:border-rose-400 hover:shadow-md transition-all duration-150 p-3 flex flex-col justify-between cursor-pointer text-xs"
              >
                <div>
                  {/* Top Alert Line: Overdue pill + Priority badge */}
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <span className="inline-flex items-center gap-1 bg-red-50 text-[#E30611] border border-red-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full tracking-tight">
                      <AlertTriangle className="h-2.5 w-2.5 flex-shrink-0" />
                      <span>{formatSlaOverdue(incident.deadline)}</span>
                    </span>
                    {getPriorityBadge(incident.priority, incident.priorityId)}
                  </div>

                  {/* ID */}
                  <div className="font-mono text-[11px] font-semibold text-slate-400 group-hover:text-slate-600 mb-1 transition-colors">
                    {incident.id}
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2 mb-2">
                    {incident.header || incident.shortDescription || 'Инцидент без заголовка'}
                  </h3>

                  {/* Metadata */}
                  <div className="space-y-1 text-slate-600 text-[11px] mb-2.5">
                    {/* Team */}
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-slate-500 flex-shrink-0" />
                      <span className="truncate font-medium text-slate-700">
                        {incident.assignedGroupName || 'Не назначена'}
                      </span>
                    </div>

                    {/* State */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Статус:</span>
                      <span className="font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        {incident.state}
                      </span>
                    </div>

                    {/* Risks: SLA breached + Average risk */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <span className="text-rose-600 font-semibold">SLA: истёк (100%)</span>
                      <span className="text-slate-500">
                        Ср. риск:{' '}
                        <strong className={`font-bold ${getRiskColor(avgRisk)}`}>
                          {avgRisk}%
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Handover message from team (if present) */}
                  {incident.message && (
                    <div className="mb-2 p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[10.5px] leading-tight">
                      <div className="flex items-center gap-1 font-semibold text-amber-900 mb-0.5">
                        <MessageSquare className="h-2.5 w-2.5 text-amber-600 flex-shrink-0" />
                        <span>Сообщение:</span>
                      </div>
                      <p className="line-clamp-2 text-slate-700 italic">
                        «{incident.message}»
                      </p>
                    </div>
                  )}

                  {/* AI Recommendation hint */}
                  {incident.aiRoutingHint &&
                    incident.aiRoutingHint !== incident.assignedGroupName && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mb-2 p-1.5 rounded-lg bg-indigo-50/90 border border-indigo-100 flex items-center justify-between gap-1 text-[10px]"
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          <Sparkles className="h-2.5 w-2.5 text-indigo-600 flex-shrink-0" />
                          <span className="truncate text-indigo-900 font-medium">
                            ИИ: {incident.aiRoutingHint}
                          </span>
                        </div>
                        {onQuickReassign && (
                          <button
                            onClick={() => onQuickReassign(incident, incident.aiRoutingHint)}
                            className="flex-shrink-0 text-[9px] font-bold text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 px-1 py-0.5 rounded shadow-2xs cursor-pointer"
                          >
                            Перевести
                          </button>
                        )}
                      </div>
                    )}
                </div>

                {/* Bottom Action Button */}
                <button
                  type="button"
                  className="w-full mt-1 border border-rose-200 hover:bg-rose-50 text-rose-900 text-[11px] font-semibold py-1 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors shadow-2xs group-hover:border-rose-300"
                >
                  <span>Открыть инцидент</span>
                  <ArrowUpRight className="h-3 w-3 text-rose-500" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
