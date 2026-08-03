package ratelimiter

import "sync"

type MemoryStore struct {
	//using for concurrency
	mu sync.Mutex

	bucket map[string]*Bucket

	capacity   float64
	refillRate float64
}

func NewMemoryStore(capacity, refillRate float64) *MemoryStore {
	return &MemoryStore{
		bucket:     make(map[string]*Bucket),
		capacity:   capacity,
		refillRate: refillRate,
	}
}
func (s *MemoryStore) Get(key string) *Bucket {
	s.mu.Lock()
	defer s.mu.Unlock()

	bucket, exists := s.bucket[key]

	if !exists {
		bucket = NewBucket(s.capacity, s.refillRate)
		s.bucket[key] = bucket
	}
	return bucket
}
