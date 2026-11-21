import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Clock, Flame, Users } from 'lucide-react'
import { AlertToast } from './components/AlertToast'
import { ColumnGroup } from './components/ColumnGroup'
import { DemoPanel } from './components/DemoPanel'
import { Header } from './components/Header'
import { IncidentDetailModal } from './components/IncidentDetailModal'
import { getIncidents, getStats, updateIncident } from './services/api'
import { sseService } from './services/sse'
import type { DashboardStats, Incident, SSEMessage } from './types/incident'
import { soundAlert } from './utils/audio'

export function App() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [search, setSearch] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [connected, setConnected] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [alerts, setAlerts] = useState<SSEMessage[]>([])

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

    sseService.connect()
    const unsubStatus = sseService.onStatusChange((status) => setConnected(status))

    const unsubMessages = sseService.subscribe((msg) => {
      if (msg.type === 'CRITICAL_ALERT') {
        soundAlert.playCriticalAlert()
      } else if (msg.type === 'COORDINATOR_ALERT') {
        soundAlert.playCoordinatorAlert()
      }

      setAlerts((prev) => [msg, ...prev.slice(0, 3)])
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

  // Filter out closed/resolved from main active monitoring by default unless matching search
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          inc.id.toLowerCase().includes(q) ||
          inc.header.toLowerCase().includes(q) ||
          (inc.productName && inc.productName.toLowerCase().includes(q)) ||
          (inc.assignedGroupName && inc.assignedGroupName.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [incidents, search])

  // 4 Required Groups (allowing multi-group representation)
  // 1. Критические (Наивысший)
  const criticalGroup = useMemo(() => {
    return filteredIncidents.filter((inc) => inc.priorityId === 4 || inc.priority === 'Наивысший')
  }, [filteredIncidents])

  // 2. Назначенные на координаторов
  const coordinatorGroup = useMemo(() => {
    return filteredIncidents.filter(
      (inc) => inc.assignedGroupName === 'КЦ ИТ Координаторы Массовых Инцидентов'
    )
  }, [filteredIncidents])

  // 3. Высокий приоритет
  const highPriorityGroup = useMemo(() => {
    return filteredIncidents.filter((inc) => inc.priorityId === 3 || inc.priority === 'Высокий')
  }, [filteredIncidents])

  // 4. Исследование ситуации (разбор причин)
  const investigationGroup = useMemo(() => {
    return filteredIncidents.filter((inc) => inc.state === 'Исследование ситуации')
  }, [filteredIncidents])

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* Compact Top Bar */}
      <Header
        connected={connected}
        search={search}
        onSearchChange={setSearch}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        stats={stats}
      />

      {/* Main 4 Columns Dashboard (maximizes screen estate) */}
      <main className="flex-1 px-3 pt-2 pb-2 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5 h-full">
          {/* Column 1: Критические */}
          <ColumnGroup
            title="Критические инциденты"
            count={criticalGroup.length}
            icon={<Flame className="h-3.5 w-3.5 text-red-500" />}
            colorHeader="bg-red-950/40 text-red-200"
            borderColor="border-red-900/60"
            badgeColor="bg-red-600 text-white"
            incidents={criticalGroup}
            onCardClick={setSelectedIncident}
            onQuickReassign={handleQuickReassign}
          />

          {/* Column 2: На координаторах */}
          <ColumnGroup
            title="На координаторах"
            count={coordinatorGroup.length}
            icon={<Users className="h-3.5 w-3.5 text-amber-500" />}
            colorHeader="bg-amber-950/40 text-amber-200"
            borderColor="border-amber-900/60"
            badgeColor="bg-amber-500 text-slate-950 font-black"
            incidents={coordinatorGroup}
            onCardClick={setSelectedIncident}
            onQuickReassign={handleQuickReassign}
          />

          {/* Column 3: Высокий приоритет */}
          <ColumnGroup
            title="Высокий приоритет"
            count={highPriorityGroup.length}
            icon={<AlertTriangle className="h-3.5 w-3.5 text-orange-500" />}
            colorHeader="bg-orange-950/40 text-orange-200"
            borderColor="border-orange-900/60"
            badgeColor="bg-orange-500 text-white"
            incidents={highPriorityGroup}
            onCardClick={setSelectedIncident}
            onQuickReassign={handleQuickReassign}
          />

          {/* Column 4: Исследование ситуации */}
          <ColumnGroup
            title="Исследование ситуации"
            count={investigationGroup.length}
            icon={<Clock className="h-3.5 w-3.5 text-blue-500" />}
            colorHeader="bg-blue-950/40 text-blue-200"
            borderColor="border-blue-900/60"
            badgeColor="bg-blue-600 text-white"
            incidents={investigationGroup}
            onCardClick={setSelectedIncident}
            onQuickReassign={handleQuickReassign}
          />
        </div>
      </main>

      {/* Incident Detail Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onUpdate={handleUpdateIncident}
      />

      {/* Real-time Alerts */}
      <AlertToast alerts={alerts} onDismiss={handleDismissAlert} />

      {/* Minimalist Collapsible Demo Trigger */}
      <DemoPanel onRefresh={loadData} />
    </div>
  )
}

export default App
