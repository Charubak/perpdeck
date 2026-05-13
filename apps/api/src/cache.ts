import Redis from 'ioredis';

const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
const TTL_SECONDS = 5;

let client: Redis | null = null;

function getClient(): Redis {
  if (!client) {
    client = new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
    client.on('error', (err: Error) => {
      console.warn('Redis error (cache disabled):', err.message);
    });
  }
  return client;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await getClient().get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = TTL_SECONDS): Promise<void> {
  try {
    await getClient().set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // non-fatal: degrade gracefully without cache
  }
}

export function portfolioCacheKey(address: string): string {
  return `portfolio:${address.toLowerCase()}`;
}
