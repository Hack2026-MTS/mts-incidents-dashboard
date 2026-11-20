import React from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Flame, Users } from 'lucide-react'
import type { DashboardStats } from '../types/incident'

interface StatsBarProps {
  stats: DashboardStats | null
  activeFilter: string
  onSelectFilter: (filter: string) => void
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, activeFilter, onSelectFilter }) => {
  if (!stats) return null

  const items = [
    {
      key: 'critical',
      label: 'Критические',
      count: stats.critical,
      icon: Flame,
      color: 'text-red-400 bg-red-950/40 border-red-900/60 hover:border-red-500',
      activeColor: 'border-red-500 ring-1 ring-red-500 bg-red-950/60',
      badge: 'Срочно',
    },
    {
      key: 'coordinators',
      label: 'На координаторах',
      count: stats.assignedCoordinators,
      icon: Users,
      color: 'text-amber-400 bg-amber-950/40 border-amber-900/60 hover:border-amber-500',
      activeColor: 'border-amber-500 ring-1 ring-amber-500 bg-amber-950/60',
      badge: 'Маршрутизация',
    },
    {
      key: 'high',
      label: 'Высокий приоритет',
      count: stats.highPriority,
      icon: AlertTriangle,
      color: 'text-orange-400 bg-orange-950/40 border-orange-900/60 hover:border-orange-500',
      activeColor: 'border-orange-500 ring-1 ring-orange-500 bg-orange-950/60',
      badge: 'Риск срыва',
    },
    {
      key: 'investigation',
      label: 'Исследование ситуации',
      count: stats.underInvestigation,
      icon: Clock,
      color: 'text-blue-400 bg-blue-950/40 border-blue-900/60 hover:border-blue-500',
      activeColor: 'border-blue-500 ring-1 ring-blue-500 bg-blue-950/60',
      badge: 'Разбор причин',
    },
    {
      key: 'active',
      label: 'Активных в работе',
      count: stats.active,
      icon: AlertCircle,
      color: 'text-slate-300 bg-slate-900/60 border-slate-800 hover:border-slate-700',
      activeColor: 'border-slate-500 ring-1 ring-slate-500',
      badge: `${stats.total} всего`,
    },
    {
      key: 'resolved',
      label: 'Решено / Закрыто',
      count: stats.resolved,
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-950/30 border-emerald-900/50 hover:border-emerald-500',
      activeColor: 'border-emerald-500 ring-1 ring-emerald-500',
      badge: 'Успешно',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 max-w-7xl mx-auto px-6 py-4">
      {items.map((it) => {
        const Icon = it.icon
        const isActive = activeFilter === it.key
        return (
          <button
            key={it.key}
            onClick={() => onSelectFilter(activeFilter === it.key ? '' : it.key)}
            className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between ${it.color} ${
              isActive ? it.activeColor : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">{it.label}</span>
              <Icon className="h-4 w-4 opacity-75" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold">{it.count}</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider opacity-80">{it.badge}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
