package ratelimiter

import "time"

type Clock interface {
	Now() time.Time
}
