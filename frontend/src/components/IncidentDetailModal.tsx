import React, { useState, useMemo } from 'react'
import {
  CheckCircle2,
  Flame,
  Sparkles,
  X,
} from 'lucide-react'
import type { Incident } from '../types/incident'

interface IncidentDetailModalProps {
  incident: Incident | null
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Incident>) => Promise<void>
  teams?: string[]
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onUpdate,
  teams = [],
}) => {
  if (!incident) return null

  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'comments'>('overview')
  const [state, setState] = useState(incident.state)
  const [assignedGroup, setAssignedGroup] = useState(incident.assignedGroupName)
  const [solution, setSolution] = useState(incident.solution || '')
  const [isSaving, setIsSaving] = useState(false)

  const isCritical = incident.priorityId === 4 || incident.priority === 'Наивысший'
  const riskScore = Math.round(incident.aiRiskScore || 0)

  // List of available teams / executors
  const availableTeams = useMemo(() => {
    const list = new Set<string>()
    if (incident.assignedGroupName) list.add(incident.assignedGroupName)
    if (incident.aiRoutingHint) list.add(incident.aiRoutingHint)
    if (teams && teams.length > 0) {
      teams.forEach((t) => list.add(t))
    }
    const defaults = [
      'КЦ ИТ Координаторы Массовых Инцидентов',
      'КЦ ДОИ Администрирование SAN',
      'КЦ ИТ Media L2 KION',
      'КЦ МТС Гильдия (SimpleOne)',
      'КЦ ДОИ VMWare',
      'КЦ ИТ ЦП Billing Platform',
      'КЦ ИТ Мой МТС',
      'КЦ ИТ ЦП Enablement Platform',
    ]
    defaults.forEach((d) => list.add(d))
    return Array.from(list).sort((a, b) => a.localeCompare(b, 'ru'))
  }, [incident, teams])

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

  // Format date
  const formatSubmitDate = (dateStr?: string) => {
    if (!dateStr) return 'Сегодня, 14:27'
    const d = new Date(dateStr)
    return `Сегодня, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  // Format remaining SLA
  const formatSlaRemaining = (deadlineStr?: string) => {
    if (!deadlineStr) return '00:18 до SLA'
    const deadline = new Date(deadlineStr)
    const now = new Date()
    const diffMs = deadline.getTime() - now.getTime()
    if (diffMs <= 0) return 'SLA просрочен'
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} до SLA`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Инцидент #{incident.id}
            </h2>
            {isCritical ? (
              <span className="bg-[#E30611] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                <Flame className="h-3 w-3" /> P4 • Наивысший
              </span>
            ) : (
              <span className="bg-orange-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                P{incident.priorityId || 3} • {incident.priority || 'Высокий'}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs (Figma style) */}
        <div className="flex items-center gap-6 px-6 border-b border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 relative transition-colors ${
              activeTab === 'overview' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>Обзор</span>
            {activeTab === 'overview' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E30611] rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 relative transition-colors ${
              activeTab === 'history' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>История</span>
            {activeTab === 'history' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E30611] rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`py-3 relative transition-colors ${
              activeTab === 'comments' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>Комментарии</span>
            {activeTab === 'comments' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E30611] rounded-full" />
            )}
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
          {activeTab === 'overview' && (
            <>
              {/* Описание */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-1.5 uppercase tracking-wide text-slate-500">
                  Описание
                </h4>
                <p className="text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  {incident.description || incident.header}
                </p>
              </div>

              {/* Key Properties Grid (Styled in Figma pink badge outlines / sleek chips) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Продукт */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-slate-500 font-medium">Продукт:</span>
                  <span className="font-bold text-slate-900">
                    {incident.productName || incident.service || 'Мобильная сеть'}
                  </span>
                </div>

                {/* Время возникновения */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-slate-500 font-medium">Время возникновения:</span>
                  <span className="font-semibold text-slate-900">
                    {formatSubmitDate(incident.submitDate)}
                  </span>
                </div>

                {/* Исполнитель */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white sm:col-span-2 gap-2">
                  <span className="text-slate-500 font-medium flex-shrink-0">Исполнитель:</span>
                  <select
                    value={assignedGroup}
                    onChange={(e) => setAssignedGroup(e.target.value)}
                    className="font-semibold text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#E30611] flex-1 truncate max-w-sm cursor-pointer text-right"
                  >
                    {availableTeams.map((team) => (
                      <option key={team} value={team} className="text-left font-normal text-slate-900">
                        {team}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Статус */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-slate-500 font-medium">Статус:</span>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-sky-400"
                  >
                    <option value="В работе">В работе</option>
                    <option value="Выполняется">Выполняется</option>
                    <option value="Исследование ситуации">Исследование ситуации</option>
                    <option value="Назначен координатору">Назначен координатору</option>
                    <option value="Завершен">Завершен</option>
                    <option value="Закрыт">Закрыт</option>
                  </select>
                </div>

                {/* Срок решения (SLA) */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-slate-500 font-medium">Срок решения (SLA):</span>
                  <span className="font-bold font-mono text-[#E30611]">
                    {formatSlaRemaining(incident.deadline)}
                  </span>
                </div>
              </div>

              {/* AI Copilot Intelligence Box */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-bold text-slate-900 text-xs">
                      Анализ ИИ & Предиктивная маршрутизация
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                    Уверенность ML: {Math.round(incident.aiRoutingConfidence || 95)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-indigo-100">
                    <span className="text-slate-500 block text-[11px]">Рекомендуемая команда:</span>
                    <strong className="text-indigo-900 block font-semibold truncate mt-0.5">
                      {incident.aiRoutingHint || incident.assignedGroupName}
                    </strong>
                    {incident.aiRoutingHint && incident.aiRoutingHint !== assignedGroup && (
                      <button
                        onClick={() => applyRecommendedGroup(incident.aiRoutingHint)}
                        className="mt-1.5 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded transition-colors"
                      >
                        Применить рекомендацию
                      </button>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-indigo-100">
                    <span className="text-slate-500 block text-[11px]">Прогноз риска SLA:</span>
                    <strong className={`block font-bold text-sm mt-0.5 ${riskScore > 70 ? 'text-[#E30611]' : 'text-amber-600'}`}>
                      {riskScore}% ({riskScore > 70 ? 'Критический' : 'Умеренный'})
                    </strong>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Расчетное время: ~{incident.aiEstimatedMinutes || 45} мин
                    </span>
                  </div>
                </div>
              </div>

              {/* Solution / Решение */}
              <div>
                <label className="block font-bold text-slate-900 text-xs mb-1.5 uppercase tracking-wide text-slate-500">
                  Решение / Комментарий инженера
                </label>
                <textarea
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="Опишите причину сбоя и принятые меры для устранения..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E30611] focus:bg-white transition-all"
                />
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3 py-2">
              <div className="border-l-2 border-red-500 pl-3 py-1">
                <span className="text-slate-400 text-[10px]">Сегодня 14:27</span>
                <p className="font-semibold text-slate-900">Инцидент зарегистрирован в системе</p>
                <p className="text-slate-500">Инициатор: {incident.initiatorName || 'Система Zabbix'}</p>
              </div>
              <div className="border-l-2 border-indigo-500 pl-3 py-1">
                <span className="text-slate-400 text-[10px]">Сегодня 14:28</span>
                <p className="font-semibold text-slate-900">ИИ выполнил оценку риска и маршрутизацию</p>
                <p className="text-slate-500">Рекомендация: {incident.aiRoutingHint || incident.assignedGroupName}</p>
              </div>
              <div className="border-l-2 border-emerald-500 pl-3 py-1">
                <span className="text-slate-400 text-[10px]">Сегодня 14:30</span>
                <p className="font-semibold text-slate-900">Назначен в работу: {assignedGroup}</p>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-3 py-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between text-[11px] mb-1 font-semibold text-slate-700">
                  <span>Дежурный координатор</span>
                  <span className="text-slate-400">14:35</span>
                </div>
                <p className="text-slate-600">
                  Проводится проверка каналов связи. Повторный опрос шлюзов каждые 5 минут.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            Закрыть
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#E30611] hover:bg-red-700 text-white font-semibold text-xs px-5 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Сохранение...' : 'Сохранить изменения'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
