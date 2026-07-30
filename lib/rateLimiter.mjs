const requestLog = new Map();

export function isRateLimited(key, windowMs = 60000, maxRequests = 10) {
    const now = Date.now();
    const entry = requestLog.get(key);

    if (!entry) {
        requestLog.set(key, { count: 1, resetAt: now + windowMs });
        return false;
    }

    if (now > entry.resetAt) {
        requestLog.set(key, { count: 1, resetAt: now + windowMs });
        return false;
    }

    if (entry.count >= maxRequests) {
        return true;
    }

    entry.count += 1;
    return false;
}
