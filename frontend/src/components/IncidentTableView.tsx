import React from 'react'
import { Flame, AlertTriangle } from 'lucide-react'
import type { Incident } from '../types/incident'

interface IncidentTableViewProps {
  incidents: Incident[]
  onSelectIncident: (inc: Incident) => void
  onQuickReassign?: (inc: Incident, targetGroup: string) => void
}

export const IncidentTableView: React.FC<IncidentTableViewProps> = ({
  incidents,
  onSelectIncident,
}) => {
  const getPriorityBadge = (priority: string, priorityId: number) => {
    if (priorityId === 4 || priority === 'Наивысший' || priority === 'Критический') {
      return (
        <span className="bg-[#E30611] text-white text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
          <Flame className="h-2.5 w-2.5" /> P4 • Наивысший
        </span>
      )
    }
    if (priorityId === 3 || priority === 'Высокий') {
      return (
        <span className="bg-[#F97316] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          P3 • Высокий
        </span>
      )
    }
    if (priorityId === 2 || priority === 'Средний') {
      return (
        <span className="bg-[#EAB308] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          P2 • Средний
        </span>
      )
    }
    return (
      <span className="bg-[#3B82F6] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
        P1 • Низкий
      </span>
    )
  }

  const getStateBadge = (state: string) => {
    if (state === 'Выполняется') {
      return (
        <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
          Выполняется
        </span>
      )
    }
    if (state === 'Исследование ситуации') {
      return (
        <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
          {state}
        </span>
      )
    }
    if (state === 'Завершен' || state === 'Закрыт') {
      return (
        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
          {state}
        </span>
      )
    }
    return (
      <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
        {state}
      </span>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden animate-in fade-in duration-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4">ID</th>
              <th className="py-3.5 px-4">Тема инцидента</th>
              <th className="py-3.5 px-4">Продукт</th>
              <th className="py-3.5 px-4">Приоритет</th>
              <th className="py-3.5 px-4">Статус</th>
              <th className="py-3.5 px-4">Назначенная группа</th>
              <th className="py-3.5 px-4">SLA / Риск эскалации</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Нет инцидентов, соответствующих выбранным фильтрам
                </td>
              </tr>
            ) : (
              incidents.map((inc) => {
                const risk = Math.round(inc.aiRiskScore || 0)
                return (
                  <tr
                    key={inc.id}
                    onClick={() => onSelectIncident(inc)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600 group-hover:text-slate-900">
                      {inc.id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate">
                      {inc.header}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                        {inc.productName || 'Мобильная сеть'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getPriorityBadge(inc.priority, inc.priorityId)}</td>
                    <td className="py-3.5 px-4">{getStateBadge(inc.state)}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium max-w-xs truncate">
                      {inc.assignedGroupName}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-600">
                          {inc.deadline
                            ? `${Math.max(1, Math.round((new Date(inc.deadline).getTime() - Date.now()) / (3600 * 1000)))}ч`
                            : '4ч'}
                        </span>
                        {risk > 0 && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                              risk >= 70
                                ? 'bg-red-50 text-[#E30611] border border-red-200'
                                : risk >= 40
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Риск эскалации: {risk}%
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
