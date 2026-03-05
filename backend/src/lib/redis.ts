/**
 * redis.ts
 *
 * Singleton Redis client using ioredis.
 *
 * Gracefully handles the case where Redis is not available (REDIS_URL not set
 * or server unreachable). In that mode every cache operation is a no-op so the
 * app works exactly as before — Redis is purely additive.
 *
 * Connection string priority:
 *   1. REDIS_URL env var  (e.g. redis://localhost:6379)
 *   2. REDIS_HOST + REDIS_PORT env vars
 *   3. Default localhost:6379
 */

import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

// ─── Build client ─────────────────────────────────────────────────────────────
function createClient(): Redis {
    const options = {
        maxRetriesPerRequest: 3,     // surface errors quickly; don't hang forever
        enableReadyCheck: true,
        lazyConnect: true,           // don't auto-connect; we call .connect() explicitly
        retryStrategy: (times: number) => {
            // Exponential back-off capped at 10 s — keeps reconnecting in background
            return Math.min(times * 200, 10_000);
        },
        ...(REDIS_PASSWORD ? { password: REDIS_PASSWORD } : {}),
    };

    return REDIS_URL
        ? new Redis(REDIS_URL, options)
        : new Redis({ ...options, host: REDIS_HOST, port: REDIS_PORT });
}

// ─── Singleton ────────────────────────────────────────────────────────────────
const globalForRedis = global as unknown as { redisClient?: Redis };

export const redis: Redis = globalForRedis.redisClient ?? createClient();

if (!globalForRedis.redisClient) {
    globalForRedis.redisClient = redis;
}

// ─── Connect (non-blocking) ───────────────────────────────────────────────────
let isConnected = false;

redis.on("connect", () => {
    isConnected = true;
    console.log("[Redis] ✅ Connected.");
});

redis.on("ready", () => {
    isConnected = true;
    console.log("[Redis] 🚀 Ready to serve requests.");
});

redis.on("error", (err: Error) => {
    isConnected = false;
    // Don't crash the process — Redis is optional
    if ((err as NodeJS.ErrnoException).code !== "ECONNREFUSED") {
        console.warn("[Redis] ⚠️  Error:", err.message);
    }
});

redis.on("close", () => {
    isConnected = false;
});

// We try to connect eagerly, but if it fails the app continues without caching.
redis.connect().catch((err: Error) => {
    console.warn("[Redis] ⚠️  Could not connect on startup:", err.message, "— running WITHOUT cache.");
});

// ─── isRedisAvailable helper ─────────────────────────────────────────────────
export const isRedisAvailable = () => isConnected && redis.status === "ready";

// ─── Safe wrappers (no-op when Redis is down) ─────────────────────────────────
export async function rGet(key: string): Promise<string | null> {
    if (!isRedisAvailable()) return null;
    try {
        return await redis.get(key);
    } catch {
        return null;
    }
}

export async function rSet(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!isRedisAvailable()) return;
    try {
        await redis.set(key, value, "EX", ttlSeconds);
    } catch {
        // silently ignore
    }
}

export async function rDel(...keys: string[]): Promise<void> {
    if (!isRedisAvailable()) return;
    try {
        await redis.del(...keys);
    } catch {
        // silently ignore
    }
}

/**
 * Invalidate all keys that match a pattern.
 * Uses SCAN so it never blocks the server.
 */
export async function rFlushPattern(pattern: string): Promise<void> {
    if (!isRedisAvailable()) return;
    try {
        let cursor = "0";
        do {
            const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } while (cursor !== "0");
    } catch {
        // silently ignore
    }
}

export default redis;
