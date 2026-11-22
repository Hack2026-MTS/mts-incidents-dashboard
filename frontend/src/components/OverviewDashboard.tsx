import React, { useMemo } from 'react'
import { Clock } from 'lucide-react'
import type { DashboardStats, Incident } from '../types/incident'

interface OverviewDashboardProps {
  stats: DashboardStats | null
  incidents: Incident[]
  onSelectIncident?: (inc: Incident) => void
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  stats,
  incidents,
  onSelectIncident,
}) => {
  const total = incidents.length || 0

  // 1. Threat counts
  const p4Count = incidents.filter(
    (i) => i.priorityId === 4 || i.priority === 'Наивысший' || i.priority === 'Критический'
  ).length
  const p3Count = incidents.filter(
    (i) => i.priorityId === 3 || i.priority === 'Высокий'
  ).length
  const p2Count = incidents.filter(
    (i) => i.priorityId === 2 || i.priority === 'Средний'
  ).length
  const p1Count = incidents.filter(
    (i) => i.priorityId === 1 || i.priority === 'Низкий'
  ).length

  const sumThreats = total || 1
  const threatBars = [
    {
      label: 'Критические (P4)',
      count: p4Count,
      color: '#E30611',
      pct: total > 0 ? Math.round((p4Count / sumThreats) * 100) : 12,
    },
    {
      label: 'Высокие (P3)',
      count: p3Count,
      color: '#F97316',
      pct: total > 0 ? Math.round((p3Count / sumThreats) * 100) : 28,
    },
    {
      label: 'Средние (P2)',
      count: p2Count,
      color: '#EAB308',
      pct: total > 0 ? Math.round((p2Count / sumThreats) * 100) : 45,
    },
    {
      label: 'Низкие (P1)',
      count: p1Count,
      color: '#22C55E',
      pct: total > 0 ? Math.round((p1Count / sumThreats) * 100) : 15,
    },
  ]

  // 2. Statuses counts
  const newCount = incidents.filter(
    (i) => i.state?.trim() === 'Новый' || !i.assignedGroupName
  ).length
  const inProgressCount = incidents.filter(
    (i) => i.state?.trim() === 'Выполняется' || i.state?.trim() === 'В работе'
  ).length
  const investCount = incidents.filter(
    (i) => i.state?.trim() === 'Исследование ситуации' || i.state?.trim() === 'Диагностика'
  ).length
  const closedCount = incidents.filter(
    (i) => i.state?.trim() === 'Завершен' || i.state?.trim() === 'Закрыт'
  ).length

  const statusBars = [
    {
      label: 'Новые',
      count: newCount,
      color: '#3B82F6',
      pct: total > 0 ? Math.max(8, Math.round((newCount / sumThreats) * 100)) : 10,
    },
    {
      label: 'В работе',
      count: inProgressCount,
      color: '#06B6D4',
      pct: total > 0 ? Math.max(25, Math.round((inProgressCount / sumThreats) * 100)) : 45,
    },
    {
      label: 'На исследовании',
      count: investCount,
      color: '#A855F7',
      pct: total > 0 ? Math.max(10, Math.round((investCount / sumThreats) * 100)) : 20,
    },
    {
      label: 'Закрытые',
      count: closedCount,
      color: '#64748B',
      pct: total > 0 ? Math.max(15, Math.round((closedCount / sumThreats) * 100)) : 25,
    },
  ]

  // Active incidents list (filter out closed if needed or show top active)
  const activeIncidents = useMemo(() => {
    return incidents.slice(0, 20)
  }, [incidents])

  const getPriorityDot = (inc: Incident) => {
    if (inc.priorityId === 4 || inc.priority === 'Наивысший' || inc.priority === 'Критический') {
      return 'bg-[#E30611]'
    }
    if (inc.priorityId === 3 || inc.priority === 'Высокий') {
      return 'bg-[#F97316]'
    }
    if (inc.priorityId === 2 || inc.priority === 'Средний') {
      return 'bg-[#EAB308]'
    }
    return 'bg-[#22C55E]'
  }

  const formatSubmitTime = (dateStr?: string) => {
    if (!dateStr) return 'Сегодня, 14:27'
    try {
      const d = new Date(dateStr)
      return `Сегодня, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } catch {
      return 'Сегодня, 14:27'
    }
  }

  const formatSlaRemaining = (deadlineStr?: string) => {
    if (!deadlineStr) return '00:18 до SLA'
    try {
      const deadline = new Date(deadlineStr).getTime()
      const diffMs = deadline - Date.now()
      if (diffMs <= 0) return '00:00 (просрочен)'
      const hours = Math.floor(diffMs / (3600 * 1000))
      const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000))
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')} до SLA`
    } catch {
      return '00:18 до SLA'
    }
  }

  return (
    <div className="space-y-6 pb-6 select-none animate-in fade-in duration-150">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Мониторинг инцидентов
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          мониторинг и координация массовых инцидентов
        </p>
      </div>

      {/* 4 KPI Summary Cards (Figma Frame ОБЗОР) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Критические инциденты */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">
            Критические инциденты
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            {stats?.critical !== undefined ? stats.critical : '-'}
          </div>
          <span className="text-[11px] font-medium text-slate-400 mt-2 block">
            Приоритет P4
          </span>
        </div>

        {/* Card 2: Высокий приоритет */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">
            Высокий приоритет
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            {stats?.highPriority !== undefined ? stats.highPriority : '-'}
          </div>
          <span className="text-[11px] font-medium text-slate-400 mt-2 block">
            Приоритет P3
          </span>
        </div>

        {/* Card 3: У координаторов */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">
            У координаторов
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            {stats?.assignedCoordinators !== undefined ? stats.assignedCoordinators : '-'}
          </div>
          <span className="text-[11px] font-medium text-slate-400 mt-2 block">
            Назначенные инциденты
          </span>
        </div>

        {/* Card 4: На исследовании */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">
            На исследовании
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            {stats?.underInvestigation !== undefined ? stats.underInvestigation : '-'}
          </div>
          <span className="text-[11px] font-medium text-slate-400 mt-2 block">
            Текущий статус
          </span>
        </div>
      </div>

      {/* 2 Side-by-Side Analytics Cards: Распределение угроз и Статусы инцидентов */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Card 1: Распределение угроз */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <h2 className="font-bold text-slate-900 text-sm sm:text-base mb-4">
            Распределение угроз
          </h2>
          <div className="space-y-4">
            {threatBars.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-600">{item.label}</span>
                  <span className="font-bold text-slate-800 font-mono">{item.pct}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.pct}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Статусы инцидентов */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <h2 className="font-bold text-slate-900 text-sm sm:text-base mb-4">
            Статусы инцидентов
          </h2>
          <div className="space-y-4">
            {statusBars.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-600">{item.label}</span>
                  <span className="font-bold text-slate-800 font-mono">{item.pct}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.pct}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Активные инциденты */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4">
          <h2 className="font-bold text-slate-900 text-sm sm:text-base">
            Активные инциденты
          </h2>
          <span className="bg-rose-50 text-[#E30611] font-bold px-2 py-0.5 rounded-full text-xs">
            {stats?.active || total}
          </span>
        </div>

        {/* Clean Table matching Figma */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Продукт</th>
                <th className="py-2.5 px-3">Время возникновения</th>
                <th className="py-2.5 px-3">Исполнитель</th>
                <th className="py-2.5 px-3">Статус</th>
                <th className="py-2.5 px-3">Срок решения</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
              {activeIncidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    Нет активных инцидентов
                  </td>
                </tr>
              ) : (
                activeIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => onSelectIncident && onSelectIncident(inc)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* ID with colored status dot */}
                    <td className="py-3 px-3 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getPriorityDot(inc)} flex-shrink-0`} />
                      <span className="font-semibold text-slate-900 group-hover:text-[#E30611] transition-colors">
                        #{inc.id}
                      </span>
                    </td>

                    {/* Продукт */}
                    <td className="py-3 px-3 text-slate-800">
                      {inc.productName || inc.service || 'Мобильная сеть'}
                    </td>

                    {/* Время возникновения */}
                    <td className="py-3 px-3 text-slate-500">
                      {formatSubmitTime(inc.submitDate)}
                    </td>

                    {/* Исполнитель */}
                    <td className="py-3 px-3 text-slate-800">
                      {inc.assignedGroupName || 'Сетевая команда'}
                    </td>

                    {/* Статус badge */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          inc.state === 'Выполняется' || inc.state === 'В работе'
                            ? 'bg-sky-50 text-sky-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {inc.state || 'В работе'}
                      </span>
                    </td>

                    {/* Срок решения / SLA */}
                    <td className="py-3 px-3 text-[#E30611] font-semibold flex items-center gap-1.5 whitespace-nowrap">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{formatSlaRemaining(inc.deadline)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
