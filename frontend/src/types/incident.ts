export interface Incident {
  id: string
  sysId?: string
  state: string
  stateEnum?: string
  stateId: number
  stateReason?: string
  stateReasonId?: string
  submitDate?: string
  deadline?: string
  completionDate?: string
  lastAssignmentToTeamDateTime?: string
  header: string
  description: string
  shortDescription?: string
  assignedGroupName: string
  assignedEmployee?: string
  assignedEmployeeLogin?: string
  initiatorName?: string
  initiatorLogin?: string
  isEffect?: boolean
  isReason?: boolean
  isDouble?: boolean
  isMaster?: boolean
  serviceTypeId?: number
  serviceType?: string
  priorityId: number
  priority: string
  urgencyId?: number
  urgency?: string
  impactId?: number
  impact?: string
  productName?: string
  productId?: string
  productMasterId?: string
  productUrl?: string
  service?: string
  serviceId?: string
  scenarioName?: string
  isNeedUp?: boolean
  solution?: string
  message?: string
  isAccepted?: boolean

  // AI Enrichments
  aiRiskScore: number
  aiRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  aiRoutingHint: string
  aiRoutingConfidence: number
  aiRoutingTop?: Array<{ group: string; confidence: number }>

  // Predictive SLA & Workload Analysis
  aiSlaRisk?: number
  aiSlaLevel?: 'SAFE' | 'WARNING' | 'CRITICAL'
  aiTeamWorkload?: number
  aiEstimatedMinutes?: number
  aiSlaMarginMinutes?: number

  createdAt?: string
  updatedAt?: string
}

export interface DashboardStats {
  total: number
  critical: number
  assignedCoordinators: number
  highPriority: number
  underInvestigation: number
  active: number
  resolved: number
  slaRiskCount?: number
}

export interface SSEMessage {
  type: 'INCIDENT_CREATED' | 'INCIDENT_UPDATED' | 'CRITICAL_ALERT' | 'COORDINATOR_ALERT' | 'INCIDENT_RESOLVED' | 'DASHBOARD_RESET'
  incident?: Incident
  message: string
  timestamp: string
}

export interface IncidentEvent {
  id: number
  incidentId: string
  eventType: 'STATE_CHANGED' | 'REASSIGNED' | 'CREATED' | 'RESOLVED' | 'AI_ROUTING_RECOMMENDED' | string
  message: string
  payload?: any
  createdAt: string
}

export interface NotificationItem {
  id: string
  type: 'CRITICAL_ALERT' | 'COORDINATOR_ALERT' | 'INCIDENT_RESOLVED' | 'INCIDENT_UPDATED' | 'STATE_CHANGED' | 'REASSIGNED' | 'INFO'
  title: string
  message: string
  timestamp: string
  read: boolean
  incidentId?: string
}
