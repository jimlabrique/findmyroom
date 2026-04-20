import { Redis } from "@upstash/redis";

const inMemoryHits = new Map<string, number>();
let lastCleanupAt = 0;

const CLEANUP_EVERY_MS = 60_000;
const UPSTASH_URL = `${process.env.UPSTASH_REDIS_REST_URL ?? ""}`.trim();
const UPSTASH_TOKEN = `${process.env.UPSTASH_REDIS_REST_TOKEN ?? ""}`.trim();
const hasUpstash = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

let redisClient: Redis | null | undefined;

function getRedisClient() {
  if (redisClient !== undefined) return redisClient;
  if (!hasUpstash) {
    redisClient = null;
    return redisClient;
  }
  redisClient = new Redis({
    url: UPSTASH_URL,
    token: UPSTASH_TOKEN,
  });
  return redisClient;
}

function cleanup(now: number, ttlMs: number) {
  if (now - lastCleanupAt < CLEANUP_EVERY_MS) {
    return;
  }

  for (const [key, timestamp] of inMemoryHits.entries()) {
    if (now - timestamp > ttlMs) {
      inMemoryHits.delete(key);
    }
  }
  lastCleanupAt = now;
}

async function consumeInMemorySlot({
  key,
  windowMs,
}: {
  key: string;
  windowMs: number;
}) {
  const now = Date.now();
  cleanup(now, windowMs * 4);

  const previous = inMemoryHits.get(key);
  if (previous && now - previous < windowMs) {
    const remainingMs = windowMs - (now - previous);
    return {
      limited: true as const,
      retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000)),
    };
  }

  inMemoryHits.set(key, now);
  return {
    limited: false as const,
    retryAfterSeconds: 0,
  };
}

async function consumeRedisSlot({
  key,
  windowMs,
}: {
  key: string;
  windowMs: number;
}) {
  const redis = getRedisClient();
  if (!redis) {
    return consumeInMemorySlot({ key, windowMs });
  }

  try {
    const bucketKey = `fmr:rate:${key}`;
    const count = await redis.incr(bucketKey);

    if (count === 1) {
      await redis.pexpire(bucketKey, windowMs);
      return {
        limited: false as const,
        retryAfterSeconds: 0,
      };
    }

    const ttlMs = await redis.pttl(bucketKey);
    const retryAfterSeconds = ttlMs > 0 ? Math.max(1, Math.ceil(ttlMs / 1000)) : Math.max(1, Math.ceil(windowMs / 1000));

    return {
      limited: true as const,
      retryAfterSeconds,
    };
  } catch {
    return consumeInMemorySlot({ key, windowMs });
  }
}

export async function consumeRateLimitSlot({
  key,
  windowMs,
}: {
  key: string;
  windowMs: number;
}) {
  return consumeRedisSlot({ key, windowMs });
}

export async function consumeRateLimitByIdentity({
  prefix,
  identity,
  windowMs,
}: {
  prefix: string;
  identity: string;
  windowMs: number;
}) {
  const normalizedIdentity = identity.trim().toLowerCase();
  if (!normalizedIdentity) {
    return {
      limited: false as const,
      retryAfterSeconds: 0,
    };
  }

  return consumeRateLimitSlot({
    key: `${prefix}:${normalizedIdentity}`,
    windowMs,
  });
}
