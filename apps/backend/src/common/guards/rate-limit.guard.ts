import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Cache } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly windowMs: number;
  private readonly max: number;

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {
    // Default: 120 reqs/min. Configure via env RATE_LIMIT_MAX and RATE_LIMIT_WINDOW_MS.
    this.windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
    this.max = Number(process.env.RATE_LIMIT_MAX || 120);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    // Skip certain paths
    const path: string = req.path || req.url || '';
    if (path.startsWith('/docs') || path.startsWith('/health')) return true;

    // Identify client
    const ip =
      req.ip ||
      (req.headers['x-forwarded-for']?.toString().split(',')[0].trim()) ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const bucket = Math.floor(Date.now() / this.windowMs); // fixed window
    const key = `rl:${ip}:${bucket}`;

    // cache-manager API can vary by store; we use get/set with TTL in seconds
    const current = (await this.cache.get<number>(key)) || 0;

    if (current >= this.max) {
      const resetAt = (bucket + 1) * this.windowMs;
      res.setHeader('Retry-After', Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)).toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', resetAt.toString());
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    const nextVal = current + 1;
    const ttlSeconds = Math.ceil((this.windowMs - (Date.now() % this.windowMs)) / 1000);
    await this.cache.set(key, nextVal, ttlSeconds);

    const resetAt = (bucket + 1) * this.windowMs;
    res.setHeader('X-RateLimit-Remaining', Math.max(0, this.max - nextVal).toString());
    res.setHeader('X-RateLimit-Reset', resetAt.toString());

    return true;
  }
}
