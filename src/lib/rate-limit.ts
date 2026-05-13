const rateMap = new Map<string, { count: number; resetAt: number }>();

/**
 * In-memory rate limiter.
 * Returns `true` if the request is allowed, `false` if rate-limited.
 *
 * @param key - Unique key for the entity being rate-limited (e.g., IP, user ID)
 * @param maxAttempts - Maximum number of attempts allowed within the window
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 60000,
): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false; // blocked
  }

  entry.count++;
  return true;
}
