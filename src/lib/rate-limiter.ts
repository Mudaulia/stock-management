import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) return null
    return Math.min(times * 100, 3000)
  },
  lazyConnect: true,
})

redis.on('error', (err) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Redis connection error:', err)
  }
})

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyPrefix?: string
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  total: number
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `${config.keyPrefix || 'ratelimit'}:${identifier}`
  const now = Date.now()
  const windowStart = now - config.windowMs

  try {
    await redis.connect()
  } catch {
    // If Redis is not available, allow the request (fail-open for availability)
    return {
      success: true,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
      total: config.maxRequests,
    }
  }

  const pipeline = redis.pipeline()
  pipeline.zremrangebyscore(key, 0, windowStart)
  pipeline.zcard(key)
  pipeline.zadd(key, now, `${now}-${Math.random()}`)
  pipeline.expire(key, Math.ceil(config.windowMs / 1000))
  const results = await pipeline.exec()

  if (!results) {
    return {
      success: true,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
      total: config.maxRequests,
    }
  }

  const currentCount = (results[1][1] as number) || 0
  const remaining = Math.max(0, config.maxRequests - currentCount - 1)
  const success = currentCount < config.maxRequests

  return {
    success,
    remaining,
    resetTime: now + config.windowMs,
    total: config.maxRequests,
  }
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.total.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  }
}

export async function closeRedis(): Promise<void> {
  await redis.quit()
}