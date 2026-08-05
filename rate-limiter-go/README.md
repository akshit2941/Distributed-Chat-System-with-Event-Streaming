# Go Rate Limiter Middleware

This is a reusable Go library implementing a token-bucket algorithm. It is used by the Go WebSocket server to prevent handshake spam.

## Key Features

- Thread-safe token bucket implementation.
- API Key and IP-based rate tracking fallback.
