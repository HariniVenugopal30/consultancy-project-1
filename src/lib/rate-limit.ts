type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

const globalStore = globalThis as unknown as {
  __rateLimitStore?: Map<string, RateLimitState>;
};

const store = globalStore.__rateLimitStore ?? new Map<string, RateLimitState>();
globalStore.__rateLimitStore = store;

function cleanupExpired(now: number) {
  for (const [key, value] of store.entries()) {
    if (value.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function consumeRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  cleanupExpired(now);

  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      success: true,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - 1),
      resetAt,
    };
  }

  existing.count += 1;
  store.set(key, existing);

  const remaining = Math.max(0, config.maxRequests - existing.count);

  return {
    success: existing.count <= config.maxRequests,
    limit: config.maxRequests,
    remaining,
    resetAt: existing.resetAt,
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp.trim();
  }

  return 'unknown';
}