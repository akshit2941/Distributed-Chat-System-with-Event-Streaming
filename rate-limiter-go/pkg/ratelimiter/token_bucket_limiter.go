package ratelimiter

type TokenBucketLimiter struct {
	store Store
	clock Clock
}

func NewTokenBucketLimiter(store Store, clock Clock) *TokenBucketLimiter {
	return &TokenBucketLimiter{
		store: store,
		clock: clock,
	}
}

func (l *TokenBucketLimiter) Allow(key string) Result {
	bucket := l.store.Get(key)
	now := l.clock.Now()

	return bucket.allowWithResult(now)
}
