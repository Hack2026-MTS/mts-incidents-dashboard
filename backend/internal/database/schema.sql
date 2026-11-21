CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(64) PRIMARY KEY,
    sys_id VARCHAR(64),
    state VARCHAR(64) NOT NULL DEFAULT 'Назначен',
    state_enum VARCHAR(64) DEFAULT 'Assigned',
    state_id INT DEFAULT 0,
    state_reason TEXT,
    submit_date TIMESTAMPTZ,
    deadline TIMESTAMPTZ,
    completion_date TIMESTAMPTZ,
    last_assignment_to_team TIMESTAMPTZ,
    header TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    short_description TEXT,
    assigned_group_name TEXT NOT NULL DEFAULT '',
    assigned_employee TEXT,
    assigned_employee_login TEXT,
    initiator_name TEXT,
    initiator_login TEXT,
    priority_id INT NOT NULL DEFAULT 1,
    priority VARCHAR(64) NOT NULL DEFAULT 'Низкий',
    urgency_id INT DEFAULT 1,
    urgency VARCHAR(64) DEFAULT 'Низкая',
    impact_id INT DEFAULT 1,
    impact VARCHAR(64) DEFAULT 'Низкое',
    product_name TEXT,
    product_master_id TEXT,
    service TEXT,
    scenario_name TEXT,
    solution TEXT,
    service_type TEXT DEFAULT 'Технологический',
    service_type_id INT DEFAULT 30,
    is_effect BOOLEAN DEFAULT FALSE,
    is_reason BOOLEAN DEFAULT FALSE,
    is_double BOOLEAN DEFAULT FALSE,
    is_master BOOLEAN DEFAULT FALSE,
    ai_risk_score DOUBLE PRECISION DEFAULT 0.0,
    ai_risk_level VARCHAR(32) DEFAULT 'LOW',
    ai_routing_hint TEXT DEFAULT '',
    ai_routing_confidence DOUBLE PRECISION DEFAULT 0.0,
    ai_sla_risk DOUBLE PRECISION DEFAULT 0.0,
    ai_sla_level VARCHAR(32) DEFAULT 'SAFE',
    ai_team_workload INT DEFAULT 0,
    ai_estimated_minutes INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_priority ON incidents (priority_id);
CREATE INDEX IF NOT EXISTS idx_incidents_state ON incidents (state);
CREATE INDEX IF NOT EXISTS idx_incidents_group ON incidents (assigned_group_name);
CREATE INDEX IF NOT EXISTS idx_incidents_updated_at ON incidents (updated_at);

CREATE TABLE IF NOT EXISTS incident_events (
    id SERIAL PRIMARY KEY,
    incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    message TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_incident_id ON incident_events (incident_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON incident_events (created_at DESC);

CREATE TABLE IF NOT EXISTS ai_predictions (
    id SERIAL PRIMARY KEY,
    incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    predicted_group VARCHAR(255),
    confidence DOUBLE PRECISION,
    top_candidates JSONB,
    predicted_risk_score DOUBLE PRECISION,
    predicted_risk_level VARCHAR(32),
    actual_group VARCHAR(255),
    is_accepted BOOLEAN,
    input_features JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    evaluated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_predictions_incident_id ON ai_predictions (incident_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_created_at ON ai_predictions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_is_accepted ON ai_predictions (is_accepted);
