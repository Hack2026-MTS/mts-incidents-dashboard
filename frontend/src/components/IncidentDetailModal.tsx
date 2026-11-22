import React, { useState, useMemo, useEffect } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  History,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  UserCheck,
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

interface LocalComment {
  id: string
  author: string
  text: string
  time: string
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onUpdate,
  teams = [],
}) => {
  if (!incident) return null

  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'comments'>('overview')
  const [state, setState] = useState(incident.state === 'В работе' ? 'Выполняется' : incident.state)
  const [assignedGroup, setAssignedGroup] = useState(incident.assignedGroupName)
  const [solution, setSolution] = useState(incident.solution || '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Events & History with strict deduplication
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

  // Comments
  const [comments, setComments] = useState<LocalComment[]>([
    {
      id: 'c1',
      author: 'Дежурный координатор',
      text: 'Проводится проверка каналов связи. Зафиксированы обращения абонентов, мониторинг шлюзов запущен.',
      time: 'Сегодня, 14:35',
    },
  ])
  const [newCommentText, setNewCommentText] = useState('')

  // Sync state when incident changes
  useEffect(() => {
    setState(incident.state === 'В работе' ? 'Выполняется' : incident.state)
    setAssignedGroup(incident.assignedGroupName)
    setSolution(incident.solution || '')
    setSaveSuccess(false)
  }, [incident])

  // Load audit events whenever modal opens or tab switches to history
  useEffect(() => {
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
  }, [incident.id, activeTab])

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
      setSaveSuccess(true)
      // Refetch history events to show the new state transition immediately
      const freshEvents = await getIncidentEvents(incident.id)
      setEvents(freshEvents)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      alert('Ошибка при сохранении: ' + err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCommentText.trim()) return
    const now = new Date()
    const formattedTime = `Сегодня, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    setComments((prev) => [
      ...prev,
      {
        id: `c_${Date.now()}`,
        author: 'Оператор Ситуационного Центра',
        text: newCommentText.trim(),
        time: formattedTime,
      },
    ])
    setNewCommentText('')
  }

  const applyRecommendedGroup = (group: string) => {
    setAssignedGroup(group)
  }

  // Format date
  const formatSubmitDate = (dateStr?: string) => {
    if (!dateStr) return 'Сегодня, 14:27'
    const d = new Date(dateStr)
    return d.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatEventDate = (dateStr?: string) => {
    if (!dateStr) return 'Только что'
    const d = new Date(dateStr)
    return d.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
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
            {saveSuccess && (
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="h-3 w-3" /> Сохранено
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
            className={`py-3 relative transition-colors flex items-center gap-1.5 ${
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
            onClick={() => setActiveTab('comments')}
            className={`py-3 relative transition-colors flex items-center gap-1.5 ${
              activeTab === 'comments' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Комментарии ({comments.length})</span>
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

              {/* Key Properties Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Продукт */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-slate-500 font-medium">Продукт:</span>
                  <span className="font-bold text-slate-900 truncate ml-2 text-right">
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

                {/* Исполнитель (Выпадающий список) */}
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

                {/* Статус - строго канонические 5 статусов по датасету */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-slate-500 font-medium">Статус:</span>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-sky-400 cursor-pointer"
                  >
                    <option value="Назначен">Назначен</option>
                    <option value="Выполняется">Выполняется</option>
                    <option value="Исследование ситуации">Исследование ситуации</option>
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
                        className="mt-1.5 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded transition-colors cursor-pointer"
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

          {/* Tab 2: История переходов в разные статусы со временем */}
          {activeTab === 'history' && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Хронология переходов и событий инцидента
                </span>
                <span className="text-[11px] text-slate-400">
                  {loadingEvents ? 'Загрузка истории...' : `${dedupedEvents.length || 1} событий`}
                </span>
              </div>

              {loadingEvents ? (
                <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Загрузка аудита истории...</span>
                </div>
              ) : (
                <div className="relative pl-4 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {/* Dynamic Events from Backend Audit */}
                  {dedupedEvents.length > 0 ? (
                    dedupedEvents.map((evt, idx) => {
                      const isStatusChange = evt.eventType === 'STATE_CHANGED'
                      const isReassigned = evt.eventType === 'REASSIGNED'
                      const isCreated = evt.eventType === 'CREATED'
                      const isResolved = evt.eventType === 'RESOLVED'
                      const isAIRouting = evt.eventType === 'AI_ROUTING_RECOMMENDED'

                      let dotColor = 'bg-sky-500'
                      let badge = 'Событие'
                      let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200'

                      if (isStatusChange) {
                        dotColor = 'bg-blue-600'
                        badge = 'Переход статуса'
                        badgeColor = 'bg-blue-50 text-blue-700 border-blue-200'
                      } else if (isReassigned) {
                        dotColor = 'bg-amber-500'
                        badge = 'Переназначение команды'
                        badgeColor = 'bg-amber-50 text-amber-700 border-amber-200'
                      } else if (isCreated) {
                        dotColor = 'bg-purple-600'
                        badge = 'Создание'
                        badgeColor = 'bg-purple-50 text-purple-700 border-purple-200'
                      } else if (isResolved) {
                        dotColor = 'bg-emerald-600'
                        badge = 'Решено'
                        badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      } else if (isAIRouting) {
                        dotColor = 'bg-indigo-600'
                        badge = 'ИИ Анализ'
                        badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }

                      return (
                        <div key={evt.id || idx} className="relative group">
                          {/* Timeline dot */}
                          <span
                            className={`absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white ${dotColor}`}
                          />

                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:shadow-xs transition-all">
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span
                                className={`px-2 py-0.5 rounded-md font-semibold border ${badgeColor}`}
                              >
                                {badge}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500 font-medium">
                                {formatEventDate(evt.createdAt)}
                              </span>
                            </div>

                            <p className="font-medium text-slate-900 text-xs mt-1">
                              {evt.message}
                            </p>

                            {/* Status Change Details */}
                            {isStatusChange && evt.payload && (
                              <div className="mt-2 flex items-center gap-2 text-[11px] bg-white p-2 rounded-lg border border-slate-100">
                                <span className="text-slate-500 line-through">
                                  {evt.payload.old || 'Исходный'}
                                </span>
                                <ArrowRight className="h-3 w-3 text-slate-400" />
                                <span className="font-bold text-sky-700">
                                  {evt.payload.new || incident.state}
                                </span>
                              </div>
                            )}

                            {/* Reassignment Details */}
                            {isReassigned && evt.payload && (
                              <div className="mt-2 flex items-center gap-2 text-[11px] bg-white p-2 rounded-lg border border-slate-100">
                                <span className="text-slate-500">
                                  {evt.payload.from || 'Предыдущая'}
                                </span>
                                <ArrowRight className="h-3 w-3 text-slate-400" />
                                <span className="font-bold text-slate-800">
                                  {evt.payload.to || incident.assignedGroupName}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    /* Initial fallback record from submitDate if no events yet in DB */
                    <>
                      <div className="relative">
                        <span className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white bg-blue-600" />
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="px-2 py-0.5 rounded-md font-semibold border bg-blue-50 text-blue-700 border-blue-200">
                              Текущий статус
                            </span>
                            <span className="font-mono text-[10px] text-slate-500 font-medium">
                              {formatEventDate(incident.updatedAt || incident.submitDate)}
                            </span>
                          </div>
                          <p className="font-medium text-slate-900 text-xs mt-1">
                            Статус: <strong>{incident.state}</strong> • Команда:{' '}
                            <strong>{incident.assignedGroupName}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="relative">
                        <span className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white bg-purple-600" />
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="px-2 py-0.5 rounded-md font-semibold border bg-purple-50 text-purple-700 border-purple-200">
                              Регистрация инцидента
                            </span>
                            <span className="font-mono text-[10px] text-slate-500 font-medium">
                              {formatEventDate(incident.submitDate)}
                            </span>
                          </div>
                          <p className="font-medium text-slate-900 text-xs mt-1">
                            Инцидент зарегистрирован в системе. Инициатор:{' '}
                            {incident.initiatorName || 'Система Zabbix'}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Комментарии */}
          {activeTab === 'comments' && (
            <div className="space-y-4 py-2">
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1 font-semibold text-slate-700">
                      <span className="text-slate-900 font-bold flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                        {comment.author}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">{comment.time}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed mt-1">{comment.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="pt-2">
                <label className="block text-slate-600 font-semibold mb-1.5 text-[11px]">
                  Добавить комментарий или рабочую заметку:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Напишите комментарий..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E30611] focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="bg-slate-900 hover:bg-[#E30611] disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="h-3 w-3" />
                    <span>Отправить</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Закрыть
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#E30611] hover:bg-red-700 text-white font-semibold text-xs px-5 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
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
