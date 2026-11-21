package api

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"hack2026/backend/internal/database"
)

func SetupRouter(db *database.DB) *chi.Mux {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Setup CORS for local dev
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:5173", "*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	sseHub := GetSSEHub()
	incidentHandler := NewIncidentHandler(db, sseHub)
	demoHandler := NewDemoHandler(db, sseHub)

	r.Route("/api", func(api chi.Router) {
		api.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte(`{"status":"ok"}`))
		})

		// SSE Stream
		api.Get("/events", sseHub.ServeHTTP)

		// Stats
		api.Get("/stats", incidentHandler.GetStats)

		// Incidents CRUD
		api.Get("/incidents", incidentHandler.GetIncidents)
		api.Post("/incidents", incidentHandler.CreateIncident)
		api.Get("/incidents/{id}", incidentHandler.GetIncidentByID)
		api.Get("/incidents/{id}/events", incidentHandler.GetIncidentEvents)
		api.Get("/incidents/{id}/predictions", incidentHandler.GetIncidentPredictions)
		api.Put("/incidents/{id}", incidentHandler.UpdateIncident)

		// Demo scenario helpers
		api.Route("/demo", func(demo chi.Router) {
			demo.Post("/create-critical", demoHandler.CreateCritical)
			demo.Post("/assign-coordinator", demoHandler.AssignToCoordinator)
			demo.Post("/resolve-critical", demoHandler.ResolveIncident)
			demo.Post("/reset", demoHandler.ResetData)
		})
	})

	// Serve frontend SPA static build if dist exists
	distCandidates := []string{
		"../frontend/dist",
		"frontend/dist",
		"c:\\Users\\lacker\\Projects\\Hack2026\\frontend\\dist",
	}
	for _, distDir := range distCandidates {
		if fi, err := os.Stat(distDir); err == nil && fi.IsDir() {
			fs := http.FileServer(http.Dir(distDir))
			r.Get("/*", func(w http.ResponseWriter, req *http.Request) {
				path := filepath.Join(distDir, req.URL.Path)
				if _, err := os.Stat(path); os.IsNotExist(err) {
					http.ServeFile(w, req, filepath.Join(distDir, "index.html"))
					return
				}
				fs.ServeHTTP(w, req)
			})
			break
		}
	}

	return r
}
