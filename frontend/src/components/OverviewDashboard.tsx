import React, { useState, useMemo } from 'react'
import {
  AlertTriangle,
  Clock,
  Flame,
  PieChart,
  ShieldAlert,
  Users,
} from 'lucide-react'
import type { DashboardStats, Incident } from '../types/incident'

interface OverviewDashboardProps {
  stats: DashboardStats | null
  incidents: Incident[]
  onSelectIncident?: (inc: Incident) => void
}

interface DonutSlice {
  label: string
  count: number
  color: string
  pct: number
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  stats,
  incidents,
}) => {
  const [activeThreatSlice, setActiveThreatSlice] = useState<string | null>(null)
  const [activeStatusSlice, setActiveStatusSlice] = useState<string | null>(null)

  const total = incidents.length || 0

  // 1. Severities (Threat Distribution) calculation
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

  const threatSlices: DonutSlice[] = useMemo(() => {
    const sum = total || 1
    return [
      {
        label: 'Критические (P4)',
        count: p4Count,
        color: '#E30611',
        pct: total > 0 ? Math.round((p4Count / sum) * 100) : 0,
      },
      {
        label: 'Высокие (P3)',
        count: p3Count,
        color: '#FF7A00',
        pct: total > 0 ? Math.round((p3Count / sum) * 100) : 0,
      },
      {
        label: 'Средние (P2)',
        count: p2Count,
        color: '#FFB800',
        pct: total > 0 ? Math.round((p2Count / sum) * 100) : 0,
      },
      {
        label: 'Низкие (P1)',
        count: p1Count,
        color: '#10B981',
        pct: total > 0 ? Math.round((p1Count / sum) * 100) : 0,
      },
    ]
  }, [total, p4Count, p3Count, p2Count, p1Count])

  // 2. Statuses (Lifecycle Distribution) calculation - strictly matching canonical state names
  const assignedCount = incidents.filter(
    (i) => i.state?.trim() === 'Назначен' || i.state?.trim() === 'Назначен координатору'
  ).length
  const inProgressCount = incidents.filter(
    (i) => i.state?.trim() === 'Выполняется' || i.state?.trim() === 'В работе'
  ).length
  const investCount = incidents.filter(
    (i) => i.state?.trim() === 'Исследование ситуации'
  ).length
  const resolvedCount = incidents.filter(
    (i) => i.state?.trim() === 'Завершен' || i.state?.trim() === 'Закрыт'
  ).length

  const statusSlices: DonutSlice[] = useMemo(() => {
    const sum = total || 1
    return [
      {
        label: 'Назначен',
        count: assignedCount,
        color: '#2563EB', // Royal Blue
        pct: total > 0 ? Math.round((assignedCount / sum) * 100) : 0,
      },
      {
        label: 'Выполняется',
        count: inProgressCount,
        color: '#00B2E3', // Cyan/Sky
        pct: total > 0 ? Math.round((inProgressCount / sum) * 100) : 0,
      },
      {
        label: 'Исследование ситуации',
        count: investCount,
        color: '#8B5CF6', // Purple/Violet
        pct: total > 0 ? Math.round((investCount / sum) * 100) : 0,
      },
      {
        label: 'Завершен / Закрыт',
        count: resolvedCount,
        color: '#10B981', // Emerald
        pct: total > 0 ? Math.round((resolvedCount / sum) * 100) : 0,
      },
    ]
  }, [total, assignedCount, inProgressCount, investCount, resolvedCount])

  // Helper to render SVG Donut chart
  const renderDonut = (
    slices: DonutSlice[],
    activeSlice: string | null,
    onHover: (label: string | null) => void,
    centerTitle: string,
    centerValue: number | string
  ) => {
    const radius = 54
    const circumference = 2 * Math.PI * radius
    let accumulatedOffset = 0
    const nonZeroSlices = slices.filter((s) => s.count > 0)
    const totalCount = slices.reduce((acc, s) => acc + s.count, 0)

    return (
      <div className="relative flex items-center justify-center w-48 h-48 mx-auto flex-shrink-0">
        <svg viewBox="0 0 140 140" className="w-full h-full transform -rotate-90">
          {/* Base background ring */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth="16"
          />

          {totalCount === 0 ? (
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="16"
            />
          ) : (
            nonZeroSlices.map((slice) => {
              const fraction = slice.count / totalCount
              const strokeLength = fraction * circumference
              const currentOffset = accumulatedOffset
              accumulatedOffset += strokeLength

              const isHovered = activeSlice === slice.label
              return (
                <circle
                  key={slice.label}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={isHovered ? 20 : 16}
                  strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                  strokeDashoffset={-currentOffset}
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    filter: isHovered ? 'drop-shadow(0px 0px 6px rgba(0,0,0,0.25))' : 'none',
                  }}
                  onMouseEnter={() => onHover(slice.label)}
                  onMouseLeave={() => onHover(null)}
                />
              )
            })
          )}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none">
          <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
            {centerValue}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            {centerTitle}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-200">
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
            <span className="text-xs font-medium text-slate-400">Массовые инциденты</span>
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
            <span className="text-xs font-medium text-slate-400">Диагностика причин</span>
          </div>
        </div>
      </div>

      {/* 2 Круговых графика (Donut Charts): Распределение угроз и Статусы инцидентов */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* График 1: Распределение угроз (Круговой Donut) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-50 text-[#E30611] flex items-center justify-center">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Распределение угроз</h3>
                <p className="text-[11px] text-slate-400">По степени критичности P1–P4</p>
              </div>
            </div>
            <span className="text-xs font-bold font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              Всего: {total}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
            {/* Круговая диаграмма */}
            {renderDonut(
              threatSlices,
              activeThreatSlice,
              setActiveThreatSlice,
              'Всего угроз',
              total
            )}

            {/* Легенда с точными значениями */}
            <div className="flex-1 w-full space-y-2.5">
              {threatSlices.map((slice) => {
                const isHovered = activeThreatSlice === slice.label
                return (
                  <div
                    key={slice.label}
                    onMouseEnter={() => setActiveThreatSlice(slice.label)}
                    onMouseLeave={() => setActiveThreatSlice(null)}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                      isHovered
                        ? 'bg-slate-100 border-slate-300 scale-[1.02]'
                        : 'bg-slate-50/70 border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="font-semibold text-slate-700 text-xs truncate">
                        {slice.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-extrabold text-slate-900 font-mono text-xs">
                        {slice.count}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 font-mono w-10 text-right">
                        {slice.pct}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* График 2: Статусы инцидентов (Круговой Donut) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <PieChart className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Статусы инцидентов</h3>
                <p className="text-[11px] text-slate-400">Жизненный цикл в ITSM</p>
              </div>
            </div>
            <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Активных: {assignedCount + inProgressCount + investCount}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
            {/* Круговая диаграмма */}
            {renderDonut(
              statusSlices,
              activeStatusSlice,
              setActiveStatusSlice,
              'В обработке',
              assignedCount + inProgressCount + investCount
            )}

            {/* Легенда с точными значениями */}
            <div className="flex-1 w-full space-y-2.5">
              {statusSlices.map((slice) => {
                const isHovered = activeStatusSlice === slice.label
                return (
                  <div
                    key={slice.label}
                    onMouseEnter={() => setActiveStatusSlice(slice.label)}
                    onMouseLeave={() => setActiveStatusSlice(null)}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                      isHovered
                        ? 'bg-slate-100 border-slate-300 scale-[1.02]'
                        : 'bg-slate-50/70 border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="font-semibold text-slate-700 text-xs truncate">
                        {slice.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-extrabold text-slate-900 font-mono text-xs">
                        {slice.count}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 font-mono w-10 text-right">
                        {slice.pct}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
