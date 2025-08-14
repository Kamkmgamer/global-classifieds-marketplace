import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = new Date();
  return [
    {
      url: site,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
