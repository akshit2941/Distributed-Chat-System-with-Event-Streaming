package ratelimiter

import "time"

type FakeClock struct {
	current time.Time
}

func NewFakeClock(start time.Time) *FakeClock {
	return &FakeClock{current: start}
}

func (f *FakeClock) Now() time.Time {
	return f.current
}

func (f *FakeClock) Advance(d time.Duration) {
	f.current = f.current.Add(d)
}
