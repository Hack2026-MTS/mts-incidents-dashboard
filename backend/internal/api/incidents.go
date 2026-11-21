package api

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"hack2026/backend/internal/database"
	"hack2026/backend/internal/models"
)

type IncidentHandler struct {
	db     *database.DB
	sseHub *SSEHub
}

func NewIncidentHandler(db *database.DB, sseHub *SSEHub) *IncidentHandler {
	return &IncidentHandler{
		db:     db,
		sseHub: sseHub,
	}
}

func (h *IncidentHandler) GetIncidents(w http.ResponseWriter, r *http.Request) {
	incidents, err := h.db.GetIncidents()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	search := strings.ToLower(r.URL.Query().Get("search"))
	groupFilter := r.URL.Query().Get("group")

	var filtered []*models.Incident
	for _, inc := range incidents {
		if search != "" {
			match := strings.Contains(strings.ToLower(inc.ID), search) ||
				strings.Contains(strings.ToLower(inc.Header), search) ||
				strings.Contains(strings.ToLower(inc.Description), search) ||
				strings.Contains(strings.ToLower(inc.ProductName), search) ||
				strings.Contains(strings.ToLower(inc.AssignedGroupName), search)
			if !match {
				continue
			}
		}

		if groupFilter != "" {
			switch groupFilter {
			case "critical":
				if inc.PriorityID != 4 && inc.Priority != "Наивысший" {
					continue
				}
			case "coordinators":
				if inc.AssignedGroupName != "КЦ ИТ Координаторы Массовых Инцидентов" {
					continue
				}
			case "high":
				if inc.PriorityID != 3 && inc.Priority != "Высокий" {
					continue
				}
			case "investigation":
				if inc.State != "Исследование ситуации" {
					continue
				}
			}
		}

		filtered = append(filtered, inc)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(filtered)
}

func (h *IncidentHandler) GetIncidentByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	inc, err := h.db.GetIncidentByID(id)
	if err != nil {
		http.Error(w, "Incident not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(inc)
}

func (h *IncidentHandler) CreateIncident(w http.ResponseWriter, r *http.Request) {
	var inc models.Incident
	if err := json.NewDecoder(r.Body).Decode(&inc); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	if inc.ID == "" {
		http.Error(w, "Missing incident ID", http.StatusBadRequest)
		return
	}

	if err := h.db.UpsertIncident(&inc); err != nil {
		http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Fetch enriched incident
	saved, _ := h.db.GetIncidentByID(inc.ID)

	// Record AI Prediction for MLOps tracking
	_ = h.db.RecordAIPrediction(saved)

	// Record audit event
	_ = h.db.RecordEvent(saved.ID, "CREATED", "Инцидент зарегистрирован в системе", map[string]any{
		"priority": saved.Priority,
		"group":    saved.AssignedGroupName,
		"risk":     saved.AIRiskScore,
	})

	// Broadcast SSE
	h.sseHub.BroadcastEvent("INCIDENT_CREATED", saved, "Новый инцидент зарегистрирован: "+saved.ID)

	if saved.PriorityID == 4 || saved.Priority == "Наивысший" {
		h.sseHub.BroadcastEvent("CRITICAL_ALERT", saved, "🚨 КРИТИЧЕСКИЙ ИНЦИДЕНТ: "+saved.Header)
	}
	if saved.AssignedGroupName == "КЦ ИТ Координаторы Массовых Инцидентов" {
		_ = h.db.RecordEvent(saved.ID, "AI_ROUTING_RECOMMENDED", "ИИ рекомендовал передать в: "+saved.AIRoutingHint, map[string]any{
			"recommended_group": saved.AIRoutingHint,
			"confidence":        saved.AIRoutingConfidence,
			"risk_score":        saved.AIRiskScore,
		})
		h.sseHub.BroadcastEvent("COORDINATOR_ALERT", saved, "👤 Инцидент назначен на координаторов: "+saved.ID)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(saved)
}

func (h *IncidentHandler) UpdateIncident(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	existing, err := h.db.GetIncidentByID(id)
	if err != nil {
		http.Error(w, "Incident not found", http.StatusNotFound)
		return
	}

	var updateData models.Incident
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		http.Error(w, "Invalid payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Merge updates
	oldGroup := existing.AssignedGroupName
	oldState := existing.State

	if updateData.State != "" {
		existing.State = updateData.State
	}
	if updateData.AssignedGroupName != "" {
		existing.AssignedGroupName = updateData.AssignedGroupName
	}
	if updateData.AssignedEmployee != "" {
		existing.AssignedEmployee = updateData.AssignedEmployee
	}
	if updateData.PriorityID != 0 {
		existing.PriorityID = updateData.PriorityID
		existing.Priority = updateData.Priority
	}
	if updateData.Deadline != nil {
		existing.Deadline = updateData.Deadline
	}
	if updateData.Solution != "" {
		existing.Solution = updateData.Solution
	}

	if err := h.db.UpsertIncident(existing); err != nil {
		http.Error(w, "Database update error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	saved, _ := h.db.GetIncidentByID(id)

	// Record audit events for changes
	if existing.AssignedGroupName != oldGroup {
		_ = h.db.RecordEvent(id, "REASSIGNED", "Перенаправлен в команду: "+existing.AssignedGroupName, map[string]string{
			"from": oldGroup,
			"to":   existing.AssignedGroupName,
		})
		// Record feedback for ML evaluation in ai_predictions
		_ = h.db.UpdateAIPredictionFeedback(id, existing.AssignedGroupName)
	}
	if existing.State != oldState {
		_ = h.db.RecordEvent(id, "STATE_CHANGED", "Статус изменен на: "+existing.State, map[string]string{
			"old": oldState,
			"new": existing.State,
		})
	}

	h.sseHub.BroadcastEvent("INCIDENT_UPDATED", saved, "Обновлен статус инцидента: "+saved.ID)

	if saved.PriorityID == 4 || saved.Priority == "Наивысший" {
		h.sseHub.BroadcastEvent("CRITICAL_ALERT", saved, "🚨 Эскалация в КРИТИЧЕСКИЙ: "+saved.Header)
	}
	if saved.AssignedGroupName == "КЦ ИТ Координаторы Массовых Инцидентов" {
		_ = h.db.RecordEvent(saved.ID, "AI_ROUTING_RECOMMENDED", "ИИ рекомендовал передать в: "+saved.AIRoutingHint, map[string]any{
			"recommended_group": saved.AIRoutingHint,
			"confidence":        saved.AIRoutingConfidence,
			"risk_score":        saved.AIRiskScore,
		})
		h.sseHub.BroadcastEvent("COORDINATOR_ALERT", saved, "👤 Передан координаторам: "+saved.ID)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(saved)
}

func (h *IncidentHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.db.GetStats()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

func (h *IncidentHandler) GetIncidentEvents(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	events, err := h.db.GetEventsForIncident(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(events)
}

func (h *IncidentHandler) GetIncidentPredictions(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	preds, err := h.db.GetAIPredictions(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(preds)
}
