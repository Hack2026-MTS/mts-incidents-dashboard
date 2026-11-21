package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"hack2026/backend/internal/database"
	"hack2026/backend/internal/models"
)

type DemoHandler struct {
	db     *database.DB
	sseHub *SSEHub
}

func NewDemoHandler(db *database.DB, sseHub *SSEHub) *DemoHandler {
	return &DemoHandler{db: db, sseHub: sseHub}
}

// CreateCritical simulates a sudden mass critical incident in production
func (d *DemoHandler) CreateCritical(w http.ResponseWriter, r *http.Request) {
	now := time.Now()
	deadline := now.Add(4 * time.Hour)

	inc := &models.Incident{
		ID:                          fmt.Sprintf("INC%010d", time.Now().Unix()%1000000000),
		SysID:                       fmt.Sprintf("%d", time.Now().UnixNano()),
		State:                       "Выполняется",
		StateEnum:                   "InProgress",
		StateID:                     2,
		StateReason:                 "В работе",
		SubmitDate:                  &now,
		Deadline:                    &deadline,
		LastAssignmentToTeamDateTime: &now,
		Header:                      "МАССОВЫЙ СБОЙ: Отказ авторизации пользователей KION в МЦОД",
		Description:                 "Критический инцидент: недоступно ядро авторизации и стриминга KION в датацентре. Массовые жалобы абонентов. Требуется немедленная реакция координаторов и дежурных инженеров.",
		ShortDescription:            "Отказ шлюза авторизации KION",
		AssignedGroupName:           "КЦ ИТ Media L2 KION",
		AssignedEmployee:            "Иван Координаторов",
		AssignedEmployeeLogin:       "ikoord",
		InitiatorName:               "Система Мониторинга Zabbix",
		InitiatorLogin:              "zabbix_bot",
		PriorityID:                  4,
		Priority:                    "Наивысший",
		UrgencyID:                   4,
		Urgency:                     "Наивысшая",
		ImpactID:                    4,
		Impact:                      "Наивысшее",
		ProductName:                 "Онлайн-кинотеатр KION",
		ProductMasterID:             "BI_KION_CORE",
		Service:                     "[KION] Сервис стриминга и профилей",
		ScenarioName:                "Авторизация и воспроизведение",
		ServiceType:                 "Клиентский",
		ServiceTypeID:               10,
	}

	if err := d.db.UpsertIncident(inc); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	saved, _ := d.db.GetIncidentByID(inc.ID)
	_ = d.db.RecordAIPrediction(saved)
	_ = d.db.RecordEvent(saved.ID, "CREATED", "Зарегистрирован критический сбой: "+saved.Header, map[string]any{
		"priority": saved.Priority,
		"group":    saved.AssignedGroupName,
		"risk":     saved.AIRiskScore,
	})
	d.sseHub.BroadcastEvent("CRITICAL_ALERT", saved, "🚨 КРИТИЧЕСКИЙ ИНЦИДЕНТ: "+saved.Header)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(saved)
}

