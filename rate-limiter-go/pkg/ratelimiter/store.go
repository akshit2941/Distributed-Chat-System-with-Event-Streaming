package ratelimiter

type Store interface {
	Get(key string) *Bucket
}
