# Go WebSocket Server

This is the Go-based WebSocket server. It handles client connections, real-time message broadcasting, room subscriptions, and token-bucket connection throttling.

## Key Features

- High-concurrency Gorilla Websocket handler.
- Integration with RabbitMQ to ingest and publish real-time events.
- Handshake rate-limiting middleware using rate-limiter-go.
