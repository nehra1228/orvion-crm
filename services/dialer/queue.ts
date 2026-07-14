type Redis = { zadd: (key: string, score: string, value: string) => Promise<void>; zrangebyscore: (key: string, min: string, max: string, limit: string, offset: number, count: number) => Promise<string[]>; zrem: (key: string, value: string) => Promise<void>; zcard: (key: string) => Promise<number>; };
let redis: Redis | null = null;
try {
  const IORedis = require("ioredis");
  const url = process.env.REDIS_URL || "";
  if (url) redis = new IORedis(url);
} catch (e) {
  // ioredis not installed or REDIS_URL not set — fall back to in-memory queue
}

type QueueItem = { score: number; value: string };
const inMemoryQueue: QueueItem[] = [];

export async function pushToQueue(key: string, score: number, value: string) {
  if (redis) {
    await redis.zadd(key, score.toString(), value);
    return;
  }
  inMemoryQueue.push({ score, value });
  inMemoryQueue.sort((a, b) => a.score - b.score);
}

export async function popDue(key: string, now = Date.now()): Promise<string | null> {
  if (redis) {
    const res = await redis.zrangebyscore(key, "-inf", now.toString(), "LIMIT", 0, 1);
    if (res.length === 0) return null;
    const val = res[0];
    await redis.zrem(key, val);
    return val;
  }
  const idx = inMemoryQueue.findIndex((q) => q.score <= now);
  if (idx === -1) return null;
  const v = inMemoryQueue.splice(idx, 1)[0];
  return v.value;
}

export async function peekCount(key: string) {
  if (redis) return redis.zcard(key);
  return inMemoryQueue.length;
}
