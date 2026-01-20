import redis from "./redis";

interface RateLimitOptions {
  key: string;       // identifier (ip, userId, dll)
  limit: number;     // max request
  window: number;    // window in seconds
}

export async function rateLimiter({
  key,
  limit,
  window,
}: RateLimitOptions) {
  const redisKey = `rate_limit:${key}`;

  const current = await redis.incr(redisKey);

  // first request → set TTL
  if (current === 1) {
    await redis.expire(redisKey, window);
  }

  const ttl = await redis.ttl(redisKey);

  return {
    allowed: current <= limit,
    remaining: Math.max(limit - current, 0),
    reset: ttl, // seconds until reset
  };
}
