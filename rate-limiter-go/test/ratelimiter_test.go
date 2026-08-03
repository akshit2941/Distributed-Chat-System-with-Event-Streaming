package test

import (
	ratelimiter "rate-limiter-go/internal/ratelimiter"
	"testing"
	"time"
)

func TestFirstRequestAllowed(t *testing.T) {
	clock := ratelimiter.NewFakeClock(time.Unix(0, 0))
	// capacity = 5 tokens
	// refill rate = 1 token per second
	store := ratelimiter.NewMemoryStore(5, 1)
	limiter := ratelimiter.NewTokenBucketLimiter(store, clock)

	allowed := limiter.Allow("user-1")

	if !allowed {
		t.Fatalf("expected first request to be allowed, but was rejected")
	}

}

func TestBucketWithinCapacity(t *testing.T) {
	clock := ratelimiter.NewFakeClock(time.Unix(0, 0))
	store := ratelimiter.NewMemoryStore(3, 1)
	limiter := ratelimiter.NewTokenBucketLimiter(store, clock)

	//allow 3 request immediately
	for i := 0; i < 3; i++ {
		if !limiter.Allow("user-1") {
			t.Fatalf("request %d should have been allowed", i+1)
		}
	}

	//4th req
	if limiter.Allow("user-1") {
		t.Fatalf("expected request to be rejected after exceeding capacity")
	}
}

func TestRefillOverTIme(t *testing.T) {
	clock := ratelimiter.NewFakeClock(time.Unix(0, 0))
	store := ratelimiter.NewMemoryStore(1, 1)
	limiter := ratelimiter.NewTokenBucketLimiter(store, clock)

	if !limiter.Allow("user-1") {
		t.Fatalf("first request should be allowed")
	}

	if limiter.Allow("user-1") {
		t.Fatalf("second request should be rejected bcoz of unsufficient token")
	}

	clock.Advance(1 * time.Second)

	//this should allow
	if !limiter.Allow("user-1") {
		t.Fatalf("request allowed after token refill")
	}
}

func TestDifferentKeysHaveSeparateBuckets(t *testing.T) {
	clock := ratelimiter.NewFakeClock(time.Unix(0, 0))

	store := ratelimiter.NewMemoryStore(1, 1)
	limiter := ratelimiter.NewTokenBucketLimiter(store, clock)

	// Consume token for user-1
	if !limiter.Allow("user-1") {
		t.Fatalf("user-1 first request should be allowed")
	}

	// user-1 should now be rate-limited
	if limiter.Allow("user-1") {
		t.Fatalf("user-1 should be rate-limited")
	}

	// user-2 should still be allowed
	if !limiter.Allow("user-2") {
		t.Fatalf("user-2 should not be affected by user-1")
	}
}

func TestConcurrentAccess(t *testing.T) {
	clock := ratelimiter.NewFakeClock(time.Unix(0, 0))

	store := ratelimiter.NewMemoryStore(100, 100)
	limiter := ratelimiter.NewTokenBucketLimiter(store, clock)

	done := make(chan bool)

	// Fire 50 concurrent requests
	for i := 0; i < 50; i++ {
		go func() {
			limiter.Allow("user-1")
			done <- true
		}()
	}

	// Wait for all goroutines
	for i := 0; i < 50; i++ {
		<-done
	}
}
