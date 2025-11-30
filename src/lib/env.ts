import { z } from 'zod';

// Normalize URL by trimming trailing slashes
const normalizeUrl = (v: string) => v.replace(/\/$/, '');

const EnvSchema = z
  .object({
    NEXT_PUBLIC_BACKEND_URL: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v && v.length > 0 ? normalizeUrl(v) : undefined))
      .pipe(z.string().url().optional()),
    NEXT_PUBLIC_SITE_URL: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v && v.length > 0 ? normalizeUrl(v) : undefined))
      .pipe(z.string().url().optional()),
  })
  .transform((cfg) => {
    // Provide safe default for SITE_URL when not provided (dev)
    const defaultSite = 'http://localhost:3000';
    return {
      NEXT_PUBLIC_BACKEND_URL: cfg.NEXT_PUBLIC_BACKEND_URL,
      NEXT_PUBLIC_SITE_URL: cfg.NEXT_PUBLIC_SITE_URL ?? defaultSite,
    } as const;
  });

export type Env = z.infer<typeof EnvSchema>;

// Build once at module init for stability
export const env: Env = EnvSchema.parse({
  NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  NEXT_PUBLIC_SITE_URL:
    process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL?.startsWith('http')
      ? (process.env.NEXT_PUBLIC_SITE_URL as string)
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : undefined,
});
