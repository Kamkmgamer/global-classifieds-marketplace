import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const site = env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${site}/sitemap.xml`,
  };
}
