import React from 'react'
import {
  AlertCircle,
  ArrowRight,
  Brain,
  CheckCircle,
  Clock,
  ExternalLink,
  Flame,
  Sparkles,
  User,
  Users,
} from 'lucide-react'
import type { Incident } from '../types/incident'

interface IncidentCardProps {
  incident: Incident
  onClick: (inc: Incident) => void
  onQuickReassign?: (inc: Incident, targetGroup: string) => void
}

export const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onClick, onQuickReassign }) => {
  const isCritical = incident.priorityId === 4 || incident.priority === 'Наивысший'
  const isResolved = incident.state === 'Завершен' || incident.state === 'Закрыт'
  const isCoordinator = incident.assignedGroupName === 'КЦ ИТ Координаторы Массовых Инцидентов'
  const isHighPriority = incident.priorityId === 3 || incident.priority === 'Высокий'
  const isUnderInvestigation = incident.state === 'Исследование ситуации'

  // Deadline calculation
  const getDeadlineInfo = (deadlineStr?: string) => {
    if (!deadlineStr) return null
    const deadline = new Date(deadlineStr)
    const now = new Date()
    const diffMs = deadline.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60)) / (1000 * 60))

    if (diffMs < 0) {
      return { text: `Просрочен на ${Math.abs(diffHours)}ч ${diffMins}м`, isOverdue: true }
    }
    if (diffHours < 2) {
      return { text: `Осталось ${diffHours}ч ${diffMins}м`, isUrgent: true }
    }
    return { text: `Осталось ${diffHours}ч`, isNormal: true }
  }

  const deadlineInfo = getDeadlineInfo(incident.deadline)

  // Format submit date
  const formatSubmitDate = (dStr?: string) => {
    if (!dStr) return ''
    try {
      const d = new Date(dStr)
      return d.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dStr
    }
  }

  // Priority badge styling
  const getPriorityBadge = () => {
    if (isCritical) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-900/60 text-red-200 border border-red-700/80 uppercase tracking-wider flex items-center gap-1"><Flame className="h-2.5 w-2.5" /> Критический</span>
    }
    if (isHighPriority) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-950/60 text-orange-300 border border-orange-800">Высокий</span>
    }
    if (incident.priorityId === 2 || incident.priority === 'Средний') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">Средний</span>
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-normal bg-slate-900 text-slate-400 border border-slate-800">Низкий</span>
  }

  // State badge styling
  const getStateBadge = () => {
    if (isResolved) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800 flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5" /> {incident.state}</span>
    }
    if (incident.state === 'Исследование ситуации') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-950/60 text-blue-300 border border-blue-800">Исследование</span>
    }
    if (incident.state === 'Выполняется') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800">В работе</span>
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">Назначен</span>
  }

  // Multi-group tags (showing when an incident belongs to multiple categories)
  const groupTags = []
  if (isCritical) groupTags.push({ label: 'Критический', color: 'bg-red-500/20 text-red-300' })
  if (isCoordinator) groupTags.push({ label: 'У координатора', color: 'bg-amber-500/20 text-amber-300' })
  if (isHighPriority && !isCritical) groupTags.push({ label: 'Высокий приоритет', color: 'bg-orange-500/20 text-orange-300' })
  if (isUnderInvestigation) groupTags.push({ label: 'Исследование', color: 'bg-blue-500/20 text-blue-300' })

  return (
    <div
      onClick={() => onClick(incident)}
      className={`group relative bg-slate-900/90 rounded-xl border p-4 transition-all duration-200 hover:shadow-lg cursor-pointer ${
        isCritical && !isResolved
          ? 'border-red-600/80 shadow-md shadow-red-950/40 hover:border-red-500 ring-1 ring-red-500/30'
          : isResolved
          ? 'border-slate-800/60 opacity-80 hover:opacity-100 hover:border-slate-700'
          : 'border-slate-800 hover:border-slate-700 hover:bg-slate-850'
      }`}
    >
      {/* Top Header: ID, Product, State & Priority */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-xs font-bold text-slate-200 group-hover:text-red-400 transition-colors">
            {incident.id}
          </span>
          {incident.productName && (
            <span className="text-[11px] font-medium text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded truncate max-w-[160px]">
              {incident.productName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {getStateBadge()}
          {getPriorityBadge()}
        </div>
      </div>

      {/* Main Incident Header */}
      <h3 className="text-xs font-medium text-slate-100 leading-snug mb-2 line-clamp-2">
        {incident.header || incident.shortDescription || 'Без заголовка'}
      </h3>

      {/* Timestamps & Deadline */}
      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 mb-3 bg-slate-950/50 p-2 rounded-lg border border-slate-800/40">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-slate-500 flex-shrink-0" />
          <span className="truncate">Рег: {formatSubmitDate(incident.submitDate)}</span>
        </div>
        {deadlineInfo && (
          <div
            className={`flex items-center gap-1 justify-end font-medium ${
              deadlineInfo.isOverdue
                ? 'text-rose-400'
                : deadlineInfo.isUrgent
                ? 'text-amber-400'
                : 'text-slate-400'
            }`}
          >
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{deadlineInfo.text}</span>
          </div>
        )}
      </div>

      {/* Assigned Group & Employee */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 gap-2">
        <div className="flex items-center gap-1 min-w-0">
          <Users className="h-3 w-3 text-slate-500 flex-shrink-0" />
          <span className={`truncate font-medium ${isCoordinator ? 'text-amber-300' : 'text-slate-300'}`}>
            {incident.assignedGroupName || 'Не назначена'}
          </span>
        </div>
        {incident.assignedEmployee && (
          <div className="flex items-center gap-1 flex-shrink-0 text-slate-400">
            <User className="h-3 w-3 text-slate-500" />
            <span className="truncate max-w-[100px]">{incident.assignedEmployee.split(' ')[0]}</span>
          </div>
        )}
      </div>

      {/* AI ENRICHMENTS BLOCK */}
      <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
        {/* 1. Risk Assessment Badge (if High / Critical) */}
        {incident.aiRiskScore >= 50 && !isCritical && (
          <div className="flex items-center justify-between text-[11px] bg-red-950/30 border border-red-900/40 px-2 py-1 rounded-md text-red-300">
            <div className="flex items-center gap-1.5 font-medium">
              <Brain className="h-3.5 w-3.5 text-red-400" />
              <span>Риск эскалации:</span>
            </div>
            <span className="font-bold font-mono text-red-200">{incident.aiRiskScore}%</span>
          </div>
        )}

        {/* 2. Routing Hint (especially for Coordinator group) */}
        {incident.aiRoutingHint && isCoordinator && (
          <div className="bg-amber-950/20 border border-amber-900/40 p-2 rounded-md text-[11px]">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="flex items-center gap-1 text-amber-300 font-medium">
                <Sparkles className="h-3 w-3 text-amber-400" />
                ИИ рекомендует:
              </span>
              <span className="text-[10px] text-amber-400/80 font-mono">
                {incident.aiRoutingConfidence}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="text-slate-200 font-medium truncate text-[11px]">
                {incident.aiRoutingHint}
              </span>
              {onQuickReassign && !isResolved && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onQuickReassign(incident, incident.aiRoutingHint)
                  }}
                  className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 py-0.5 rounded text-[10px] font-bold transition-colors flex-shrink-0 shadow-sm"
                >
                  <span>Передать</span>
                  <ArrowRight className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Multi-group overlap tags */}
      {groupTags.length > 1 && (
        <div className="flex items-center gap-1 mt-2.5 pt-1.5 border-t border-slate-800/40">
          <span className="text-[10px] text-slate-500">Группы:</span>
          {groupTags.map((gt, idx) => (
            <span key={idx} className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${gt.color}`}>
              {gt.label}
            </span>
          ))}
        </div>
      )}

      {/* Bottom ITSM hint */}
      <div className="mt-2 text-right">
        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors">
          Подробнее в ITSM <ExternalLink className="h-2.5 w-2.5" />
        </span>
      </div>
    </div>
  )
}
