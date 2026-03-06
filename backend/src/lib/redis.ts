// Redis singleton using ioredis
// Gracefully handles cases where Redis is unreachable.

import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

function createClient(): Redis {
    const options = {
        maxRetriesPerRequest: null, // Required for some environments/versions
        enableReadyCheck: true,
        lazyConnect: true,
        connectTimeout: 10000,
        keepAlive: 0, // Disable keep-alive for some serverless providers
        retryStrategy: (times: number) => {
            const delay = Math.min(times * 200, 10_000);
            return delay;
        },
        ...(REDIS_PASSWORD ? { password: REDIS_PASSWORD } : {}),
    };

    return REDIS_URL
        ? new Redis(REDIS_URL, options)
        : new Redis({ ...options, host: REDIS_HOST, port: REDIS_PORT });
}

// Singleton Setup
const globalForRedis = global as unknown as { redisClient?: Redis };
export const redis: Redis = globalForRedis.redisClient ?? createClient();

if (!globalForRedis.redisClient) {
    globalForRedis.redisClient = redis;
}

let isConnected = false;

redis.on("connect", () => {
    isConnected = true;
    console.log("[Redis] Connected.");
});

redis.on("ready", () => {
    isConnected = true;
    console.log("[Redis] Ready.");
});

redis.on("error", (err: Error) => {
    isConnected = false;
    if ((err as NodeJS.ErrnoException).code !== "ECONNREFUSED") {
        console.warn("[Redis] Error:", err.message);
    }
});

redis.on("close", () => {
    isConnected = false;
});

// connect eagerly
redis.connect().catch((err: Error) => {
    console.warn("[Redis] Could not connect:", err.message, "(Running without cache)");
});

export const isRedisAvailable = () => isConnected && redis.status === "ready";

// Wrapper helpers
export async function rGet(key: string): Promise<string | null> {
    if (!isRedisAvailable()) return null;
    try {
        return await redis.get(key);
    } catch { return null; }
}

export async function rSet(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!isRedisAvailable()) return;
    try {
        await redis.set(key, value, "EX", ttlSeconds);
    } catch { /* ignore */ }
}

export async function rDel(...keys: string[]): Promise<void> {
    if (!isRedisAvailable()) return;
    try {
        await redis.del(...keys);
    } catch { /* ignore */ }
}

// Invalidate keys by pattern (SCAN based)
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
    } catch { /* ignore */ }
}

export default redis;
