# Stage 1: Build the Go binary
FROM golang:alpine AS builder

WORKDIR /app

# Copy the dependency rate-limiter-go module
COPY rate-limiter-go /rate-limiter-go

# Copy the web-socket-go source files
COPY web-socket-go /app

# Build the executable
RUN CGO_ENABLED=0 GOOS=linux go build -o ws-server ./cmd/server

# Stage 2: Final lightweight image
FROM alpine:latest

WORKDIR /app

# Copy the compiled binary from the builder stage
COPY --from=builder /app/ws-server .

# Expose the WebSocket port
EXPOSE 8081

# Run the executable
CMD ["./ws-server"]
