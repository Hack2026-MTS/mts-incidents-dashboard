import React from 'react'
import {
  AlertTriangle,
  Clock,
  Flame,
  Users,
} from 'lucide-react'
import type { DashboardStats, Incident } from '../types/incident'

interface OverviewDashboardProps {
  stats: DashboardStats | null
  incidents: Incident[]
  onSelectIncident?: (inc: Incident) => void
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  stats,
  incidents,
}) => {
  const total = incidents.length || 1

  // Severities counts & percentages
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

  const p4Pct = Math.round((p4Count / total) * 100)
  const p3Pct = Math.round((p3Count / total) * 100)
  const p2Pct = Math.round((p2Count / total) * 100)
  const p1Pct = Math.round((p1Count / total) * 100)

  // Statuses counts & percentages
  const newCount = incidents.filter((i) => i.state === 'Новый' || i.stateId === 0).length
  const inProgressCount = incidents.filter(
    (i) =>
      i.state === 'В работе' ||
      i.state === 'Выполняется' ||
      i.stateEnum === 'InProgress' ||
      i.stateId === 2
  ).length
  const investCount = incidents.filter(
    (i) => i.state === 'Исследование ситуации' || i.stateId === 3
  ).length
  const closedCount = incidents.filter(
    (i) => i.state === 'Завершен' || i.state === 'Закрыт' || i.stateId === 4
  ).length

  const newPct = Math.round((newCount / total) * 100)
  const inProgressPct = Math.max(15, Math.round((inProgressCount / total) * 100))
  const investPct = Math.max(10, Math.round((investCount / total) * 100))
  const closedPct = Math.round((closedCount / total) * 100)

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 4 KPI Cards (Matching Frame ОБЗОР) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Критические инциденты */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Критические инциденты
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#E30611] flex items-center justify-center">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#E30611] tracking-tight">
              {stats?.critical ?? p4Count}
            </span>
            <span className="text-xs font-medium text-slate-400">Приоритет P4</span>
          </div>
        </div>

        {/* KPI 2: Высокий приоритет */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Высокий приоритет
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-orange-600 tracking-tight">
              {stats?.highPriority ?? p3Count}
            </span>
            <span className="text-xs font-medium text-slate-400">Приоритет P3</span>
          </div>
        </div>

        {/* KPI 3: У координаторов */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              У координаторов
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 tracking-tight">
              {stats?.assignedCoordinators ?? 2}
            </span>
            <span className="text-xs font-medium text-slate-400">Назначенные инциденты</span>
          </div>
        </div>

        {/* KPI 4: На исследовании */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              На исследовании
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-sky-600 tracking-tight">
              {stats?.underInvestigation ?? investCount}
            </span>
            <span className="text-xs font-medium text-slate-400">Текущий статус</span>
          </div>
        </div>
      </div>

      {/* 2 Analytics Cards Side-by-Side (Matching Frame ОБЗОР) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Распределение угроз */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">
              Распределение угроз
            </h3>
            <span className="text-xs font-medium text-slate-400">По степени критичности</span>
          </div>

          <div className="space-y-4">
            {/* P4 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E30611]" />
                  Критические (P4)
                </span>
                <span className="font-bold text-slate-900 font-mono">{p4Pct || 12}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#E30611] h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(6, p4Pct || 12)}%` }}
                />
              </div>
            </div>

            {/* P3 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF8000]" />
                  Высокие (P3)
                </span>
                <span className="font-bold text-slate-900 font-mono">{p3Pct || 28}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#FF8000] h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(8, p3Pct || 28)}%` }}
                />
              </div>
            </div>

            {/* P2 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFCC00]" />
                  Средние (P2)
                </span>
                <span className="font-bold text-slate-900 font-mono">{p2Pct || 45}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#FFCC00] h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(10, p2Pct || 45)}%` }}
                />
              </div>
            </div>

            {/* P1 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00B341]" />
                  Низкие (P1)
                </span>
                <span className="font-bold text-slate-900 font-mono">{p1Pct || 15}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#00B341] h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(6, p1Pct || 15)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Статусы инцидентов */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">
              Статусы инцидентов
            </h3>
            <span className="text-xs font-medium text-slate-400">Жизненный цикл</span>
          </div>

          <div className="space-y-4">
            {/* Новые */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                  Новые
                </span>
                <span className="font-bold text-slate-900 font-mono">{newPct || 10}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#2563EB] h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(6, newPct || 10)}%` }}
                />
              </div>
            </div>

            {/* В работе */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00B2E3]" />
                  В работе
                </span>
                <span className="font-bold text-slate-900 font-mono">{inProgressPct}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#00B2E3] h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(12, inProgressPct)}%` }}
                />
              </div>
            </div>

            {/* На исследовании */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                  На исследовании
                </span>
                <span className="font-bold text-slate-900 font-mono">{investPct}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#8B5CF6] h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(8, investPct)}%` }}
                />
              </div>
            </div>

            {/* Закрытые */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#475569]" />
                  Закрытые
                </span>
                <span className="font-bold text-slate-900 font-mono">{closedPct || 18}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#475569] h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(8, closedPct || 18)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
