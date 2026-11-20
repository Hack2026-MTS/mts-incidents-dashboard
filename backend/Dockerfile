# Multi-stage Dockerfile: build frontend + backend into single lightweight image
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM golang:1.24-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/go.* ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

FROM alpine:latest
WORKDIR /app
RUN apk --no-cache add ca-certificates
COPY --from=backend-builder /app/backend/server ./server
COPY --from=backend-builder /app/backend/internal/database/schema.sql ./internal/database/schema.sql
COPY --from=backend-builder /app/backend/models_ai ./models_ai
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY data ./data

EXPOSE 8080
CMD ["./server"]
