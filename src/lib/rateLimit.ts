// Simple in-memory token bucket rate limiter.
// Note: In serverless/multi-instance environments, use an external store (e.g. Redis) for accuracy.

export type RateLimitOptions = {
  windowMs: number; // time window in ms
  max: number; // max tokens per window
  refillRate?: number; // optional tokens per window (defaults to max)
};

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number; // epoch ms when bucket fully refills
};

const buckets = new Map<string, { tokens: number; updatedAt: number }>();

function getKey(ip: string, path: string) {
  return `${ip}::${path}`;
}

export function rateLimit(ip: string, path: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const key = getKey(ip, path);
  const refillRate = opts.refillRate ?? opts.max; // tokens per window
  const refillPerMs = refillRate / opts.windowMs; // tokens per ms

  const bucket = buckets.get(key) ?? { tokens: opts.max, updatedAt: now };

  // Refill based on elapsed time
  const elapsed = Math.max(0, now - bucket.updatedAt);
  const refill = elapsed * refillPerMs;
  bucket.tokens = Math.min(opts.max, bucket.tokens + refill);

  const allowed = bucket.tokens >= 1;
  if (allowed) {
    bucket.tokens -= 1;
  }
  bucket.updatedAt = now;
  buckets.set(key, bucket);

  const deficit = Math.max(0, 1 - bucket.tokens);
  const msUntilOne = deficit / refillPerMs; // time until at least one token
  const resetAt = now + Math.ceil(msUntilOne);

  return {
    success: allowed,
    remaining: Math.floor(bucket.tokens),
    resetAt,
  };
}

export function resetAllRateLimits() {
  buckets.clear();
}
