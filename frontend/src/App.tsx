import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  LayoutGrid,
  PieChart,
  Table,
} from 'lucide-react'
import { AlertToast } from './components/AlertToast'
import { ColumnGroup } from './components/ColumnGroup'
import { DemoPanel } from './components/DemoPanel'
import { EmergencyAlertBanner } from './components/EmergencyAlertBanner'
import { Header } from './components/Header'
import { IncidentDetailModal } from './components/IncidentDetailModal'
import { IncidentTableView } from './components/IncidentTableView'
import { OverviewDashboard } from './components/OverviewDashboard'
import { ToolbarFilters } from './components/ToolbarFilters'
import { getIncidents, getIncidentById, getStats, updateIncident } from './services/api'
import { sseService } from './services/sse'
import type { DashboardStats, Incident, NotificationItem } from './types/incident'
import { soundAlert } from './utils/audio'

type ViewMode = 'kanban' | 'overview' | 'table'

export function App() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [productFilter, setProductFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [connected, setConnected] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [toasts, setToasts] = useState<NotificationItem[]>([])
  const [emergencyBannerDismissed, setEmergencyBannerDismissed] = useState(false)

  const addNotification = useCallback((
    type: NotificationItem['type'],
    title: string,
    message: string,
    incidentId?: string
  ) => {
    const item: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      incidentId,
    }
    setNotifications((prev) => [item, ...prev.slice(0, 49)])
    setToasts((prev) => [item, ...prev.slice(0, 2)])
  }, [])

  const loadData = async () => {
    try {
      const [incList, statsData] = await Promise.all([getIncidents(), getStats()])
      setIncidents(incList)
      setStats(statsData)
    } catch (e) {
      console.error('Failed to load dashboard data:', e)
    }
  }

  // Reliable navigation to incident by ID (from notifications, banners, toasts)
  const handleSelectIncidentById = useCallback(
    async (id: string) => {
      let found = incidents.find((i) => i.id === id || i.sysId === id)
      if (!found) {
        try {
          found = await getIncidentById(id)
        } catch (err) {
          console.warn('[App] Could not fetch incident by ID from API', id, err)
        }
      }
      if (found) {
        setSelectedIncident(found)
        // Mark matching notification as read
        setNotifications((prev) =>
          prev.map((n) =>
            n.incidentId === id || n.message.includes(id) ? { ...n, read: true } : n
          )
        )
      }
    },
    [incidents]
  )

  useEffect(() => {
    loadData()

    sseService.connect()
    const unsubStatus = sseService.onStatusChange((status) => setConnected(status))

    const unsubMessages = sseService.subscribe((msg) => {
      const incId = msg.incident?.id || msg.message.match(/INC\d+/)?.[0]

      if (msg.type === 'CRITICAL_ALERT') {
        soundAlert.playCriticalAlert()
        setEmergencyBannerDismissed(false)
        addNotification('CRITICAL_ALERT', '🔥 Критический инцидент', msg.message, incId)
      } else if (msg.type === 'COORDINATOR_ALERT') {
        soundAlert.playCoordinatorAlert()
        addNotification('COORDINATOR_ALERT', '👥 Назначение координатору', msg.message, incId)
      } else if (msg.type === 'INCIDENT_RESOLVED') {
        soundAlert.playResolvedAlert()
        addNotification('INCIDENT_RESOLVED', '✅ Инцидент решен', msg.message, incId)
      } else if (msg.type === 'INCIDENT_UPDATED') {
        addNotification('INCIDENT_UPDATED', 'Обновление инцидента', msg.message, incId)
      } else if (msg.type === 'DASHBOARD_RESET') {
        setEmergencyBannerDismissed(false)
        addNotification('INFO', 'Сброс дашборда', 'Дашборд сброшен к исходным данным')
      }

      loadData()
    })

    return () => {
      unsubStatus()
      unsubMessages()
      sseService.disconnect()
    }
  }, [addNotification])

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const handleToggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    soundAlert.enabled = next
  }

  const handleQuickReassign = async (inc: Incident, targetGroup: string) => {
    try {
      await updateIncident(inc.id, { assignedGroupName: targetGroup })
      addNotification(
        'REASSIGNED',
        'Перенаправление',
        `Инцидент #${inc.id} перенаправлен в команду "${targetGroup}"`,
        inc.id
      )
      await loadData()
    } catch (e) {
      alert('Ошибка при переназначении: ' + e)
    }
  }

  const handleUpdateIncident = async (id: string, updates: Partial<Incident>) => {
    await updateIncident(id, updates)
    if (updates.state) {
      addNotification(
        'STATE_CHANGED',
        'Смена статуса',
        `Инцидент #${id}: статус изменен на "${updates.state}"`,
        id
      )
    }
    if (updates.assignedGroupName) {
      addNotification(
        'REASSIGNED',
        'Перенаправление',
        `Инцидент #${id}: назначен в команду "${updates.assignedGroupName}"`,
        id
      )
    }
    await loadData()
  }

  // Extract unique products, teams and statuses for filters (without 'В работе')
  const uniqueProducts = useMemo(() => {
    const set = new Set<string>()
    incidents.forEach((i) => {
      if (i.productName) set.add(i.productName)
      if (i.service) set.add(i.service)
    })
    return Array.from(set).sort()
  }, [incidents])

  const uniqueTeams = useMemo(() => {
    const set = new Set<string>()
    incidents.forEach((i) => {
      if (i.assignedGroupName) set.add(i.assignedGroupName)
    })
    return Array.from(set).sort()
  }, [incidents])

  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>()
    incidents.forEach((i) => {
      if (i.state && i.state !== 'В работе') set.add(i.state)
    })
    return Array.from(set).sort()
  }, [incidents])

  // Filtered incidents based on search & toolbar dropdowns
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchesSearch =
          inc.id.toLowerCase().includes(q) ||
          inc.header.toLowerCase().includes(q) ||
          (inc.productName && inc.productName.toLowerCase().includes(q)) ||
          (inc.assignedGroupName && inc.assignedGroupName.toLowerCase().includes(q))
        if (!matchesSearch) return false
      }

      // Product filter
      if (productFilter) {
        if (inc.productName !== productFilter && inc.service !== productFilter) {
          return false
        }
      }

      // Team filter
      if (teamFilter) {
        if (inc.assignedGroupName !== teamFilter) {
          return false
        }
      }

      // Status filter
      if (statusFilter) {
        const normFilter = statusFilter.trim()
        const normState = inc.state ? inc.state.trim() : ''
        if (normFilter === 'Назначен') {
          if (normState !== 'Назначен' && normState !== 'Назначен координатору') {
            return false
          }
        } else if (normFilter === 'Выполняется') {
          if (normState !== 'Выполняется' && normState !== 'В работе') {
            return false
          }
        } else if (normFilter === 'Завершен' || normFilter === 'Закрыт') {
          if (normState !== 'Завершен' && normState !== 'Закрыт') {
            return false
          }
        } else {
          if (normState !== normFilter) {
            return false
          }
        }
      }

      // Date filter
      if (dateFilter !== 'all' && inc.submitDate) {
        const submit = new Date(inc.submitDate).getTime()
        const now = Date.now()
        if (dateFilter === 'today') {
          const startOfToday = new Date().setHours(0, 0, 0, 0)
          if (submit < startOfToday) return false
        } else if (dateFilter === '24h') {
          if (now - submit > 24 * 3600 * 1000) return false
        } else if (dateFilter === '7d') {
          if (now - submit > 7 * 24 * 3600 * 1000) return false
        }
      }

      return true
    })
  }, [incidents, search, productFilter, teamFilter, statusFilter, dateFilter])

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (dateFilter !== 'all') count++
    if (productFilter) count++
    if (teamFilter) count++
    if (statusFilter) count++
    return count
  }, [dateFilter, productFilter, teamFilter, statusFilter])

  const handleClearFilters = () => {
    setDateFilter('all')
    setProductFilter('')
    setTeamFilter('')
    setStatusFilter('')
    setSearch('')
  }

  // Stable sort helper so cards never jump or swap unexpectedly
  const stableSort = (cards: Incident[]) => {
    return [...cards].sort((a, b) => {
      if ((b.priorityId || 0) !== (a.priorityId || 0)) {
        return (b.priorityId || 0) - (a.priorityId || 0)
      }
      if ((b.aiRiskScore || 0) !== (a.aiRiskScore || 0)) {
        return (b.aiRiskScore || 0) - (a.aiRiskScore || 0)
      }
      return (b.id || '').localeCompare(a.id || '')
    })
  }

  const isExcludedState = (inc: Incident) => {
    if (statusFilter) return false // user explicitly chose to filter by a specific status
    return inc.state === 'Завершен' || inc.state === 'Закрыт'
  }

  // 4 Operational Kanban Columns for "02 — Dashboard Redesign":
  // 1. Критические (P4 / Наивысший)
  const criticalGroup = useMemo(() => {
    const list = filteredIncidents.filter(
      (inc) =>
        (inc.priorityId === 4 || inc.priority === 'Наивысший' || inc.priority === 'Критический') &&
        !isExcludedState(inc)
    )
    return stableSort(list)
  }, [filteredIncidents, statusFilter])

  // 2. На координаторах (КЦ ИТ Координаторы Массовых Инцидентов или назначен координатор)
  const coordinatorGroup = useMemo(() => {
    const list = filteredIncidents.filter(
      (inc) =>
        (inc.assignedGroupName === 'КЦ ИТ Координаторы Массовых Инцидентов' ||
          inc.state === 'Назначен координатору') &&
        inc.priorityId !== 4 &&
        inc.priority !== 'Наивысший' &&
        inc.priority !== 'Критический' &&
        !isExcludedState(inc)
    )
    return stableSort(list)
  }, [filteredIncidents, statusFilter])

  // 3. Высокий приоритет (P3 / Высокий)
  const highPriorityGroup = useMemo(() => {
    const list = filteredIncidents.filter(
      (inc) =>
        (inc.priorityId === 3 || inc.priority === 'Высокий') &&
        inc.assignedGroupName !== 'КЦ ИТ Координаторы Массовых Инцидентов' &&
        inc.state !== 'Назначен координатору' &&
        !isExcludedState(inc)
    )
    return stableSort(list)
  }, [filteredIncidents, statusFilter])

  // 4. Диагностика (Исследование ситуации / разбор причин / P1, P2)
  const diagnosisGroup = useMemo(() => {
    const list = filteredIncidents.filter(
      (inc) =>
        (inc.state === 'Исследование ситуации' ||
          inc.stateId === 3 ||
          inc.priorityId <= 2) &&
        inc.priorityId !== 4 &&
        inc.priority !== 'Наивысший' &&
        inc.priority !== 'Критический' &&
        inc.assignedGroupName !== 'КЦ ИТ Координаторы Массовых Инцидентов' &&
        inc.state !== 'Назначен координатору' &&
        !isExcludedState(inc)
    )
    return stableSort(list)
  }, [filteredIncidents, statusFilter])

  // Critical incident for emergency banner (from Figma АРТЕМ Уведомление)
  // Evaluated across ALL incidents so global critical emergency alerts are never hidden by local filters!
  const activeCriticalIncident = useMemo(() => {
    if (emergencyBannerDismissed) return null
    return (
      incidents.find(
        (i) =>
          (i.priorityId === 4 || i.priority === 'Наивысший' || i.priority === 'Критический') &&
          i.state !== 'Завершен' &&
          i.state !== 'Закрыт'
      ) || null
    )
  }, [incidents, emergencyBannerDismissed])

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] text-slate-900 flex flex-col overflow-hidden font-sans select-none antialiased">
      {/* Top Header matching Figma */}
      <Header
        connected={connected}
        search={search}
        onSearchChange={setSearch}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        stats={stats}
        notifications={notifications}
        onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
        onClearNotifications={() => setNotifications([])}
        onSelectIncidentById={handleSelectIncidentById}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden px-4 md:px-6 pt-2 pb-3">
        {/* Emergency Alert Banner (Figma "АРТЕМ Уведомление") */}
        <EmergencyAlertBanner
          incident={activeCriticalIncident}
          onOpen={setSelectedIncident}
          onDismiss={() => setEmergencyBannerDismissed(true)}
        />

        {/* Toolbar & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2.5 border-b border-slate-200/80 mb-3 flex-shrink-0">
          <ToolbarFilters
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            productFilter={productFilter}
            onProductFilterChange={setProductFilter}
            products={uniqueProducts}
            teamFilter={teamFilter}
            onTeamFilterChange={setTeamFilter}
            teams={uniqueTeams}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statuses={uniqueStatuses}
            onClearFilters={handleClearFilters}
            activeFiltersCount={activeFiltersCount}
          />

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 self-end lg:self-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs flex-shrink-0">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Канбан-доска (4 колонки) — Фрейм 02"
            >
              <LayoutGrid className="h-3.5 w-3.5 text-[#E30611]" />
              <span>Доска</span>
            </button>
            <button
              onClick={() => setViewMode('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'overview'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Сводный обзор и аналитика угроз"
            >
              <PieChart className="h-3.5 w-3.5 text-indigo-600" />
              <span>Обзор</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Таблица инцидентов"
            >
              <Table className="h-3.5 w-3.5 text-slate-700" />
              <span>Таблица</span>
            </button>
          </div>
        </div>

        {/* View 1: 02 — Dashboard Redesign (4 Columns Kanban) */}
        {viewMode === 'kanban' && (
          <main className="flex-1 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 h-full">
              {/* Column 1: Критические */}
              <ColumnGroup
                title="Критические"
                count={criticalGroup.length}
                headerBg="bg-[#FEE2E2]"
                headerTextClass="text-[#991B1B]"
                badgeBg="bg-[#E30611] text-white"
                incidents={criticalGroup}
                onCardClick={setSelectedIncident}
                onQuickReassign={handleQuickReassign}
              />

              {/* Column 2: На координаторах */}
              <ColumnGroup
                title="На координаторах"
                count={coordinatorGroup.length}
                headerBg="bg-[#FEF3C7]"
                headerTextClass="text-[#92400E]"
                badgeBg="bg-[#D97706] text-white"
                incidents={coordinatorGroup}
                onCardClick={setSelectedIncident}
                onQuickReassign={handleQuickReassign}
              />

              {/* Column 3: Высокий приоритет */}
              <ColumnGroup
                title="Высокий приоритет"
                count={highPriorityGroup.length}
                headerBg="bg-[#FFEDD5]"
                headerTextClass="text-[#9A3412]"
                badgeBg="bg-[#EA580C] text-white"
                incidents={highPriorityGroup}
                onCardClick={setSelectedIncident}
                onQuickReassign={handleQuickReassign}
              />

              {/* Column 4: Диагностика */}
              <ColumnGroup
                title="Диагностика"
                count={diagnosisGroup.length}
                headerBg="bg-[#E0F2FE]"
                headerTextClass="text-[#075985]"
                badgeBg="bg-[#0284C7] text-white"
                incidents={diagnosisGroup}
                onCardClick={setSelectedIncident}
                onQuickReassign={handleQuickReassign}
              />
            </div>
          </main>
        )}

        {/* View 2: Сводка & Аналитика угроз (Фрейм ОБЗОР) */}
        {viewMode === 'overview' && (
          <main className="flex-1 overflow-y-auto pr-1">
            <OverviewDashboard
              stats={stats}
              incidents={filteredIncidents}
              onSelectIncident={setSelectedIncident}
            />
          </main>
        )}

        {/* View 3: Таблица инцидентов (Фрейм ЧерновикТАБЛИЦА) */}
        {viewMode === 'table' && (
          <main className="flex-1 overflow-y-auto pr-1">
            <IncidentTableView
              incidents={filteredIncidents}
              onSelectIncident={setSelectedIncident}
              onQuickReassign={handleQuickReassign}
            />
          </main>
        )}
      </div>

      {/* Incident Detail Modal / Drawer (Figma "Детали инцидента") */}
      <IncidentDetailModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onUpdate={handleUpdateIncident}
        teams={uniqueTeams}
      />

      {/* Real-time Alerts Toasts */}
      <AlertToast
        toasts={toasts}
        onDismiss={handleDismissToast}
        onSelectIncidentById={handleSelectIncidentById}
      />

      {/* Live ITSM Simulation Panel */}
      <DemoPanel onRefresh={loadData} />
    </div>
  )
}

export default App
