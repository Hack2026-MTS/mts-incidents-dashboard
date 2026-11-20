package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"hack2026/backend/internal/api"
	"hack2026/backend/internal/database"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/itsm_dashboard?sslmode=disable"
	}

	log.Println("==================================================")
	log.Println("  MTC True Tech - ITSM Incident Dashboard Backend  ")
	log.Println("==================================================")

	db, err := database.Connect(dbURL)
	if err != nil {
		log.Fatalf("[FATAL] Could not connect to DB: %v\n", err)
	}
	defer db.Conn.Close()

	// Ensure schema
	_ = db.InitSchema("internal/database/schema.sql")

	// Seed data if empty
	seedCandidates := []string{
		"../data/character_problems.json",
		"data/character_problems.json",
		"c:\\Users\\lacker\\Projects\\Hack2026\\data\\character_problems.json",
	}
	for _, p := range seedCandidates {
		if _, err := os.Stat(p); err == nil {
			_ = db.SeedFromJSONIfEmpty(p)
			break
		}
	}

	router := api.SetupRouter(db)

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	go func() {
		log.Printf("[SERVER] Starting HTTP server on http://localhost:%s\n", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[FATAL] Listen error: %v\n", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("[SERVER] Shutting down gracefully...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("[SERVER] Force shutdown error: %v\n", err)
	}
	log.Println("[SERVER] Server exited cleanly")
}
