import type { DashboardStats, Incident, IncidentEvent } from '../types/incident'
import { INITIAL_MOCK_INCIDENTS } from '../data/mockIncidents'

const API_BASE = '/api'

let memoryIncidents = [...INITIAL_MOCK_INCIDENTS]
const memoryEvents: Record<string, IncidentEvent[]> = {}

export function recordLocalEvent(
  incidentId: string,
  eventType: string,
  message: string,
  payload?: any
): IncidentEvent {
  if (!memoryEvents[incidentId]) {
    memoryEvents[incidentId] = []
  }
  const event: IncidentEvent = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    incidentId,
    eventType,
    message,
    payload,
    createdAt: new Date().toISOString(),
  }
  memoryEvents[incidentId].unshift(event)
  return event
}

export async function getIncidentEvents(id: string): Promise<IncidentEvent[]> {
  try {
    const res = await fetch(`${API_BASE}/incidents/${id}/events`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        // Backend returned authoritative events; deduplicate any exact duplicates
        const uniqueEvents: IncidentEvent[] = []
        const seen = new Set<string>()
        for (const evt of data) {
          // Deduplicate by event type, message and time (within same second)
          const timeSec = evt.createdAt ? new Date(evt.createdAt).toISOString().substring(0, 19) : ''
          const key = `${evt.eventType}_${evt.message}_${timeSec}`
          if (!seen.has(key)) {
            seen.add(key)
            uniqueEvents.push(evt)
          }
        }
        // Sync local memory so we don't have orphan duplicates
        memoryEvents[id] = uniqueEvents
        return uniqueEvents.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }
    }
  } catch (err) {
    console.warn('[API] Could not fetch incident events from backend, using local events', err)
  }
  return (memoryEvents[id] || []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function getIncidents(search = '', group = ''): Promise<Incident[]> {
  try {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (group) params.append('group', group)

    const res = await fetch(`${API_BASE}/incidents?${params.toString()}`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        memoryIncidents = data
        return data
      }
      if (data === null) {
        // empty database
        return []
      }
    }
  } catch (err) {
    console.warn('[API] Backend offline or error, using local data', err)
  }

  let filtered = [...memoryIncidents]
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(
      (inc) =>
        inc.id.toLowerCase().includes(q) ||
        inc.header.toLowerCase().includes(q) ||
        (inc.productName && inc.productName.toLowerCase().includes(q)) ||
        (inc.assignedGroupName && inc.assignedGroupName.toLowerCase().includes(q))
    )
  }
  if (group) {
    filtered = filtered.filter((inc) => inc.assignedGroupName === group)
  }
  return filtered
}

export async function getIncidentById(id: string): Promise<Incident> {
  try {
    const res = await fetch(`${API_BASE}/incidents/${id}`)
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // fallback
  }
  const found = memoryIncidents.find((i) => i.id === id)
  if (!found) throw new Error('Incident not found')
  return found
}

