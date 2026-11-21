import React, { useState } from 'react'
import {
  Brain,
  Building,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  Sparkles,
  X,
} from 'lucide-react'
import type { Incident } from '../types/incident'

interface IncidentDetailModalProps {
  incident: Incident | null
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Incident>) => Promise<void>
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onUpdate,
}) => {
  if (!incident) return null

  const [state, setState] = useState(incident.state)
  const [assignedGroup, setAssignedGroup] = useState(incident.assignedGroupName)
  const [solution, setSolution] = useState(incident.solution || '')
  const [isSaving, setIsSaving] = useState(false)

  const isCritical = incident.priorityId === 4 || incident.priority === 'Наивысший'

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdate(incident.id, {
        state,
        assignedGroupName: assignedGroup,
        solution,
      })
      onClose()
    } catch (err) {
      alert('Ошибка при сохранении: ' + err)
    } finally {
      setIsSaving(false)
    }
  }

  const applyRecommendedGroup = (group: string) => {
    setAssignedGroup(group)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold text-slate-100">{incident.id}</span>
              {incident.sysId && (
                <span className="text-[11px] text-slate-500 font-mono">sysId: {incident.sysId}</span>
              )}
              {isCritical && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-900/60 text-red-200 border border-red-700 uppercase flex items-center gap-1">
                  <Flame className="h-3 w-3" /> Критический
                </span>
              )}
            </div>
            <h2 className="text-base font-semibold text-slate-100 leading-snug">{incident.header}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* Action Bar / ITSM Link */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-red-400" />
              <span className="text-slate-300 font-medium">Интеграция с корпоративным ITSM</span>
            </div>
            <a
              href={`https://itsm.mts.ru/nav_to.do?uri=incident.do?sysparm_query=number=${incident.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm"
            >
              <span>Открыть карточку в ITSM</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* AI Analysis Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Risk Assessment */}
            <div className="p-4 rounded-xl border border-red-900/40 bg-red-950/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-red-300 flex items-center gap-1.5 text-xs">
                    <Brain className="h-4 w-4 text-red-400" />
                    Риск эскалации (ONNX)
                  </span>
                  <span className="text-sm font-bold font-mono text-red-200">
                    {incident.aiRiskScore}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  Вероятность перехода в Наивысший статус на основе текста, сервиса и срочности.
                </p>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    incident.aiRiskScore > 75
                      ? 'bg-red-500'
                      : incident.aiRiskScore > 50
                      ? 'bg-orange-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, incident.aiRiskScore)}%` }}
                />
              </div>
            </div>

            {/* Smart Routing Hint */}
            <div className="p-4 rounded-xl border border-amber-900/40 bg-amber-950/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-amber-300 flex items-center gap-1.5 text-xs">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Маршрутизация (ML)
                </span>
                <span className="text-xs font-mono text-amber-400 font-bold">
                  {incident.aiRoutingConfidence}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Рекомендованная команда на основе классификации:
              </p>
              <div className="flex items-center justify-between gap-2 bg-slate-900/80 p-2 rounded-lg border border-amber-900/30">
                <span className="font-medium text-slate-100 text-xs truncate">{incident.aiRoutingHint}</span>
                <button
                  type="button"
                  onClick={() => applyRecommendedGroup(incident.aiRoutingHint)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px] transition-colors flex-shrink-0"
                >
                  Выбрать
                </button>
              </div>

              {/* Top 3 */}
              {incident.aiRoutingTop && incident.aiRoutingTop.length > 1 && (
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] text-slate-500 font-medium">Альтернативы:</span>
                  {incident.aiRoutingTop.slice(1).map((top, idx) => (
                    <div
                      key={idx}
                      onClick={() => applyRecommendedGroup(top.group)}
                      className="flex items-center justify-between text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer py-0.5"
                    >
                      <span className="truncate">{top.group}</span>
                      <span className="font-mono text-[10px] text-slate-500">{top.confidence}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Predictive SLA & Workload */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              (incident.aiSlaRisk || 0) >= 75
                ? 'border-rose-900/50 bg-rose-950/20'
                : (incident.aiSlaRisk || 0) >= 50
                ? 'border-amber-900/40 bg-amber-950/20'
                : 'border-emerald-900/40 bg-emerald-950/20'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-semibold flex items-center gap-1.5 text-xs ${
                    (incident.aiSlaRisk || 0) >= 75
                      ? 'text-rose-300'
                      : (incident.aiSlaRisk || 0) >= 50
                      ? 'text-amber-300'
                      : 'text-emerald-300'
                  }`}>
                    <Clock className="h-4 w-4" />
                    Прогноз SLA и очереди
                  </span>
                  <span className={`text-sm font-bold font-mono ${
                    (incident.aiSlaRisk || 0) >= 75
                      ? 'text-rose-200'
                      : (incident.aiSlaRisk || 0) >= 50
                      ? 'text-amber-200'
                      : 'text-emerald-200'
                  }`}>
                    {incident.aiSlaRisk !== undefined ? `${incident.aiSlaRisk}%` : '—'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  Расчет с учетом очереди команды и профиля MTTR:
                </p>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded">
                    <span className="text-slate-400">Очередь команды:</span>
                    <span className="font-semibold font-mono text-slate-200">
                      {incident.aiTeamWorkload ?? 0} активных
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded">
                    <span className="text-slate-400">Оценка MTTR:</span>
                    <span className="font-semibold font-mono text-slate-200">
                      ~{Math.round(((incident.aiEstimatedMinutes || 0) / 60) * 10) / 10} ч
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded">
                    <span className="text-slate-400">Запас SLA:</span>
                    <span className={`font-semibold font-mono ${
                      (incident.aiSlaMarginMinutes || 0) < 0
                        ? 'text-rose-400'
                        : (incident.aiSlaMarginMinutes || 0) < 60
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}>
                      {(incident.aiSlaMarginMinutes || 0) < 0
                        ? `Просрочено`
                        : `${incident.aiSlaMarginMinutes || 0} мин`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              Описание проблемы
            </h3>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-wrap">
              {incident.description || 'Описание отсутствует'}
            </div>
          </div>

          {/* Attributes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Продукт</span>
              <span className="font-medium text-slate-200">{incident.productName || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Сервис</span>
              <span className="font-medium text-slate-200 truncate block">{incident.service || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Сценарий</span>
              <span className="font-medium text-slate-200">{incident.scenarioName || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Инициатор</span>
              <span className="font-medium text-slate-200">{incident.initiatorName || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Приоритет / Срочность</span>
              <span className="font-medium text-slate-200">{incident.priority} ({incident.priorityId}) / {incident.urgency || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Тип сервиса</span>
              <span className="font-medium text-slate-200">{incident.serviceType || 'Технологический'}</span>
            </div>
          </div>

          {/* Editable Fields: State, Group, Solution */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h3 className="font-semibold text-slate-200">Управление инцидентом</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Статус инцидента</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                >
                  <option value="Назначен">Назначен</option>
                  <option value="Выполняется">Выполняется</option>
                  <option value="Исследование ситуации">Исследование ситуации</option>
                  <option value="Завершен">Завершен</option>
                  <option value="Закрыт">Закрыт</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Команда назначения</label>
                <input
                  type="text"
                  value={assignedGroup}
                  onChange={(e) => setAssignedGroup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Описание решения (Solution)</label>
              <textarea
                rows={3}
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="Опишите предпринятые действия для устранения аварии..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-md shadow-red-950/50"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </div>
    </div>
  )
}
