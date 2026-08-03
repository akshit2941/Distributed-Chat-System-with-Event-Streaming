package main

import (
	"fmt"
	"net/http"
	"rate-limiter-go/pkg/ratelimiter"
	"rate-limiter-go/pkg/middleware"
	"web-socket-go/internal/manager"
	"web-socket-go/internal/rabbitmq"
	"web-socket-go/internal/ws"
)

var mgr = manager.NewManager()
var producer = rabbitmq.NewProducer()

func main() {
	consumer := rabbitmq.NewConsumer(mgr)
	consumer.Start()
	defer consumer.Close()

	// Initialize the rate limiter: capacity of 100 connections, refill rate of 10 per second
	store := ratelimiter.NewMemoryStore(100, 10)
	clock := ratelimiter.RealClock{}
	limiter := ratelimiter.NewTokenBucketLimiter(store, clock)

	// Create the rate limit middleware
	rateLimitMiddleware := middleware.RateLimitMiddleware(limiter)

	// Wrap our ws handler with the rate limiting middleware
	wsHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ws.HandleWebSocket(mgr, producer, w, r)
	})

	http.Handle("/ws", rateLimitMiddleware(wsHandler))

	fmt.Println("Server Started on port :8081 (Rate Limited via Token Bucket)")

	err := http.ListenAndServe(":8081", nil)
	if err != nil {
		panic(err)
	}
}
