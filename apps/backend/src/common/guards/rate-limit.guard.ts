import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Cache } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { rateLimitBlockTotal } from '../../observability/metrics';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly windowMs: number;
  private readonly max: number;
  private readonly authWindowMs: number;
  private readonly authMax: number;

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {
    // Global defaults: 120 reqs/min. Configure via env RATE_LIMIT_MAX and RATE_LIMIT_WINDOW_MS.
    this.windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
    this.max = Number(process.env.RATE_LIMIT_MAX || 120);
    // Auth-specific stricter defaults: 10 reqs/min. Override via RATE_LIMIT_AUTH_MAX and RATE_LIMIT_AUTH_WINDOW_MS.
    this.authWindowMs = Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS || 60_000);
    this.authMax = Number(process.env.RATE_LIMIT_AUTH_MAX || 10);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    // Skip certain paths
    const path: string = req.path || req.url || '';
    if (path.startsWith('/docs') || path.startsWith('/health') || path.startsWith('/metrics')) return true;

    // Identify client
    const ip =
      req.ip ||
      (req.headers['x-forwarded-for']?.toString().split(',')[0].trim()) ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    // Determine route-specific limits
    const isAuthRoute = path.startsWith('/auth/login') || path.startsWith('/auth/register');
    const limitWindowMs = isAuthRoute ? this.authWindowMs : this.windowMs;
    const limitMax = isAuthRoute ? this.authMax : this.max;

    const bucket = Math.floor(Date.now() / limitWindowMs); // fixed window per route bucket
    const key = `rl:${isAuthRoute ? 'auth' : 'global'}:${ip}:${bucket}`;

    // cache-manager API can vary by store; we use get/set with TTL in seconds
    const current = (await this.cache.get<number>(key)) || 0;

    if (current >= limitMax) {
      const resetAt = (bucket + 1) * limitWindowMs;
      res.setHeader('Retry-After', Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)).toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', resetAt.toString());
      // Increment Prometheus counter for rate limit blocks
      try { rateLimitBlockTotal.inc({ route: path }); } catch {
        // no-op: metric increments should not fail requests
      }
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    const nextVal = current + 1;
    const ttlSeconds = Math.ceil((limitWindowMs - (Date.now() % limitWindowMs)) / 1000);
    await this.cache.set(key, nextVal, ttlSeconds);

    const resetAt = (bucket + 1) * limitWindowMs;
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limitMax - nextVal).toString());
    res.setHeader('X-RateLimit-Reset', resetAt.toString());

    return true;
  }
}

