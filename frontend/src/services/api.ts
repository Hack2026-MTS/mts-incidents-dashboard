import type { DashboardStats, Incident } from '../types/incident'

const API_BASE = '/api'

export async function getIncidents(search = '', group = ''): Promise<Incident[]> {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (group) params.append('group', group)

  const res = await fetch(`${API_BASE}/incidents?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch incidents')
  return res.json()
}

export async function getIncidentById(id: string): Promise<Incident> {
  const res = await fetch(`${API_BASE}/incidents/${id}`)
  if (!res.ok) throw new Error('Incident not found')
  return res.json()
}

export async function updateIncident(id: string, data: Partial<Incident>): Promise<Incident> {
  const res = await fetch(`${API_BASE}/incidents/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update incident')
  return res.json()
}

export async function getStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/stats`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

// Demo endpoints for live presentation
export async function demoCreateCritical(): Promise<Incident> {
  const res = await fetch(`${API_BASE}/demo/create-critical`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to simulate critical')
  return res.json()
}

export async function demoAssignCoordinator(): Promise<Incident> {
  const res = await fetch(`${API_BASE}/demo/assign-coordinator`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to simulate coordinator assignment')
  return res.json()
}

export async function demoResolveCritical(id?: string): Promise<Incident> {
  const url = id ? `${API_BASE}/demo/resolve-critical?id=${id}` : `${API_BASE}/demo/resolve-critical`
  const res = await fetch(url, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to simulate resolution')
  return res.json()
}

export async function demoResetData(): Promise<void> {
  const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to reset data')
}
