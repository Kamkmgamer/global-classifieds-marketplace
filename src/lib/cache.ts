import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis Client Error', err);
    });
    
    await redisClient.connect();
  }
  return redisClient;
}

// Simple cache interface compatible with cache-manager
export interface Cache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

class RedisCache implements Cache {
  constructor(private client: ReturnType<typeof createClient>) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : undefined;
    } catch {
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Cache del error:', error);
    }
  }
}

let cacheInstance: Cache | null = null;

export async function getCache(): Promise<Cache> {
  if (!cacheInstance) {
    try {
      const client = await getRedisClient();
      cacheInstance = new RedisCache(client);
    } catch (error) {
      console.error('Failed to initialize Redis cache, using memory fallback', error);
      // Fallback to simple in-memory cache
      cacheInstance = createMemoryCache();
    }
  }
  return cacheInstance;
}

// Simple in-memory cache fallback
function createMemoryCache(): Cache {
  const store = new Map<string, { value: any; expiresAt?: number }>();

  // Cleanup expired entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        store.delete(key);
      }
    }
  }, 60000); // Cleanup every minute

  return {
    async get<T>(key: string): Promise<T | undefined> {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        store.delete(key);
        return undefined;
      }
      return entry.value as T;
    },
    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
      const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
      store.set(key, { value, expiresAt });
    },
    async del(key: string): Promise<void> {
      store.delete(key);
    },
  };
}

