import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 100, 3000);
  },
  lazyConnect: true,
  enableOfflineQueue: false,
});

redis.on("error", (err) => {
  if (process.env.NODE_ENV === "development") {
    console.error("Redis connection error:", err);
  }
});

/**
 * Single-flight connection: connect at most once until the status leaves
 * "connecting"/"connecting" states. Calling `connect()` on an already
 * ready client throws — which previously caused false fail-open.
 */
let connecting: Promise<void> | null = null;

async function ensureConnected(): Promise<void> {
  if (redis.status === "ready") return;
  if (redis.status === "connecting") {
    await (connecting ?? redis.connect());
    return;
  }
  connecting = redis.connect();
  try {
    await connecting;
  } finally {
    connecting = null;
  }
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  total: number;
}

/**
 * SEC-007 fallback: in-memory sliding-window limiter yang dipakai ketika
 * Redis tidak tersedia. Sebelumnya rate limit fail-open penuh — sekarang
 * brute-force protection tetap aktif (per-instance) selama Redis down.
 */
const memoryStore = new Map<string, number[]>();
const MEMORY_MAX_KEYS = 10_000;

function memoryRateLimit(
  key: string,
  config: RateLimitConfig,
  now: number,
): RateLimitResult {
  const windowStart = now - config.windowMs;
  let timestamps = memoryStore.get(key);

  if (timestamps) {
    timestamps = timestamps.filter((t) => t > windowStart);
  } else {
    // Bound memory usage sederhana untuk penggantian Map
    if (memoryStore.size >= MEMORY_MAX_KEYS) {
      const firstKey = memoryStore.keys().next().value;
      if (firstKey !== undefined) memoryStore.delete(firstKey);
    }
    timestamps = [];
  }

  const success = timestamps.length < config.maxRequests;
  if (success) timestamps.push(now);
  memoryStore.set(key, timestamps);

  return {
    success,
    remaining: Math.max(0, config.maxRequests - timestamps.length),
    resetTime: now + config.windowMs,
    total: config.maxRequests,
  };
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const key = `${config.keyPrefix || "ratelimit"}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    await ensureConnected();
  } catch {
    // Redis unavailable — gunakan fallback in-memory, bukan fail-open penuh.
    return memoryRateLimit(key, config, now);
  }

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);
  pipeline.zcard(key);
  pipeline.zadd(key, now, `${now}-${Math.random()}`);
  pipeline.expire(key, Math.ceil(config.windowMs / 1000));

  let results: [error: Error | null, result: unknown][] | null;
  try {
    results = await pipeline.exec();
  } catch {
    // Pipeline failures (e.g. connection dropped mid-request) also fall back
    results = null;
  }

  if (!results) {
    return memoryRateLimit(key, config, now);
  }

  const currentCount = (results[1][1] as number) || 0;
  const remaining = Math.max(0, config.maxRequests - currentCount - 1);
  const success = currentCount < config.maxRequests;

  return {
    success,
    remaining,
    resetTime: now + config.windowMs,
    total: config.maxRequests,
  };
}

export function getRateLimitHeaders(
  result: RateLimitResult,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.total.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
  };
}
