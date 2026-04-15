const hits = new Map<string, number>();
let lastCleanupAt = 0;

const CLEANUP_EVERY_MS = 60_000;

function cleanup(now: number, ttlMs: number) {
  if (now - lastCleanupAt < CLEANUP_EVERY_MS) {
    return;
  }

  for (const [key, timestamp] of hits.entries()) {
    if (now - timestamp > ttlMs) {
      hits.delete(key);
    }
  }
  lastCleanupAt = now;
}

export function consumeRateLimitSlot({
  key,
  windowMs,
}: {
  key: string;
  windowMs: number;
}) {
  const now = Date.now();
  cleanup(now, windowMs * 4);

  const previous = hits.get(key);
  if (previous && now - previous < windowMs) {
    const remainingMs = windowMs - (now - previous);
    return {
      limited: true as const,
      retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000)),
    };
  }

  hits.set(key, now);
  return {
    limited: false as const,
    retryAfterSeconds: 0,
  };
}
