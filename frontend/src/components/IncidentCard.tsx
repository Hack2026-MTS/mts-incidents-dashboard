import React from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  Clock,
  MessageSquare,
  Sparkles,
  Users,
} from 'lucide-react'
import type { Incident } from '../types/incident'

interface IncidentCardProps {
  incident: Incident
  onClick: (inc: Incident) => void
  onQuickReassign?: (inc: Incident, targetGroup: string) => void
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onClick,
  onQuickReassign,
}) => {
  // Priority chip styling
  const getPriorityBadge = (priority: string, priorityId: number) => {
    if (priorityId === 4 || priority === 'Наивысший' || priority === 'Критический') {
      return (
        <span className="bg-[#E30611] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
          Наивысший
        </span>
      )
    }
    if (priorityId === 3 || priority === 'Высокий') {
      return (
        <span className="bg-[#F97316] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
          Высокий
        </span>
      )
    }
    if (priorityId === 2 || priority === 'Средний') {
      return (
        <span className="bg-[#EAB308] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
          Средний
        </span>
      )
    }
    return (
      <span className="bg-[#3B82F6] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
        Низкий
      </span>
    )
  }

  // Format SLA label
  const getSlaLabel = () => {
    if (!incident.deadline) return 'SLA: 4ч'
    const deadline = new Date(incident.deadline)
    const now = new Date()
    const diffMs = deadline.getTime() - now.getTime()
    if (diffMs <= 0) {
      return 'SLA: Истёк'
    }
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (totalHours >= 24) {
      const days = Math.floor(totalHours / 24)
      const hours = totalHours % 24
      return `SLA: ${days}д ${hours}ч`
    }
    if (totalHours > 0) {
      return `SLA: ${totalHours}ч`
    }
    const minutes = Math.floor(diffMs / (1000 * 60))
    return `SLA: ${minutes}м`
  }

  // Risk percentages & colors (Figma: Риск срыва SLA + Риск эскалации)
  const escalationRisk = Math.round(incident.aiRiskScore || 0)
  const slaRisk = Math.round(
    incident.aiSlaRisk !== undefined
      ? incident.aiSlaRisk
      : Math.min(99, Math.round((incident.aiRiskScore || 25) * 0.85))
  )
  const avgRisk = Math.round((escalationRisk + slaRisk) / 2)

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-[#E30611]'
    if (score >= 40) return 'text-[#F97316]'
    return 'text-slate-700'
  }

  const getRiskIconColor = (score: number) => {
    if (score >= 70) return 'text-[#E30611]'
    if (score >= 40) return 'text-[#F97316]'
    return 'text-slate-400'
  }

  return (
    <div
      onClick={() => onClick(incident)}
      className="group bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all duration-150 p-3.5 flex flex-col justify-between cursor-pointer text-xs"
    >
      <div>
        {/* Top Line: ID & Priority Badge */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-xs font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">
            {incident.id}
          </span>
          {getPriorityBadge(incident.priority, incident.priorityId)}
        </div>

        {/* Title */}
        <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-2.5">
          {incident.header || incident.shortDescription || 'Инцидент без заголовка'}
        </h3>

        {/* Metadata lines with icons */}
        <div className="space-y-1.5 text-slate-600 text-xs mb-3">
          {/* Team / Assigned group */}
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-slate-700 flex-shrink-0" />
            <span className="truncate font-medium text-slate-700">
              {incident.assignedGroupName || 'Не назначена'}
            </span>
          </div>

          {/* SLA */}
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-700 flex-shrink-0" />
            <span className="font-medium text-slate-700">{getSlaLabel()}</span>
          </div>

          {/* SLA Risk */}
          <div className="flex items-center gap-1.5">
            <AlertTriangle className={`h-3.5 w-3.5 flex-shrink-0 ${getRiskIconColor(slaRisk)}`} />
            <span className="text-slate-700">
              Риск срыва SLA:{' '}
              <strong className={`font-bold ${getRiskColor(slaRisk)}`}>
                {slaRisk}%
              </strong>
            </span>
          </div>

          {/* Escalation Risk (Figma: Риск эскалации) */}
          <div className="flex items-center gap-1.5">
            <AlertTriangle className={`h-3.5 w-3.5 flex-shrink-0 ${getRiskIconColor(escalationRisk)}`} />
            <span className="text-slate-700">
              Риск эскалации:{' '}
              <strong className={`font-bold ${getRiskColor(escalationRisk)}`}>
                {escalationRisk}%
              </strong>
            </span>
          </div>

          {/* Average Risk (Ср. риск) */}
          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
            <span className="text-slate-500 font-medium text-[11px]">
              Ср. риск:
            </span>
            <strong className={`font-bold text-xs ${getRiskColor(avgRisk)}`}>
              {avgRisk}%
            </strong>
          </div>
        </div>

        {/* Handover message from team (if present) */}
        {incident.message && (
          <div className="mb-2.5 p-2 rounded-lg bg-amber-50/90 border border-amber-200 text-[11px] leading-snug">
            <div className="flex items-center gap-1 font-semibold text-amber-900 mb-0.5">
              <MessageSquare className="h-3 w-3 text-amber-600 flex-shrink-0" />
              <span>Сообщение координатору:</span>
            </div>
            <p className="line-clamp-2 text-slate-700 italic">
              «{incident.message}»
            </p>
          </div>
        )}

        {/* AI Recommendation hint (if different group suggested) */}
        {incident.aiRoutingHint &&
          incident.aiRoutingHint !== incident.assignedGroupName && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mb-2.5 p-2 rounded-lg bg-indigo-50/80 border border-indigo-100 flex items-center justify-between gap-1 text-[11px]"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles className="h-3 w-3 text-indigo-600 flex-shrink-0" />
                <span className="truncate text-indigo-900 font-medium">
                  ИИ: {incident.aiRoutingHint} ({Math.round(incident.aiRoutingConfidence || 95)}%)
                </span>
              </div>
              {onQuickReassign && (
                <button
                  onClick={() => onQuickReassign(incident, incident.aiRoutingHint)}
                  className="flex-shrink-0 text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 px-1.5 py-0.5 rounded shadow-xs"
                >
                  Перевести
                </button>
              )}
            </div>
          )}
      </div>

      {/* Bottom Button: Открыть инцидент */}
      <button
        type="button"
        className="w-full mt-1 border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs group-hover:border-slate-400"
      >
        <span>Открыть инцидент</span>
        <ArrowUpRight className="h-3.5 w-3.5 text-slate-500" />
      </button>
    </div>
  )
}
