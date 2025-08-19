import { RateLimitGuard } from './rate-limit.guard';
import { ExecutionContext, HttpException } from '@nestjs/common';

const cacheMock = () => ({
  get: jest.fn(),
  set: jest.fn(),
});

function makeContext(path: string, ip = '1.2.3.4') {
  const headers: Record<string, string> = {};
  const resHeaders: Record<string, string> = {};
  return {
    switchToHttp: () => ({
      getRequest: () => ({ path, url: path, ip, headers, socket: { remoteAddress: ip } }),
      getResponse: () => ({
        setHeader: (k: string, v: string) => {
          resHeaders[k] = v;
        },
        _headers: resHeaders,
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('RateLimitGuard', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.RATE_LIMIT_MAX;
    delete process.env.RATE_LIMIT_WINDOW_MS;
    delete process.env.RATE_LIMIT_AUTH_MAX;
    delete process.env.RATE_LIMIT_AUTH_WINDOW_MS;
  });

  it('allows request under global limit and sets headers', async () => {
    const cache = cacheMock();
    (cache.get as jest.Mock).mockResolvedValue(0);

    const guard = new RateLimitGuard(cache as any);
    const ctx = makeContext('/api/listings');

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(cache.set).toHaveBeenCalled();
    const res = (ctx.switchToHttp() as any).getResponse();
    expect(res._headers['X-RateLimit-Remaining']).toBeDefined();
    expect(res._headers['X-RateLimit-Reset']).toBeDefined();
  });

  it('throws when exceeding global limit', async () => {
    const cache = cacheMock();
    (cache.get as jest.Mock).mockResolvedValue(120); // default max

    const guard = new RateLimitGuard(cache as any);
    const ctx = makeContext('/api/listings');

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(HttpException);
    const res = (ctx.switchToHttp() as any).getResponse();
    expect(res._headers['Retry-After']).toBeDefined();
    expect(res._headers['X-RateLimit-Remaining']).toBe('0');
  });

  it('applies stricter auth limits for /auth/login', async () => {
    const cache = cacheMock();
    (cache.get as jest.Mock).mockResolvedValue(10); // default authMax = 10

    const guard = new RateLimitGuard(cache as any);
    const ctx = makeContext('/auth/login');

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(HttpException);
    const res = (ctx.switchToHttp() as any).getResponse();
    expect(res._headers['Retry-After']).toBeDefined();
    expect(res._headers['X-RateLimit-Remaining']).toBe('0');
  });

  it('uses env overrides for auth limits', async () => {
    process.env.RATE_LIMIT_AUTH_MAX = '3';
    process.env.RATE_LIMIT_AUTH_WINDOW_MS = '10000';

    const cache = cacheMock();
    (cache.get as jest.Mock).mockResolvedValue(3);

    const guard = new RateLimitGuard(cache as any);
    const ctx = makeContext('/auth/register');

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(HttpException);
  });
});
