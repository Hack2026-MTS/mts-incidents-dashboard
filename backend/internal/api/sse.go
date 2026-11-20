package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"hack2026/backend/internal/models"
)

type SSEHub struct {
	clients    map[chan []byte]bool
	register   chan chan []byte
	unregister chan chan []byte
	broadcast  chan []byte
	mu         sync.Mutex
}

var globalHub *SSEHub
var hubOnce sync.Once

func GetSSEHub() *SSEHub {
	hubOnce.Do(func() {
		globalHub = &SSEHub{
			clients:    make(map[chan []byte]bool),
			register:   make(chan chan []byte),
			unregister: make(chan chan []byte),
			broadcast:  make(chan []byte, 100),
		}
		go globalHub.run()
	})
	return globalHub
}

func (h *SSEHub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("[SSE] Client connected. Total active clients: %d\n", len(h.clients))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client)
			}
			h.mu.Unlock()
			log.Printf("[SSE] Client disconnected. Total active clients: %d\n", len(h.clients))

		case message := <-h.broadcast:
			h.mu.Lock()
			for client := range h.clients {
				select {
				case client <- message:
				default:
					close(client)
					delete(h.clients, client)
				}
			}
			h.mu.Unlock()
		}
	}
}

func (h *SSEHub) BroadcastEvent(eventType string, inc *models.Incident, message string) {
	evt := models.SSEMessage{
		Type:      eventType,
		Incident:  inc,
		Message:   message,
		Timestamp: time.Now(),
	}

	payload, err := json.Marshal(evt)
	if err != nil {
		log.Printf("[SSE] Failed to marshal event: %v\n", err)
		return
	}

	sseFormatted := fmt.Sprintf("event: message\ndata: %s\n\n", string(payload))
	h.broadcast <- []byte(sseFormatted)
}

func (h *SSEHub) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported!", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	clientChan := make(chan []byte, 10)
	h.register <- clientChan
	defer func() {
		h.unregister <- clientChan
	}()

	// Send initial ping
	fmt.Fprintf(w, "event: connected\ndata: {\"status\":\"ok\"}\n\n")
	flusher.Flush()

	ctx := r.Context()
	for {
		select {
		case <-ctx.Done():
			return
		case msg, ok := <-clientChan:
			if !ok {
				return
			}
			w.Write(msg)
			flusher.Flush()
		}
	}
}
