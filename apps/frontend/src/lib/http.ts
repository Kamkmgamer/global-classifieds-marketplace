import { z } from 'zod';
import { env } from '@/lib/env';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpOptions<TSchema extends z.ZodTypeAny | undefined = undefined> = {
  method?: HttpMethod;
  headers?: HeadersInit;
  body?: unknown;
  // Next.js fetch options
  cache?: RequestCache;
  next?: { revalidate?: number };
  // Validation
  schema?: TSchema;
  // Retries
  retries?: number; // default 2
  retryDelayMs?: number; // default 300
  // Timeout
  timeoutMs?: number; // default 8000
};

function withBase(url: string): string {
  // If already absolute, do nothing
  if (/^https?:/i.test(url)) return url;

  // On the client, always proxy through Next.js to avoid exposing backend hostnames
  if (typeof window !== 'undefined') {
    const slash = url.startsWith('/') ? '' : '/';
    // Ensure we only prefix once
    return url.startsWith('/api/') || url === '/api' ? url : `/api${slash}${url}`;
  }

  // On the server (Edge/Node), call the backend directly if configured
  const base = env.NEXT_PUBLIC_BACKEND_URL;
  if (!base) return url; // allow relative usage in dev if no backend configured
  const slash = url.startsWith('/') ? '' : '/';
  return `${base}${slash}${url}`;
}

async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function http<
  TSchema extends z.ZodTypeAny | undefined = undefined,
  TParsed = TSchema extends z.ZodTypeAny ? z.infer<TSchema> : unknown,
>(url: string, opts: HttpOptions<TSchema> = {}): Promise<TParsed> {
  const {
    method = 'GET',
    headers,
    body,
    cache,
    next,
    schema,
    retries = 2,
    retryDelayMs = 300,
    timeoutMs = 8000,
  } = opts;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const finalHeaders: HeadersInit = {
    'Content-Type': body ? 'application/json' : 'application/json',
    ...headers,
  };

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      const res = await fetch(withBase(url), {
        method,
        headers: finalHeaders,
        body: body ? JSON.stringify(body as unknown as Record<string, unknown>) : undefined,
        cache,
        next,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        // Retry on 429/5xx
        if ((res.status === 429 || res.status >= 500) && attempt < retries) {
          attempt++;
          const delay = retryDelayMs * Math.pow(2, attempt - 1);
          await sleep(delay);
          continue;
        }
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
      }

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : await res.text();

      if (schema) {
        const parsed = schema.parse(data) as TParsed;
        return parsed;
      }

      return data as TParsed;
    } catch (err) {
      lastError = err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Timeout: retry if attempts remain
        if (attempt < retries) {
          attempt++;
          const delay = retryDelayMs * Math.pow(2, attempt - 1);
          await sleep(delay);
          continue;
        }
        break;
      }
      // Network error retry
      if (attempt < retries) {
        attempt++;
        const delay = retryDelayMs * Math.pow(2, attempt - 1);
        await sleep(delay);
        continue;
      }
      break;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('HTTP request failed');
}

export const api = {
  get: <
    TSchema extends z.ZodTypeAny | undefined = undefined,
    TParsed = TSchema extends z.ZodTypeAny ? z.infer<TSchema> : unknown,
  >(
    url: string,
    opts: Omit<HttpOptions<TSchema>, 'method'> = {},
  ) => http<TSchema, TParsed>(url, { ...opts, method: 'GET' }),
  post: <
    TSchema extends z.ZodTypeAny | undefined = undefined,
    TParsed = TSchema extends z.ZodTypeAny ? z.infer<TSchema> : unknown,
  >(
    url: string,
    body?: unknown,
    opts: Omit<HttpOptions<TSchema>, 'method' | 'body'> = {},
  ) => http<TSchema, TParsed>(url, { ...opts, method: 'POST', body }),
  put: <
    TSchema extends z.ZodTypeAny | undefined = undefined,
    TParsed = TSchema extends z.ZodTypeAny ? z.infer<TSchema> : unknown,
  >(
    url: string,
    body?: unknown,
    opts: Omit<HttpOptions<TSchema>, 'method' | 'body'> = {},
  ) => http<TSchema, TParsed>(url, { ...opts, method: 'PUT', body }),
  patch: <
    TSchema extends z.ZodTypeAny | undefined = undefined,
    TParsed = TSchema extends z.ZodTypeAny ? z.infer<TSchema> : unknown,
  >(
    url: string,
    body?: unknown,
    opts: Omit<HttpOptions<TSchema>, 'method' | 'body'> = {},
  ) => http<TSchema, TParsed>(url, { ...opts, method: 'PATCH', body }),
  delete: <
    TSchema extends z.ZodTypeAny | undefined = undefined,
    TParsed = TSchema extends z.ZodTypeAny ? z.infer<TSchema> : unknown,
  >(
    url: string,
    opts: Omit<HttpOptions<TSchema>, 'method'> = {},
  ) => http<TSchema, TParsed>(url, { ...opts, method: 'DELETE' }),
};
