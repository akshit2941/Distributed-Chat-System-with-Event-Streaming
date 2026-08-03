package main

import (
	"fmt"
	"net/http"
	"rate-limiter-go/pkg/ratelimiter"
	"rate-limiter-go/pkg/middleware"
)

func main() {
	// Example test server for rate limiter
	store := ratelimiter.NewMemoryStore(10, 2) // capacity = 10, refill = 2 per second
	clock := ratelimiter.RealClock{}
	limiter := ratelimiter.NewTokenBucketLimiter(store, clock)

	rateLimitMiddleware := middleware.RateLimitMiddleware(limiter)

	mux := http.NewServeMux()
	mux.HandleFunc("/api/test", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Request successful!"))
	})

	fmt.Println("Rate Limiter Test Server starting on :8082...")
	err := http.ListenAndServe(":8082", rateLimitMiddleware(mux))
	if err != nil {
		panic(err)
	}
}