export async function updateIncident(id: string, data: Partial<Incident>): Promise<Incident> {
  const current = memoryIncidents.find((i) => i.id === id)
  const oldState = current?.state
  const oldGroup = current?.assignedGroupName

  try {
    const res = await fetch(`${API_BASE}/incidents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const updated = await res.json()
      const idx = memoryIncidents.findIndex((i) => i.id === id)
      if (idx !== -1) {
        memoryIncidents[idx] = updated
      }
      return updated
    }
  } catch {
    // fallback
  }

  // Fallback in-memory recording if backend offline
  if (data.state && oldState && data.state !== oldState) {
    recordLocalEvent(id, 'STATE_CHANGED', `Статус изменен: ${oldState} → ${data.state}`, {
      old: oldState,
      new: data.state,
    })
  }

  if (data.assignedGroupName && oldGroup && data.assignedGroupName !== oldGroup) {
    recordLocalEvent(id, 'REASSIGNED', `Перенаправлен в команду: ${data.assignedGroupName}`, {
      from: oldGroup,
      to: data.assignedGroupName,
    })
  }

  // Update in memory
  const idx = memoryIncidents.findIndex((i) => i.id === id)
  if (idx !== -1) {
    memoryIncidents[idx] = { ...memoryIncidents[idx], ...data }
    return memoryIncidents[idx]
  }
  throw new Error('Incident not found')
}

export async function getStats(): Promise<DashboardStats> {
  try {
    const res = await fetch(`${API_BASE}/stats`)
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // fallback
  }

  // Calculate from memory
  const critical = memoryIncidents.filter(
    (i) => (i.priorityId === 4 || i.priority === 'Наивысший') && i.state !== 'Завершен' && i.state !== 'Закрыт'
  ).length
  const coordinators = memoryIncidents.filter(
    (i) =>
      i.assignedGroupName === 'КЦ ИТ Координаторы Массовых Инцидентов' &&
      i.state !== 'Завершен' &&
      i.state !== 'Закрыт'
  ).length
  const highPriority = memoryIncidents.filter(
    (i) => (i.priorityId === 3 || i.priority === 'Высокий') && i.state !== 'Завершен' && i.state !== 'Закрыт'
  ).length
  const underInvestigation = memoryIncidents.filter(
    (i) => i.state === 'Исследование ситуации'
  ).length
  const active = memoryIncidents.filter((i) => i.state !== 'Завершен' && i.state !== 'Закрыт').length
  const resolved = memoryIncidents.length - active
  const slaRiskCount = memoryIncidents.filter(
    (i) => (i.aiRiskScore || 0) > 50 && i.state !== 'Завершен' && i.state !== 'Закрыт'
  ).length

  return {
    total: memoryIncidents.length,
    critical,
    assignedCoordinators: coordinators,
    highPriority,
    underInvestigation,
    active,
    resolved,
    slaRiskCount,
  }
}

// Demo endpoints for live presentation
export async function demoCreateCritical(): Promise<Incident> {
  try {
    const res = await fetch(`${API_BASE}/demo/create-critical`, { method: 'POST' })
    if (res.ok) {
      const created = await res.json()
      // Resync list
      const listRes = await fetch(`${API_BASE}/incidents`)
      if (listRes.ok) {
        const fresh = await listRes.json()
        if (Array.isArray(fresh)) {
          memoryIncidents = fresh
        }
      }
      return created
    }
  } catch {
    // fallback
  }

  const newInc: Incident = {
    id: `INC0000${Math.floor(10000000 + Math.random() * 90000000)}`,
    sysId: `sys_${Date.now()}`,
    header: 'МАССОВЫЙ СБОЙ: Отказ авторизации пользователей KION в МЦОД',
    description: 'Критический инцидент: недоступно ядро авторизации и стриминга KION в датацентре. Массовые жалобы абонентов. Требуется немедленная реакция координаторов и дежурных инженеров.',
    state: 'Выполняется',
    stateEnum: 'InProgress',
    stateId: 2,
    priorityId: 4,
    priority: 'Наивысший',
    assignedGroupName: 'КЦ ИТ Media L2 KION',
    assignedEmployee: 'Иван Координаторов',
    initiatorName: 'Система Мониторинга Zabbix',
    productName: 'Онлайн-кинотеатр KION',
    service: '[KION] Сервис стриминга и профилей',
    deadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    submitDate: new Date().toISOString(),
    aiRiskScore: 99,
    aiRiskLevel: 'CRITICAL',
    aiRoutingHint: 'КЦ ИТ Media L2 KION',
    aiRoutingConfidence: 98,
    aiSlaRisk: 99,
    aiSlaLevel: 'CRITICAL',
    aiEstimatedMinutes: 35,
    aiSlaMarginMinutes: 10,
  }
  memoryIncidents = [newInc, ...memoryIncidents]
  return newInc
}

export async function demoAssignCoordinator(): Promise<Incident> {
  try {
    const res = await fetch(`${API_BASE}/demo/assign-coordinator`, { method: 'POST' })
    if (res.ok) {
      const updated = await res.json()
      const listRes = await fetch(`${API_BASE}/incidents`)
      if (listRes.ok) {
        const fresh = await listRes.json()
        if (Array.isArray(fresh)) {
          memoryIncidents = fresh
        }
      }
      return updated
    }
  } catch {
    // fallback
  }

  const unassigned = memoryIncidents.find(
    (i) =>
      i.assignedGroupName !== 'КЦ ИТ Координаторы Массовых Инцидентов' &&
      i.state !== 'Завершен' &&
      i.state !== 'Закрыт'
  )
  if (unassigned) {
    unassigned.assignedGroupName = 'КЦ ИТ Координаторы Массовых Инцидентов'
    unassigned.state = 'Назначен координатору'
    return unassigned
  }
  return memoryIncidents[0]
}

export async function demoResolveCritical(id?: string): Promise<Incident> {
  try {
    const url = id ? `${API_BASE}/demo/resolve-critical?id=${id}` : `${API_BASE}/demo/resolve-critical`
    const res = await fetch(url, { method: 'POST' })
    if (res.ok) {
      const resolved = await res.json()
      const listRes = await fetch(`${API_BASE}/incidents`)
      if (listRes.ok) {
        const fresh = await listRes.json()
        if (Array.isArray(fresh)) {
          memoryIncidents = fresh
        }
      }
      return resolved
    }
  } catch {
    // fallback
  }

  const target = id
    ? memoryIncidents.find((i) => i.id === id)
    : memoryIncidents.find((i) => i.priorityId === 4 && i.state !== 'Завершен')
  if (target) {
    target.state = 'Завершен'
    target.solution = 'Проблема устранена: переключен резервный кластер шлюзов, сервис восстановлен в полном объеме.'
    return target
  }
  return memoryIncidents[0]
}

export async function demoResetData(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' })
    if (res.ok) {
      const listRes = await fetch(`${API_BASE}/incidents`)
      if (listRes.ok) {
        const fresh = await listRes.json()
        if (Array.isArray(fresh) && fresh.length > 0) {
          memoryIncidents = fresh
          return
        }
      }
    }
  } catch {
    // fallback
  }
  memoryIncidents = [...INITIAL_MOCK_INCIDENTS]
}
