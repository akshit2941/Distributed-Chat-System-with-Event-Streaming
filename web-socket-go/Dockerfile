# Stage 1: Build the Go binary
FROM golang:alpine AS builder

WORKDIR /app

# Copy dependencies files and download
COPY go.mod go.sum ./
RUN go mod download

# Copy the entire source code and build the executable
COPY . .
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
