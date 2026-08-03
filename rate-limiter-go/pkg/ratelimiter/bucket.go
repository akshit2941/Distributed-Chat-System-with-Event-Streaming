package ratelimiter

import "time"

type Bucket struct {
	tokens     float64
	capacity   float64
	refillRate float64
	lastRefill time.Time
}

func NewBucket(capacity, refillRate float64) *Bucket {
	return &Bucket{
		tokens:     capacity,
		capacity:   capacity,
		refillRate: capacity,
		lastRefill: time.Now(),
	}
}

func (b *Bucket) refill(now time.Time) {
	elapsed := now.Sub(b.lastRefill)

	if elapsed < time.Second {
		return
	}

	seconds := elapsed.Seconds()

	b.tokens += seconds * b.refillRate

	if b.tokens > b.capacity {
		b.tokens = b.capacity
	}

	b.lastRefill = now
}

func (b *Bucket) allow(now time.Time) bool {
	b.refill(now)

	if b.tokens >= 1 {
		b.tokens -= 1
		return true
	}
	return false
}

func (b *Bucket) allowWithResult(now time.Time) Result {
	b.refill(now)

	result := Result{
		Limit:     int(b.capacity),
		Remaining: int(b.tokens),
	}

	if b.tokens >= 1 {
		b.tokens -= 1
		result.Allowed = true
		result.Remaining = int(b.tokens)
		return result
	}

	result.Allowed = false

	secondsUntilNext := (1 - b.tokens) / b.refillRate
	result.RetryAfter = time.Duration(secondsUntilNext * float64(time.Second))

	return result
}
