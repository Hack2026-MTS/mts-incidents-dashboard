package models

import (
	"time"
)

// Incident represents the ITSM incident data structure
type Incident struct {
	ID                          string     `json:"id"`
	SysID                       string     `json:"sysId,omitempty"`
	State                       string     `json:"state"`
	StateEnum                   string     `json:"stateEnum,omitempty"`
	StateID                     int        `json:"stateId"`
	StateReason                 string     `json:"stateReason,omitempty"`
	StateReasonID               string     `json:"stateReasonId,omitempty"`
	SubmitDate                  *time.Time `json:"submitDate,omitempty"`
	Deadline                    *time.Time `json:"deadline,omitempty"`
	CompletionDate              *time.Time `json:"completionDate,omitempty"`
	LastAssignmentToTeamDateTime *time.Time `json:"lastAssignmentToTeamDateTime,omitempty"`
	Header                      string     `json:"header"`
	Description                 string     `json:"description"`
	ShortDescription            string     `json:"shortDescription,omitempty"`
	AssignedGroupName           string     `json:"assignedGroupName"`
	AssignedEmployee            string     `json:"assignedEmployee,omitempty"`
	AssignedEmployeeLogin       string     `json:"assignedEmployeeLogin,omitempty"`
	InitiatorName               string     `json:"initiatorName,omitempty"`
	InitiatorLogin              string     `json:"initiatorLogin,omitempty"`
	IsEffect                    bool       `json:"isEffect"`
	IsReason                    bool       `json:"isReason"`
	IsDouble                    bool       `json:"isDouble"`
	IsMaster                    bool       `json:"isMaster"`
	IncType                     string     `json:"incType,omitempty"`
	ServiceTypeID               int        `json:"serviceTypeId,omitempty"`
	ServiceType                 string     `json:"serviceType,omitempty"`
	PriorityID                  int        `json:"priorityId"`
	Priority                    string     `json:"priority"`
	UrgencyID                   int        `json:"urgencyId,omitempty"`
	Urgency                     string     `json:"urgency,omitempty"`
	ImpactID                    int        `json:"impactId,omitempty"`
	Impact                      string     `json:"impact,omitempty"`
	WaitingExitDate             string     `json:"waitingExitDate,omitempty"`
	IsRootIncident              bool       `json:"isRootIncident,omitempty"`
	ProductName                 string     `json:"productName,omitempty"`
	ProductID                   string     `json:"productId,omitempty"`
	ProductMasterID             string     `json:"productMasterId,omitempty"`
	ProductURL                  string     `json:"productUrl,omitempty"`
	Service                     string     `json:"service,omitempty"`
	ServiceID                   string     `json:"serviceId,omitempty"`
	ScenarioName                string     `json:"scenarioName,omitempty"`
	IsNeedUp                    *bool      `json:"isNeedUp,omitempty"`
	EliminationType             string     `json:"eliminationType,omitempty"`
	EliminationTypeID           string     `json:"eliminationTypeId,omitempty"`
	ReceivingChannel            string     `json:"receivingChannel,omitempty"`
	Solution                    string     `json:"solution,omitempty"`

	// AI Enrichments
	AIRiskScore         float64      `json:"aiRiskScore"`
	AIRiskLevel         string       `json:"aiRiskLevel"`
	AIRoutingHint       string       `json:"aiRoutingHint"`
	AIRoutingConfidence float64      `json:"aiRoutingConfidence"`
	AIRoutingTop        []GroupScore `json:"aiRoutingTop,omitempty"`

	// Predictive SLA & Workload Analysis
	AISLARisk           float64 `json:"aiSlaRisk"`
	AISLALevel          string  `json:"aiSlaLevel"` // "SAFE", "WARNING", "CRITICAL"
	AITeamWorkload      int     `json:"aiTeamWorkload"`
	AIEstimatedMinutes  int     `json:"aiEstimatedMinutes"`
	AISLAMarginMinutes  int     `json:"aiSlaMarginMinutes"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type GroupScore struct {
	Group      string  `json:"group"`
	Confidence float64 `json:"confidence"`
}

// SSEMessage represents events streamed to frontend
type SSEMessage struct {
	Type      string      `json:"type"` // "INCIDENT_CREATED", "INCIDENT_UPDATED", "CRITICAL_ALERT", "COORDINATOR_ALERT"
	Incident  *Incident   `json:"incident,omitempty"`
	Message   string      `json:"message"`
	Timestamp time.Time   `json:"timestamp"`
}

// DashboardStats provides quick summary counters for the dashboard header
type DashboardStats struct {
	Total                int `json:"total"`
	Critical             int `json:"critical"`             // priorityId == 4 or priority == "Наивысший"
	AssignedCoordinators int `json:"assignedCoordinators"` // assigned to coordinators
	HighPriority         int `json:"highPriority"`         // priorityId == 3 or priority == "Высокий"
	UnderInvestigation   int `json:"underInvestigation"`   // state == "Исследование ситуации"
	Active               int `json:"active"`               // state != "Завершен" && state != "Закрыт"
	Resolved             int `json:"resolved"`             // state == "Завершен" || state == "Закрыт"
	SLARiskCount         int `json:"slaRiskCount"`         // aiSlaRisk >= 50% and active
}
