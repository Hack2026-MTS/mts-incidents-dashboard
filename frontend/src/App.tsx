import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Clock, Flame, Users } from 'lucide-react'
import { AlertToast } from './components/AlertToast'
import { ColumnGroup } from './components/ColumnGroup'
import { DemoPanel } from './components/DemoPanel'
import { Header } from './components/Header'
import { IncidentDetailModal } from './components/IncidentDetailModal'
import { StatsBar } from './components/StatsBar'
import { getIncidents, getStats, updateIncident } from './services/api'
import { sseService } from './services/sse'
import type { DashboardStats, Incident, SSEMessage } from './types/incident'
import { soundAlert } from './utils/audio'

export function App() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [showResolved, setShowResolved] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [connected, setConnected] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [alerts, setAlerts] = useState<SSEMessage[]>([])

  // Load initial data
  const loadData = async () => {
    try {
      const [incList, statsData] = await Promise.all([getIncidents(), getStats()])
      setIncidents(incList)
      setStats(statsData)
    } catch (e) {
      console.error('Failed to load dashboard data:', e)
    }
  }

  useEffect(() => {
    loadData()

    // Connect to SSE
    sseService.connect()
    const unsubStatus = sseService.onStatusChange((status) => setConnected(status))

    const unsubMessages = sseService.subscribe((msg) => {
      // Audio alerts
      if (msg.type === 'CRITICAL_ALERT') {
        soundAlert.playCriticalAlert()
      } else if (msg.type === 'COORDINATOR_ALERT') {
        soundAlert.playCoordinatorAlert()
      }

      // Add to toast notifications
      setAlerts((prev) => [msg, ...prev.slice(0, 4)])

      // Refresh list or patch state
      loadData()
    })

    return () => {
      unsubStatus()
      unsubMessages()
      sseService.disconnect()
    }
  }, [])

  const handleDismissAlert = (idx: number) => {
    setAlerts((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleToggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    soundAlert.enabled = next
  }

  // Quick 1-click reassign from AI recommendation
  const handleQuickReassign = async (inc: Incident, targetGroup: string) => {
    try {
      await updateIncident(inc.id, { assignedGroupName: targetGroup })
      await loadData()
    } catch (e) {
      alert('Ошибка при переназначении: ' + e)
    }
  }

  const handleUpdateIncident = async (id: string, updates: Partial<Incident>) => {
    await updateIncident(id, updates)
    await loadData()
  }

  // Filter incidents by search & resolved visibility
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const isResolved = inc.state === 'Завершен' || inc.state === 'Закрыт'
      if (!showResolved && isResolved) {
        return false
      }

      if (search.trim()) {
        const q = search.toLowerCase()
        const matches =
          inc.id.toLowerCase().includes(q) ||
          inc.header.toLowerCase().includes(q) ||
          (inc.productName && inc.productName.toLowerCase().includes(q)) ||
          (inc.service && inc.service.toLowerCase().includes(q)) ||
          (inc.assignedGroupName && inc.assignedGroupName.toLowerCase().includes(q)) ||
          (inc.assignedEmployee && inc.assignedEmployee.toLowerCase().includes(q))
        if (!matches) return false
      }

      return true
    })
  }, [incidents, search, showResolved])

  // Split into the 4 REQUIRED Groups (allowing multi-group assignment as per case rules)
  // 1. Критические инциденты (priorityId == 4 or priority == "Наивысший")
  const criticalGroup = useMemo(() => {
    return filteredIncidents.filter((inc) => inc.priorityId === 4 || inc.priority === 'Наивысший')
  }, [filteredIncidents])

  // 2. Назначенные на координаторов (assignedGroupName == "КЦ ИТ Координаторы Массовых Инцидентов")
  const coordinatorGroup = useMemo(() => {
    return filteredIncidents.filter(
      (inc) => inc.assignedGroupName === 'КЦ ИТ Координаторы Массовых Инцидентов'
    )
  }, [filteredIncidents])

  // 3. Инциденты с высоким приоритетом (priorityId == 3 or priority == "Высокий")
  const highPriorityGroup = useMemo(() => {
    return filteredIncidents.filter((inc) => inc.priorityId === 3 || inc.priority === 'Высокий')
  }, [filteredIncidents])

  // 4. Инциденты на этапе исследования ситуации (state == "Исследование ситуации")
  const investigationGroup = useMemo(() => {
    return filteredIncidents.filter((inc) => inc.state === 'Исследование ситуации')
  }, [filteredIncidents])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Header */}
      <Header
        connected={connected}
        search={search}
        onSearchChange={setSearch}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        showResolved={showResolved}
        onToggleShowResolved={() => setShowResolved(!showResolved)}
      />

      {/* Top Stats Overview */}
      <StatsBar
        stats={stats}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
      />

      {/* Main 4 Columns Dashboard */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {/* Group 1: Критические инциденты */}
          <ColumnGroup
            title="Критические инциденты"
            subtitle="Наивысший приоритет, жесткий SLA"
            count={criticalGroup.length}
            icon={<Flame className="h-4 w-4 text-red-500" />}
            colorHeader="bg-red-950/40 text-red-100"
            borderColor="border-red-900/60"
            badgeColor="bg-red-600 text-white shadow-sm shadow-red-950"
            incidents={criticalGroup}
            onCardClick={setSelectedIncident}
            onQuickReassign={handleQuickReassign}
          />

          {/* Group 2: Назначенные на координаторов */}
          <ColumnGroup
            title="На координаторах"
            subtitle="Требуют оперативной передачи"
            count={coordinatorGroup.length}
            icon={<Users className="h-4 w-4 text-amber-500" />}
            colorHeader="bg-amber-950/40 text-amber-100"
            borderColor="border-amber-900/60"
            badgeColor="bg-amber-500 text-slate-950 font-black"
            incidents={coordinatorGroup}
            onCardClick={setSelectedIncident}
            onQuickReassign={handleQuickReassign}
          />

          {/* Group 3: Высокий приоритет */}
          <ColumnGroup
            title="Высокий приоритет"
            subtitle="Могут перерасти в критические"
            count={highPriorityGroup.length}
            icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}
            colorHeader="bg-orange-950/40 text-orange-100"
            borderColor="border-orange-900/60"
            badgeColor="bg-orange-500 text-white font-bold"
            incidents={highPriorityGroup}
            onCardClick={setSelectedIncident}
            onQuickReassign={handleQuickReassign}
          />

          {/* Group 4: Исследование ситуации */}
          <ColumnGroup
            title="Исследование ситуации"
            subtitle="Решены, идёт разбор причин (RCA)"
            count={investigationGroup.length}
            icon={<Clock className="h-4 w-4 text-blue-500" />}
            colorHeader="bg-blue-950/40 text-blue-100"
            borderColor="border-blue-900/60"
            badgeColor="bg-blue-600 text-white font-bold"
            incidents={investigationGroup}
            onCardClick={setSelectedIncident}
            onQuickReassign={handleQuickReassign}
          />
        </div>
      </main>

      {/* Incident Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onUpdate={handleUpdateIncident}
      />

      {/* Floating Notifications */}
      <AlertToast alerts={alerts} onDismiss={handleDismissAlert} />

      {/* Demo Panel for live test and hackathon jury presentation */}
      <DemoPanel onRefresh={loadData} />
    </div>
  )
}

export default App
