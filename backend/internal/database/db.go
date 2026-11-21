package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	_ "github.com/lib/pq"
	"hack2026/backend/internal/ml"
	"hack2026/backend/internal/models"
)

type DB struct {
	Conn *sql.DB
}

func Connect(connStr string) (*DB, error) {
	if connStr == "" {
		connStr = "postgres://postgres:postgres@localhost:5432/itsm_dashboard?sslmode=disable"
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("[DB] Connected to PostgreSQL successfully")
	return &DB{Conn: db}, nil
}

func (db *DB) InitSchema(schemaPath string) error {
	content, err := os.ReadFile(schemaPath)
	if err != nil {
		// Fallback check
		schemaPath = filepath.Join("internal", "database", "schema.sql")
		content, err = os.ReadFile(schemaPath)
		if err != nil {
			return fmt.Errorf("could not read schema file: %w", err)
		}
	}

	_, err = db.Conn.Exec(string(content))
	if err != nil {
		return fmt.Errorf("failed to execute schema: %w", err)
	}

	log.Println("[DB] Schema initialized successfully")
	return nil
}

func (db *DB) GetActiveTeamWorkloads() (map[string]int, error) {
	query := `
		SELECT assigned_group_name, COUNT(*)
		FROM incidents
		WHERE state NOT IN ('Завершен', 'Закрыт') AND assigned_group_name != ''
		GROUP BY assigned_group_name
	`
	rows, err := db.Conn.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	counts := make(map[string]int)
	for rows.Next() {
		var g string
		var c int
		if err := rows.Scan(&g, &c); err == nil {
			counts[g] = c
		}
	}
	return counts, nil
}

func (db *DB) UpsertIncident(inc *models.Incident) error {
	// Query current team queue workloads
	workloads, _ := db.GetActiveTeamWorkloads()

	// Evaluate AI enrichments (Risk Assessment, Routing Hint, SLA Breach Risk)
	ml.GetEngine().Evaluate(inc, workloads)

	query := `
		INSERT INTO incidents (
			id, sys_id, state, state_enum, state_id, state_reason,
			submit_date, deadline, completion_date, last_assignment_to_team,
			header, description, short_description, assigned_group_name,
			assigned_employee, assigned_employee_login, initiator_name, initiator_login,
			priority_id, priority, urgency_id, urgency, impact_id, impact,
			product_name, product_master_id, service, scenario_name, solution,
			service_type, service_type_id, is_effect, is_reason, is_double, is_master,
			ai_risk_score, ai_risk_level, ai_routing_hint, ai_routing_confidence,
			ai_sla_risk, ai_sla_level, ai_team_workload, ai_estimated_minutes, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6,
			$7, $8, $9, $10,
			$11, $12, $13, $14,
			$15, $16, $17, $18,
			$19, $20, $21, $22, $23, $24,
			$25, $26, $27, $28, $29,
			$30, $31, $32, $33, $34, $35,
			$36, $37, $38, $39,
			$40, $41, $42, $43, NOW()
		)
		ON CONFLICT (id) DO UPDATE SET
			state = EXCLUDED.state,
			state_enum = EXCLUDED.state_enum,
			state_id = EXCLUDED.state_id,
			state_reason = EXCLUDED.state_reason,
			deadline = EXCLUDED.deadline,
			completion_date = EXCLUDED.completion_date,
			last_assignment_to_team = EXCLUDED.last_assignment_to_team,
			header = EXCLUDED.header,
			description = EXCLUDED.description,
			short_description = EXCLUDED.short_description,
			assigned_group_name = EXCLUDED.assigned_group_name,
			assigned_employee = EXCLUDED.assigned_employee,
			assigned_employee_login = EXCLUDED.assigned_employee_login,
			priority_id = EXCLUDED.priority_id,
			priority = EXCLUDED.priority,
			urgency_id = EXCLUDED.urgency_id,
			urgency = EXCLUDED.urgency,
			impact_id = EXCLUDED.impact_id,
			impact = EXCLUDED.impact,
			product_name = EXCLUDED.product_name,
			solution = EXCLUDED.solution,
			ai_risk_score = EXCLUDED.ai_risk_score,
			ai_risk_level = EXCLUDED.ai_risk_level,
			ai_routing_hint = EXCLUDED.ai_routing_hint,
			ai_routing_confidence = EXCLUDED.ai_routing_confidence,
			ai_sla_risk = EXCLUDED.ai_sla_risk,
			ai_sla_level = EXCLUDED.ai_sla_level,
			ai_team_workload = EXCLUDED.ai_team_workload,
			ai_estimated_minutes = EXCLUDED.ai_estimated_minutes,
			updated_at = NOW()
	`

	_, err := db.Conn.Exec(
		query,
		inc.ID, inc.SysID, inc.State, inc.StateEnum, inc.StateID, inc.StateReason,
		inc.SubmitDate, inc.Deadline, inc.CompletionDate, inc.LastAssignmentToTeamDateTime,
		inc.Header, inc.Description, inc.ShortDescription, inc.AssignedGroupName,
		inc.AssignedEmployee, inc.AssignedEmployeeLogin, inc.InitiatorName, inc.InitiatorLogin,
		inc.PriorityID, inc.Priority, inc.UrgencyID, inc.Urgency, inc.ImpactID, inc.Impact,
		inc.ProductName, inc.ProductMasterID, inc.Service, inc.ScenarioName, inc.Solution,
		inc.ServiceType, inc.ServiceTypeID, inc.IsEffect, inc.IsReason, inc.IsDouble, inc.IsMaster,
		inc.AIRiskScore, inc.AIRiskLevel, inc.AIRoutingHint, inc.AIRoutingConfidence,
		inc.AISLARisk, inc.AISLALevel, inc.AITeamWorkload, inc.AIEstimatedMinutes,
	)

	return err
}

func (db *DB) GetIncidents() ([]*models.Incident, error) {
	workloads, _ := db.GetActiveTeamWorkloads()

	query := `
		SELECT 
			id, sys_id, state, state_enum, state_id, state_reason,
			submit_date, deadline, completion_date, last_assignment_to_team,
			header, description, short_description, assigned_group_name,
			assigned_employee, assigned_employee_login, initiator_name, initiator_login,
			priority_id, priority, urgency_id, urgency, impact_id, impact,
			product_name, product_master_id, service, scenario_name, solution,
			service_type, service_type_id, is_effect, is_reason, is_double, is_master,
			ai_risk_score, ai_risk_level, ai_routing_hint, ai_routing_confidence,
			ai_sla_risk, ai_sla_level, ai_team_workload, ai_estimated_minutes,
			created_at, updated_at
		FROM incidents
		ORDER BY priority_id DESC, ai_risk_score DESC, updated_at DESC
	`

	rows, err := db.Conn.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var incidents []*models.Incident
	for rows.Next() {
		var inc models.Incident
		var submitDate, deadline, completionDate, lastAssignment *time.Time
		var sysID, stateReason, shortDesc, emp, empLogin, initName, initLogin sql.NullString
		var prodName, prodMaster, srv, scen, sol, srvType sql.NullString

		err := rows.Scan(
			&inc.ID, &sysID, &inc.State, &inc.StateEnum, &inc.StateID, &stateReason,
			&submitDate, &deadline, &completionDate, &lastAssignment,
			&inc.Header, &inc.Description, &shortDesc, &inc.AssignedGroupName,
			&emp, &empLogin, &initName, &initLogin,
			&inc.PriorityID, &inc.Priority, &inc.UrgencyID, &inc.Urgency, &inc.ImpactID, &inc.Impact,
			&prodName, &prodMaster, &srv, &scen, &sol,
			&srvType, &inc.ServiceTypeID, &inc.IsEffect, &inc.IsReason, &inc.IsDouble, &inc.IsMaster,
			&inc.AIRiskScore, &inc.AIRiskLevel, &inc.AIRoutingHint, &inc.AIRoutingConfidence,
			&inc.AISLARisk, &inc.AISLALevel, &inc.AITeamWorkload, &inc.AIEstimatedMinutes,
			&inc.CreatedAt, &inc.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		inc.SysID = sysID.String
		inc.StateReason = stateReason.String
		inc.ShortDescription = shortDesc.String
		inc.AssignedEmployee = emp.String
		inc.AssignedEmployeeLogin = empLogin.String
		inc.InitiatorName = initName.String
		inc.InitiatorLogin = initLogin.String
		inc.ProductName = prodName.String
		inc.ProductMasterID = prodMaster.String
		inc.Service = srv.String
		inc.ScenarioName = scen.String
		inc.Solution = sol.String
		inc.ServiceType = srvType.String

		inc.SubmitDate = submitDate
		inc.Deadline = deadline
		inc.CompletionDate = completionDate
		inc.LastAssignmentToTeamDateTime = lastAssignment

		// Ensure AI model also gives top suggestions & live SLA computation
		ml.GetEngine().Evaluate(&inc, workloads)

		incidents = append(incidents, &inc)
	}

	return incidents, nil
}

func (db *DB) GetIncidentByID(id string) (*models.Incident, error) {
	workloads, _ := db.GetActiveTeamWorkloads()

	query := `
		SELECT 
			id, sys_id, state, state_enum, state_id, state_reason,
			submit_date, deadline, completion_date, last_assignment_to_team,
			header, description, short_description, assigned_group_name,
			assigned_employee, assigned_employee_login, initiator_name, initiator_login,
			priority_id, priority, urgency_id, urgency, impact_id, impact,
			product_name, product_master_id, service, scenario_name, solution,
			service_type, service_type_id, is_effect, is_reason, is_double, is_master,
			ai_risk_score, ai_risk_level, ai_routing_hint, ai_routing_confidence,
			ai_sla_risk, ai_sla_level, ai_team_workload, ai_estimated_minutes,
			created_at, updated_at
		FROM incidents
		WHERE id = $1
	`

	row := db.Conn.QueryRow(query, id)
	var inc models.Incident
	var submitDate, deadline, completionDate, lastAssignment *time.Time
	var sysID, stateReason, shortDesc, emp, empLogin, initName, initLogin sql.NullString
	var prodName, prodMaster, srv, scen, sol, srvType sql.NullString

	err := row.Scan(
		&inc.ID, &sysID, &inc.State, &inc.StateEnum, &inc.StateID, &stateReason,
		&submitDate, &deadline, &completionDate, &lastAssignment,
		&inc.Header, &inc.Description, &shortDesc, &inc.AssignedGroupName,
		&emp, &empLogin, &initName, &initLogin,
		&inc.PriorityID, &inc.Priority, &inc.UrgencyID, &inc.Urgency, &inc.ImpactID, &inc.Impact,
		&prodName, &prodMaster, &srv, &scen, &sol,
		&srvType, &inc.ServiceTypeID, &inc.IsEffect, &inc.IsReason, &inc.IsDouble, &inc.IsMaster,
		&inc.AIRiskScore, &inc.AIRiskLevel, &inc.AIRoutingHint, &inc.AIRoutingConfidence,
		&inc.AISLARisk, &inc.AISLALevel, &inc.AITeamWorkload, &inc.AIEstimatedMinutes,
		&inc.CreatedAt, &inc.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	inc.SysID = sysID.String
	inc.StateReason = stateReason.String
	inc.ShortDescription = shortDesc.String
	inc.AssignedEmployee = emp.String
	inc.AssignedEmployeeLogin = empLogin.String
	inc.InitiatorName = initName.String
	inc.InitiatorLogin = initLogin.String
	inc.ProductName = prodName.String
	inc.ProductMasterID = prodMaster.String
	inc.Service = srv.String
	inc.ScenarioName = scen.String
	inc.Solution = sol.String
	inc.ServiceType = srvType.String

	inc.SubmitDate = submitDate
	inc.Deadline = deadline
	inc.CompletionDate = completionDate
	inc.LastAssignmentToTeamDateTime = lastAssignment

	ml.GetEngine().Evaluate(&inc, workloads)

	return &inc, nil
}

func (db *DB) GetStats() (*models.DashboardStats, error) {
	incidents, err := db.GetIncidents()
	if err != nil {
		return nil, err
	}

	stats := &models.DashboardStats{
		Total: len(incidents),
	}

	for _, inc := range incidents {
		isResolved := inc.State == "Завершен" || inc.State == "Закрыт"
		if isResolved {
			stats.Resolved++
		} else {
			stats.Active++
		}

		if inc.PriorityID == 4 || inc.Priority == "Наивысший" {
			stats.Critical++
		}
		if inc.AssignedGroupName == "КЦ ИТ Координаторы Массовых Инцидентов" {
			stats.AssignedCoordinators++
		}
		if inc.PriorityID == 3 || inc.Priority == "Высокий" {
			stats.HighPriority++
		}
		if inc.State == "Исследование ситуации" {
			stats.UnderInvestigation++
		}
		if !isResolved && inc.AISLARisk >= 50.0 {
			stats.SLARiskCount++
		}
	}

	return stats, nil
}

func (db *DB) SeedFromJSONIfEmpty(jsonPath string) error {
	var count int
	err := db.Conn.QueryRow("SELECT COUNT(*) FROM incidents").Scan(&count)
	if err == nil && count > 0 {
		log.Printf("[DB] Table already contains %d incidents, skipping seed\n", count)
		return nil
	}

	// Read file
	data, err := os.ReadFile(jsonPath)
	if err != nil {
		return fmt.Errorf("failed to read seed json %s: %w", jsonPath, err)
	}

	var rawIncidents []*models.Incident
	if err := json.Unmarshal(data, &rawIncidents); err != nil {
		return fmt.Errorf("failed to parse seed json: %w", err)
	}

	log.Printf("[DB] Seeding %d incidents from %s...\n", len(rawIncidents), jsonPath)
	for _, inc := range rawIncidents {
		if err := db.UpsertIncident(inc); err != nil {
			log.Printf("[DB] Failed to insert incident %s: %v\n", inc.ID, err)
		}
	}

	log.Println("[DB] Seeding complete!")
	return nil
}

// RecordEvent writes an audit log event into incident_events table
func (db *DB) RecordEvent(incidentID, eventType, message string, payload any) error {
	var payloadJSON []byte
	if payload != nil {
		payloadJSON, _ = json.Marshal(payload)
	}

	query := `
		INSERT INTO incident_events (incident_id, event_type, message, payload, created_at)
		VALUES ($1, $2, $3, $4, NOW())
	`
	_, err := db.Conn.Exec(query, incidentID, eventType, message, payloadJSON)
	return err
}

type IncidentEventItem struct {
	ID         int             `json:"id"`
	IncidentID string          `json:"incidentId"`
	EventType  string          `json:"eventType"`
	Message    string          `json:"message"`
	Payload    json.RawMessage `json:"payload,omitempty"`
	CreatedAt  time.Time       `json:"createdAt"`
}

// GetEventsForIncident returns the history of changes for a specific incident
func (db *DB) GetEventsForIncident(incidentID string) ([]*IncidentEventItem, error) {
	query := `
		SELECT id, incident_id, event_type, message, payload, created_at
		FROM incident_events
		WHERE incident_id = $1
		ORDER BY created_at DESC
	`
	rows, err := db.Conn.Query(query, incidentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []*IncidentEventItem
	for rows.Next() {
		var it IncidentEventItem
		var p sql.NullString
		if err := rows.Scan(&it.ID, &it.IncidentID, &it.EventType, &it.Message, &p, &it.CreatedAt); err != nil {
			return nil, err
		}
		if p.Valid {
			it.Payload = json.RawMessage(p.String)
		}
		events = append(events, &it)
	}
	return events, nil
}

type AIPredictionRecord struct {
	ID                 int             `json:"id"`
	IncidentID         string          `json:"incidentId"`
	PredictedGroup     string          `json:"predictedGroup"`
	Confidence         float64         `json:"confidence"`
	TopCandidates      json.RawMessage `json:"topCandidates,omitempty"`
	PredictedRiskScore float64         `json:"predictedRiskScore"`
	PredictedRiskLevel string          `json:"predictedRiskLevel"`
	ActualGroup        *string         `json:"actualGroup,omitempty"`
	IsAccepted         *bool           `json:"isAccepted,omitempty"`
	InputFeatures      json.RawMessage `json:"inputFeatures,omitempty"`
	CreatedAt          time.Time       `json:"createdAt"`
	EvaluatedAt        *time.Time      `json:"evaluatedAt,omitempty"`
}

// RecordAIPrediction writes every AI prediction into ai_predictions table for future retraining & MLOps
func (db *DB) RecordAIPrediction(inc *models.Incident) error {
	topJSON, _ := json.Marshal(inc.AIRoutingTop)
	featuresJSON, _ := json.Marshal(map[string]any{
		"header":       inc.Header,
		"description":  inc.Description,
		"productName":  inc.ProductName,
		"service":      inc.Service,
		"scenarioName": inc.ScenarioName,
		"priorityId":   inc.PriorityID,
		"urgencyId":    inc.UrgencyID,
		"impactId":     inc.ImpactID,
		"serviceType":  inc.ServiceType,
	})

	query := `
		INSERT INTO ai_predictions (
			incident_id, predicted_group, confidence, top_candidates,
			predicted_risk_score, predicted_risk_level, input_features, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
	`
	_, err := db.Conn.Exec(
		query,
		inc.ID, inc.AIRoutingHint, inc.AIRoutingConfidence, topJSON,
		inc.AIRiskScore, inc.AIRiskLevel, featuresJSON,
	)
	return err
}

// UpdateAIPredictionFeedback records what the coordinator actually chose vs what AI predicted
func (db *DB) UpdateAIPredictionFeedback(incidentID, actualGroup string) error {
	query := `
		UPDATE ai_predictions
		SET 
			actual_group = $2,
			is_accepted = (predicted_group = $2::varchar),
			evaluated_at = NOW()
		WHERE incident_id = $1 AND actual_group IS NULL
	`
	_, err := db.Conn.Exec(query, incidentID, actualGroup)
	if err != nil {
		log.Printf("[DB] Error updating AI feedback: %v\n", err)
	}
	return err
}

// GetAIPredictions returns all logged predictions for an incident
func (db *DB) GetAIPredictions(incidentID string) ([]*AIPredictionRecord, error) {
	query := `
		SELECT 
			id, incident_id, predicted_group, confidence, top_candidates,
			predicted_risk_score, predicted_risk_level, actual_group, is_accepted,
			input_features, created_at, evaluated_at
		FROM ai_predictions
		WHERE incident_id = $1
		ORDER BY created_at DESC
	`
	rows, err := db.Conn.Query(query, incidentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []*AIPredictionRecord
	for rows.Next() {
		var r AIPredictionRecord
		var top, feat sql.NullString
		var act sql.NullString
		var acc sql.NullBool
		var eval *time.Time

		err := rows.Scan(
			&r.ID, &r.IncidentID, &r.PredictedGroup, &r.Confidence, &top,
			&r.PredictedRiskScore, &r.PredictedRiskLevel, &act, &acc,
			&feat, &r.CreatedAt, &eval,
		)
		if err != nil {
			return nil, err
		}

		if top.Valid {
			r.TopCandidates = json.RawMessage(top.String)
		}
		if feat.Valid {
			r.InputFeatures = json.RawMessage(feat.String)
		}
		if act.Valid {
			r.ActualGroup = &act.String
		}
		if acc.Valid {
			r.IsAccepted = &acc.Bool
		}
		r.EvaluatedAt = eval

		records = append(records, &r)
	}
	return records, nil
}
