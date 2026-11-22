import React, { useState, useMemo, useEffect } from 'react'
import {
  Check,
  CheckCircle2,
  Clock,
  CornerUpLeft,
  Layers,
  FileText,
  History,
  Link as LinkIcon,
  MessageSquare,
  Save,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import type { Incident, IncidentEvent } from '../types/incident'
import { getIncidentEvents } from '../services/api'

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
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'related'>('overview')
  const [state, setState] = useState(incident?.state === 'В работе' ? 'Выполняется' : (incident?.state || 'Назначен'))
  const [assignedGroup, setAssignedGroup] = useState(incident?.assignedGroupName || '')
  const [solution, setSolution] = useState(incident?.solution || '')
  const [message, setMessage] = useState(incident?.message || '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Events & History
  const [events, setEvents] = useState<IncidentEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)

  const dedupedEvents = useMemo(() => {
    const list: IncidentEvent[] = []
    const seen = new Set<string>()
    for (const evt of events) {
      const timeSec = evt.createdAt ? new Date(evt.createdAt).toISOString().substring(0, 19) : ''
      const key = `${evt.eventType}_${evt.message}_${timeSec}`
      if (!seen.has(key)) {
        seen.add(key)
        list.push(evt)
      }
    }
    return list
  }, [events])

  // Sync state when incident changes
  useEffect(() => {
    if (!incident) return
    setState(incident.state === 'В работе' ? 'Выполняется' : (incident.state || 'Назначен'))
    setAssignedGroup(incident.assignedGroupName || '')
    setSolution(incident.solution || '')
    setMessage(incident.message || '')
    setSaveSuccess(false)
  }, [incident])

  // Load audit events whenever modal opens or tab switches
  useEffect(() => {
    if (!incident?.id) return
    let isMounted = true
    const loadEvents = async () => {
      setLoadingEvents(true)
      try {
        const evts = await getIncidentEvents(incident.id)
        if (isMounted) {
          setEvents(evts)
        }
      } catch (e) {
        console.error('Failed to load incident history', e)
      } finally {
        if (isMounted) setLoadingEvents(false)
      }
    }
    loadEvents()
    return () => {
      isMounted = false
    }
  }, [incident?.id])

  const handleSave = async () => {
    if (!incident) return
    setIsSaving(true)
    try {
      await onUpdate(incident.id, {
        state,
        assignedGroupName: assignedGroup,
        solution,
        message,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (e) {
      console.error('Failed to update incident:', e)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReturnToCoordinator = async () => {
    if (!incident) return
    setIsSaving(true)
    const coordGroup = 'КЦ ИТ Координаторы Массовых Инцидентов'
    setAssignedGroup(coordGroup)
    setState('Назначен')
    try {
      await onUpdate(incident.id, {
        state: 'Назначен',
        assignedGroupName: coordGroup,
        message,
        solution,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (e) {
      console.error('Failed to return incident to coordinator:', e)
    } finally {
      setIsSaving(false)
    }
  }

  const applyRecommendedGroup = async (groupName: string) => {
    if (!incident) return
    setAssignedGroup(groupName)
    setIsSaving(true)
    try {
      await onUpdate(incident.id, {
        assignedGroupName: groupName,
        isAccepted: true,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (e) {
      console.error('Failed to assign group', e)
    } finally {
      setIsSaving(false)
    }
  }

  // Format remaining SLA
  const formatSlaRemaining = (deadlineStr?: string) => {
    if (!deadlineStr) return '00:18 до SLA'
    const deadline = new Date(deadlineStr)
    const now = new Date()
    const diffMs = deadline.getTime() - now.getTime()
    if (diffMs <= 0) return '0 мин'
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) return `${hours} ч ${minutes} мин`
    return `${minutes} мин`
  }

  // Priority chip styling
  const getPriorityBadge = () => {
    if (!incident) return null
    if (incident.priorityId === 4 || incident.priority === 'Наивысший' || incident.priority === 'Критический') {
      return <span className="bg-[#E30611] text-white text-xs font-bold px-3 py-1 rounded-full">Критический</span>
    }
    if (incident.priorityId === 3 || incident.priority === 'Высокий') {
      return <span className="bg-[#F97316] text-white text-xs font-bold px-3 py-1 rounded-full">Высокий</span>
    }
    if (incident.priorityId === 2 || incident.priority === 'Средний') {
      return <span className="bg-[#EAB308] text-white text-xs font-bold px-3 py-1 rounded-full">Средний</span>
    }
    return <span className="bg-[#3B82F6] text-white text-xs font-bold px-3 py-1 rounded-full">Низкий</span>
  }

  // Teams list
  const availableTeams = useMemo(() => {
    const set = new Set<string>()
    if (incident?.assignedGroupName) set.add(incident.assignedGroupName)
    if (incident?.aiRoutingHint) set.add(incident.aiRoutingHint)
    teams.forEach((t) => t && set.add(t))
    // Standard MTS teams if list is short
    if (set.size < 5) {
      set.add('КЦ ДОИ Администрирование SAN')
      set.add('КЦ МТС Гильдия (SimpleOne)')
      set.add('КЦ ИТ Координаторы Массовых Инцидентов')
      set.add('КЦ ДОИ Сопровождение сетевых сервисов')
    }
    return Array.from(set)
  }, [teams, incident])

  if (!incident) return null

  // Risk scores
  const escalationRisk = Math.round(incident.aiRiskScore || 79.4)
  const slaRisk = Math.round(incident.aiSlaRisk !== undefined ? incident.aiSlaRisk : 0)

  const alternativeTeam = availableTeams.find(
    (t) => t !== (incident.aiRoutingHint || incident.assignedGroupName) && t !== 'КЦ ИТ Координаторы Массовых Инцидентов'
  ) || 'КЦ МТС Гильдия'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/45 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug">
                {incident.header || incident.shortDescription || incident.id}
              </h2>
              {getPriorityBadge()}
              {saveSuccess && (
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Сохранено
                </span>
              )}
            </div>
            <div className="mt-1 text-xs font-mono font-medium text-slate-400">
              {incident.id}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0 mt-0.5"
            title="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs (Figma style: Обзор, История, Связанные инциденты) */}
        <div className="flex items-center gap-6 px-6 border-b border-slate-100 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 relative transition-colors cursor-pointer ${
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
            className={`py-3 relative transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>История ({dedupedEvents.length > 0 ? dedupedEvents.length : 1})</span>
            {activeTab === 'history' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E30611] rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('related')}
            className={`py-3 relative transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'related' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>Связанные инциденты</span>
            {activeTab === 'related' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E30611] rounded-full" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-700">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column: Описание и Параметры инцидента */}
              <div className="md:col-span-7 space-y-5">
                {/* Описание */}
                <div>
                  <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 text-sm">
                    <FileText className="h-4 w-4 text-slate-600" />
                    <span>Описание</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    {incident.description || incident.header || 'Недоступность мобильного интернета в ряде районов. Зафиксировано массовое снижение доступности сети, затрагивающее несколько регионов.'}
                  </p>
                </div>

                {/* Параметры инцидента */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Layers className="h-4 w-4 text-slate-600" />
                    <span>Параметры инцидента</span>
                  </div>

                  <div className="border-t border-slate-200/80 divide-y divide-slate-100 text-xs">
                    {/* Продукт */}
                    <div className="py-2.5 flex justify-between items-center gap-4">
                      <span className="text-slate-500 font-medium">Продукт</span>
                      <span className="font-semibold text-slate-900 text-right">
                        {incident.productName || 'Вечная зажигалка'}
                      </span>
                    </div>

                    {/* Сервис */}
                    <div className="py-2.5 flex justify-between items-center gap-4">
                      <span className="text-slate-500 font-medium">Сервис</span>
                      <span className="font-semibold text-slate-900 text-right">
                        {incident.service || '[Вечная зажигалка] Газовый клапан'}
                      </span>
                    </div>

                    {/* Сценарий */}
                    <div className="py-2.5 flex justify-between items-center gap-4">
                      <span className="text-slate-500 font-medium">Сценарий</span>
                      <span className="font-semibold text-slate-900 text-right">
                        {incident.scenarioName || 'Игла'}
                      </span>
                    </div>

                    {/* Инициатор */}
                    <div className="py-2.5 flex justify-between items-center gap-4">
                      <span className="text-slate-500 font-medium">Инициатор</span>
                      <span className="font-semibold text-slate-900 text-right">
                        {incident.initiatorName || incident.initiatorLogin || 'Кеплер (kepler)'}
                      </span>
                    </div>

                    {/* Влияние/срочность */}
                    <div className="py-2.5 flex justify-between items-center gap-4">
                      <span className="text-slate-500 font-medium">Влияние/срочность</span>
                      <span className="font-semibold text-slate-900 text-right">
                        {incident.impact || 'Низкое'}/{incident.urgency || 'Низкая'}
                      </span>
                    </div>

                    {/* Тип сервиса */}
                    <div className="py-2.5 flex justify-between items-center gap-4">
                      <span className="text-slate-500 font-medium">Тип сервиса</span>
                      <span className="font-semibold text-slate-900 text-right">
                        {incident.serviceType || 'Технологический'}
                      </span>
                    </div>

                    {/* Решение */}
                    <div className="py-2.5 flex justify-between items-center gap-4">
                      <span className="text-slate-500 font-medium">Решение</span>
                      <span className="font-semibold text-slate-900 text-right">
                        {solution || 'Заменён Игла, система восстановлена.'}
                      </span>
                    </div>

                    {/* Комментарий */}
                    <div className="py-2.5 flex justify-between items-center gap-4">
                      <span className="text-slate-500 font-medium">Комментарий</span>
                      <span className="font-semibold text-slate-900 text-right">
                        {incident.solution || 'В будущем пересмотреть технологию'}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Selects for Status & Assigned Team */}
                  <div className="pt-2 border-t border-slate-200/80 space-y-3">
                    {/* Статус */}
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-slate-600 font-medium text-xs">Статус</label>
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#E30611] max-w-xs w-full text-right cursor-pointer"
                      >
                        <option value="Назначен">Назначен</option>
                        <option value="Выполняется">Выполняется</option>
                        <option value="Исследование ситуации">Исследование ситуации</option>
                        <option value="Завершен">Завершен</option>
                        <option value="Закрыт">Закрыт</option>
                      </select>
                    </div>

                    {/* Команда назначения */}
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-slate-600 font-medium text-xs">Команда назначения</label>
                      <select
                        value={assignedGroup}
                        onChange={(e) => setAssignedGroup(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#E30611] max-w-xs w-full text-right cursor-pointer truncate"
                      >
                        {availableTeams.map((team) => (
                          <option key={team} value={team}>
                            {team}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Сообщение координатору / Необходимые действия */}
                    <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-800 font-bold text-xs flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-amber-600" />
                          <span>Сообщение для координатора (необходимые действия)</span>
                        </label>
                        {message && (
                          <button
                            type="button"
                            onClick={() => setMessage('')}
                            className="text-[10px] text-slate-400 hover:text-red-500 transition-colors"
                          >
                            Очистить
                          </button>
                        )}
                      </div>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Опишите выполненную работу и требуемые действия смежной команды (напр.: «Необходимо настроить дисковые массивы SAN...»)"
                        rows={3}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#E30611] transition-all resize-none leading-relaxed"
                      />
                      <p className="text-[10px] text-slate-500">
                        Данное сообщение имеет максимальный вес в нейросети для перенаправления инцидента на нужную команду.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleReturnToCoordinator}
                        disabled={isSaving}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        title="Назначить на координатора с сообщением о необходимых действиях"
                      >
                        <CornerUpLeft className="h-3.5 w-3.5" />
                        <span>Вернуть координатору</span>
                      </button>

                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>{isSaving ? 'Сохранение...' : 'Сохранить изменения'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: AI-анализ (Figma Soft Purple Card) */}
              <div className="md:col-span-5 bg-[#FAF7FD] border border-purple-100 rounded-3xl p-5 sm:p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-purple-100/80">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="font-extrabold text-slate-900 text-sm">AI - анализ</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <Check className="h-3 w-3 text-emerald-600 stroke-[3]" />
                    <span>Завершён</span>
                  </span>
                </div>

                {/* Section 1: Риск эскалации */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                      <Target className="h-4 w-4 text-purple-600" />
                      <span>Риск эскалации</span>
                    </div>
                    <span className="font-extrabold text-slate-900 font-mono text-sm">
                      {escalationRisk}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Вероятность перехода в Наивысший статус на основе текста, сервиса и срочности.
                  </p>
                </div>

                {/* Section 2: Прогноз SLA и очереди */}
                <div className="space-y-2 pt-2 border-t border-purple-100/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <span>Прогноз SLA и очереди</span>
                    </div>
                    <span className="font-extrabold text-slate-900 font-mono text-sm">
                      {slaRisk}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Расчет с учетом очереди команды и профиля MTTR:
                  </p>
                  <div className="space-y-1 text-xs text-slate-700 pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Очередь команды:</span>
                      <span className="font-semibold text-slate-800">
                        {incident.aiTeamWorkload !== undefined ? `${incident.aiTeamWorkload} активных` : '0 активных'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Оценка MTTR:</span>
                      <span className="font-semibold text-slate-800">
                        {incident.aiEstimatedMinutes ? `~${Math.round(incident.aiEstimatedMinutes / 60)} ч` : '~0 ч'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Запас SLA:</span>
                      <span className="font-semibold text-slate-800">
                        {formatSlaRemaining(incident.deadline)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Маршрутизация (ML) */}
                <div className="space-y-2.5 pt-2 border-t border-purple-100/60">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span>Маршрутизация (ML)</span>
                  </div>

                  {/* Team Message Factor Highlight */}
                  {incident.message && (
                    <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                        <MessageSquare className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                        <span>Учтено сообщение команды:</span>
                      </div>
                      <p className="bg-white/80 rounded-lg p-2 border border-amber-200/60 text-slate-800 italic leading-snug text-[11px]">
                        «{incident.message}»
                      </p>
                      <p className="text-[10px] text-amber-800 font-medium">
                        Нейросеть проанализировала указанные действия и перенаправила рекомендацию с приоритетом на требуемую команду ({Math.round(incident.aiRoutingConfidence || 99)}%).
                      </p>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 leading-snug">
                    Рекомендованная команда на основе классификации:
                  </p>

                  <div className="space-y-2">
                    {/* Team 1: Best Match */}
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-purple-100 shadow-2xs">
                      <span className="font-semibold text-slate-900 text-xs truncate" title={incident.aiRoutingHint || incident.assignedGroupName}>
                        {incident.aiRoutingHint || incident.assignedGroupName || 'КЦ ДОИ Администрирование SAN'}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-bold text-xs text-slate-900 font-mono">
                          {Math.round(incident.aiRoutingConfidence || 95.4)}%
                        </span>
                        <button
                          onClick={() => applyRecommendedGroup(incident.aiRoutingHint || incident.assignedGroupName)}
                          className="border border-slate-300 hover:border-purple-500 bg-white hover:bg-purple-50 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-2xs"
                        >
                          Выбрать
                        </button>
                      </div>
                    </div>

                    {/* Team 2: Alternative Candidate */}
                    {alternativeTeam && (
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-purple-100 shadow-2xs">
                        <span className="font-medium text-slate-700 text-xs truncate" title={alternativeTeam}>
                          {alternativeTeam}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-medium text-xs text-slate-500 font-mono">
                            16.1%
                          </span>
                          <button
                            onClick={() => applyRecommendedGroup(alternativeTeam)}
                            className="border border-slate-300 hover:border-purple-500 bg-white hover:bg-purple-50 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-2xs"
                          >
                            Выбрать
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: История */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">
                История изменений и аудит
              </h4>
              {loadingEvents ? (
                <div className="py-8 text-center text-slate-400">Загрузка истории...</div>
              ) : dedupedEvents.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  История пока не зафиксирована
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {dedupedEvents.map((evt, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#E30611] ring-4 ring-white" />
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span className="font-bold text-slate-700">{evt.eventType}</span>
                          <span>{new Date(evt.createdAt).toLocaleString('ru-RU')}</span>
                        </div>
                        <p className="text-slate-800 text-xs">{evt.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Связанные инциденты */}
          {activeTab === 'related' && (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <LinkIcon className="h-8 w-8 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600">Связанные инциденты не найдены</p>
              <p className="text-[11px] text-slate-400">
                Инцидент обрабатывается как единичный в рамках сервиса {incident.service || incident.productName}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
