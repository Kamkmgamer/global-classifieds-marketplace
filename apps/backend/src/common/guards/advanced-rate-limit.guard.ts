import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Cache } from '@nestjs/cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Request } from 'express';
import { rateLimitBlockTotal } from '../../observability/metrics';

export interface TokenBucketConfig {
  capacity: number; // Maximum tokens in bucket
  refillRate: number; // Tokens added per second
  windowMs: number; // Time window in milliseconds
  keyGenerator?: (req: Request) => string;
  skipIf?: (req: Request) => boolean;
  message?: string;
}

export const RATE_LIMIT_CONFIG = 'rate-limit-config';

export const RateLimit = (config: TokenBucketConfig) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(RATE_LIMIT_CONFIG, config, descriptor.value);
    } else {
      Reflect.defineMetadata(RATE_LIMIT_CONFIG, config, target);
    }
  };
};

@Injectable()
export class AdvancedRateLimitGuard implements CanActivate {
  private readonly luaScript = `
    local key = KEYS[1]
    local capacity = tonumber(ARGV[1])
    local refill_rate = tonumber(ARGV[2])
    local window_ms = tonumber(ARGV[3])
    local requested_tokens = tonumber(ARGV[4])
    local current_time = tonumber(ARGV[5])
    
    -- Get current bucket state
    local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
    local tokens = tonumber(bucket[1]) or capacity
    local last_refill = tonumber(bucket[2]) or current_time
    
    -- Calculate tokens to add based on time elapsed
    local time_elapsed = math.max(0, current_time - last_refill)
    local tokens_to_add = math.floor((time_elapsed / 1000) * refill_rate)
    tokens = math.min(capacity, tokens + tokens_to_add)
    
    -- Check if we have enough tokens
    if tokens >= requested_tokens then
      tokens = tokens - requested_tokens
      -- Update bucket state
      redis.call('HMSET', key, 'tokens', tokens, 'last_refill', current_time)
      redis.call('EXPIRE', key, math.ceil(window_ms / 1000))
      return {1, tokens, capacity}
    else
      -- Update last_refill time even if request is denied
      redis.call('HMSET', key, 'tokens', tokens, 'last_refill', current_time)
      redis.call('EXPIRE', key, math.ceil(window_ms / 1000))
      return {0, tokens, capacity}
    end
  `;

  constructor(
    private reflector: Reflector,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.get<TokenBucketConfig>(
      RATE_LIMIT_CONFIG,
      context.getHandler(),
    ) || this.reflector.get<TokenBucketConfig>(
      RATE_LIMIT_CONFIG,
      context.getClass(),
    );

    if (!config) {
      return true; // No rate limiting configured
    }

    const request = context.switchToHttp().getRequest<Request>();

    // Skip if condition is met
    if (config.skipIf && config.skipIf(request)) {
      return true;
    }

    const key = this.generateKey(request, config);
    const allowed = await this.checkRateLimit(key, config);

    if (!allowed) {
      try {
        rateLimitBlockTotal.inc({ route: request.route?.path || 'unknown' });
      } catch {
        // Metrics should never break the flow
      }

      throw new HttpException(
        config.message || 'Rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private generateKey(request: Request, config: TokenBucketConfig): string {
    if (config.keyGenerator) {
      return `rate_limit:${config.keyGenerator(request)}`;
    }

    // Default key generation based on IP and route
    const ip = this.getClientIp(request);
    const route = request.route?.path || request.path;
    return `rate_limit:${ip}:${route}`;
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (request.headers['x-real-ip'] as string) ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }

  private async checkRateLimit(key: string, config: TokenBucketConfig): Promise<boolean> {
    try {
      // Check if Redis client supports Lua scripts
      const redisClient = (this.cache as any).store?.client;
      
      if (redisClient && typeof redisClient.eval === 'function') {
        // Use Redis Lua script for atomic token bucket operation
        const result = await redisClient.eval(
          this.luaScript,
          1,
          key,
          config.capacity.toString(),
          config.refillRate.toString(),
          config.windowMs.toString(),
          '1', // requested tokens
          Date.now().toString(),
        );

        return result[0] === 1;
      } else {
        // Fallback to cache-based implementation (less precise but works with any cache)
        return this.fallbackRateLimit(key, config);
      }
    } catch (error) {
      console.error('Rate limiting error:', error);
      // On error, allow the request to prevent blocking legitimate traffic
      return true;
    }
  }

  private async fallbackRateLimit(key: string, config: TokenBucketConfig): Promise<boolean> {
    const bucketKey = `${key}:bucket`;
    const bucket = await this.cache.get<{ tokens: number; lastRefill: number }>(bucketKey);
    
    const now = Date.now();
    const currentTokens = bucket?.tokens ?? config.capacity;
    const lastRefill = bucket?.lastRefill ?? now;
    
    // Calculate tokens to add
    const timeElapsed = Math.max(0, now - lastRefill);
    const tokensToAdd = Math.floor((timeElapsed / 1000) * config.refillRate);
    const newTokens = Math.min(config.capacity, currentTokens + tokensToAdd);
    
    if (newTokens >= 1) {
      // Allow request and consume token
      await this.cache.set(
        bucketKey,
        { tokens: newTokens - 1, lastRefill: now },
        Math.ceil(config.windowMs / 1000),
      );
      return true;
    } else {
      // Deny request but update last refill time
      await this.cache.set(
        bucketKey,
        { tokens: newTokens, lastRefill: now },
        Math.ceil(config.windowMs / 1000),
      );
      return false;
    }
  }
}
