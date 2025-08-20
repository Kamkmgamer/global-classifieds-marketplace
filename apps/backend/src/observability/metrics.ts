import client from 'prom-client';
import type { Request, Response } from 'express';

// Create a global registry and default metrics
export const register = new client.Registry();
client.collectDefaultMetrics({ register });

// HTTP request duration histogram
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});
register.registerMetric(httpRequestDuration);

// HTTP requests total
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'] as const,
});
register.registerMetric(httpRequestsTotal);

// HTTP errors total
export const httpErrorsTotal = new client.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'status'] as const,
});
register.registerMetric(httpErrorsTotal);

// Rate limit blocks
export const rateLimitBlockTotal = new client.Counter({
  name: 'rate_limit_block_total',
  help: 'Total number of requests blocked by rate limiter',
  labelNames: ['route'] as const,
});
register.registerMetric(rateLimitBlockTotal);

// Cache metrics (optional usage in future)
export const cacheHitTotal = new client.Counter({
  name: 'cache_hit_total',
  help: 'Total cache hits',
  labelNames: ['source'] as const,
});
register.registerMetric(cacheHitTotal);

export const cacheMissTotal = new client.Counter({
  name: 'cache_miss_total',
  help: 'Total cache misses',
  labelNames: ['source'] as const,
});
register.registerMetric(cacheMissTotal);

// Express handler for /metrics
export async function metricsHandler(_req: Request, res: Response) {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}