// AssignToCoordinator simulates an unrouted incident landing on coordinators
func (d *DemoHandler) AssignToCoordinator(w http.ResponseWriter, r *http.Request) {
	now := time.Now()
	deadline := now.Add(24 * time.Hour)

	inc := &models.Incident{
		ID:                          fmt.Sprintf("INC%010d", time.Now().Unix()%1000000000),
		SysID:                       fmt.Sprintf("%d", time.Now().UnixNano()),
		State:                       "Назначен",
		StateEnum:                   "Assigned",
		StateID:                     0,
		StateReason:                 "Требуется маршрутизация",
		SubmitDate:                  &now,
		Deadline:                    &deadline,
		LastAssignmentToTeamDateTime: &now,
		Header:                      "Ошибка репликации дисковых массивов SAN в кластере VMWare",
		Description:                 "Зафиксированы задержки ввода-вывода SAN и ошибки синхронизации лунов в кластере виртуализации VMWare ESXi. Заявка ошибочно упала на координаторов.",
		ShortDescription:            "Сбои синхронизации LUN SAN",
		AssignedGroupName:           "КЦ ИТ Координаторы Массовых Инцидентов",
		InitiatorName:               "Дежурный инженер",
		InitiatorLogin:              "ops_duty",
		PriorityID:                  3,
		Priority:                    "Высокий",
		UrgencyID:                   3,
		Urgency:                     "Высокая",
		ImpactID:                    3,
		Impact:                      "Высокое",
		ProductName:                 "Инфраструктура SAN и Виртуализации",
		ProductMasterID:             "BI_SAN_01",
		Service:                     "[Инфраструктура] Дисковые массивы SAN",
		ScenarioName:                "Администрирование SAN",
		ServiceType:                 "Технологический",
		ServiceTypeID:               30,
	}

	if err := d.db.UpsertIncident(inc); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	saved, _ := d.db.GetIncidentByID(inc.ID)
	_ = d.db.RecordAIPrediction(saved)
	_ = d.db.RecordEvent(saved.ID, "CREATED", "Инцидент поступил в систему", map[string]any{"group": saved.AssignedGroupName})
	_ = d.db.RecordEvent(saved.ID, "AI_ROUTING_RECOMMENDED", "ИИ рекомендовал передать в: "+saved.AIRoutingHint, map[string]any{
		"recommended_group": saved.AIRoutingHint,
		"confidence":        saved.AIRoutingConfidence,
		"risk_score":        saved.AIRiskScore,
	})
	d.sseHub.BroadcastEvent("COORDINATOR_ALERT", saved, "👤 Новый инцидент назначен на координаторов: "+saved.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(saved)
}

// ResolveIncident marks incident as resolved/completed
func (d *DemoHandler) ResolveIncident(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		// Pick first active critical incident if not specified
		incidents, _ := d.db.GetIncidents()
		for _, inc := range incidents {
			if (inc.PriorityID == 4 || inc.Priority == "Наивысший") && inc.State != "Завершен" && inc.State != "Закрыт" {
				id = inc.ID
				break
			}
		}
	}

	if id == "" {
		http.Error(w, "No active critical incident found to resolve", http.StatusBadRequest)
		return
	}

	inc, err := d.db.GetIncidentByID(id)
	if err != nil {
		http.Error(w, "Incident not found", http.StatusNotFound)
		return
	}

	now := time.Now()
	inc.State = "Завершен"
	inc.StateEnum = "Completed"
	inc.StateID = 10
	inc.StateReason = "Решено"
	inc.CompletionDate = &now
	inc.Solution = "Проблема устранена: переключен резервный кластер шлюзов, сервис восстановлен в полном объеме."

	_ = d.db.UpsertIncident(inc)
	saved, _ := d.db.GetIncidentByID(id)
	_ = d.db.RecordEvent(saved.ID, "RESOLVED", "Инцидент решен: "+saved.Solution, map[string]any{"solution": saved.Solution})

	d.sseHub.BroadcastEvent("INCIDENT_RESOLVED", saved, "✅ Инцидент успешно решен: "+saved.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(saved)
}

// ResetData wipes and re-seeds from character_problems.json
func (d *DemoHandler) ResetData(w http.ResponseWriter, r *http.Request) {
	_, err := d.db.Conn.Exec("TRUNCATE incidents CASCADE")
	if err != nil {
		http.Error(w, "Failed to truncate: "+err.Error(), http.StatusInternalServerError)
		return
	}

	seedPath := "c:\\Users\\lacker\\Projects\\Hack2026\\data\\character_problems.json"
	_ = d.db.SeedFromJSONIfEmpty(seedPath)

	d.sseHub.BroadcastEvent("DASHBOARD_RESET", nil, "Дашборд сброшен к исходным данным")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "reset_successful"})
}
