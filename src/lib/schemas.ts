import { z } from 'zod';

// Listing domain model
export const ListingSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  image: z.string().url().or(z.string()),
  location: z.string().optional(),
});

export type Listing = z.infer<typeof ListingSchema>;

export const ListingsResponseSchema = z.object({
  listings: z.array(ListingSchema),
});

export type ListingsResponse = z.infer<typeof ListingsResponseSchema>;

// Browse listings response includes total count
export const BrowseListingsResponseSchema = z.object({
  listings: z.array(ListingSchema),
  total: z.number().nonnegative(),
});

export type BrowseListingsResponse = z.infer<typeof BrowseListingsResponseSchema>;

// Helpers for pagination params parsing (from URLSearchParams)
export function parsePage(input: string | null | undefined, fallback = 1) {
  const n = Number.parseInt(String(input ?? fallback), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function parsePageSize(input: string | null | undefined, fallback = 12) {
  const n = Number.parseInt(String(input ?? fallback), 10);
  // clamp to reasonable bounds
  const clamped = Math.min(100, Math.max(1, Number.isFinite(n) ? n : fallback));
  return clamped;
}
