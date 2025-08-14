import { NextResponse } from "next/server";
import { z } from "zod";

type ApiListing = {
  id: string;
  title: string;
  price: number;
  image: string;
  location?: string;
  description?: string;
};

const MOCK: ApiListing[] = Array.from({ length: 24 }).map((_, i) => ({
  id: String(i + 1),
  title: [
    "iPhone 14 Pro",
    "Mountain Bike",
    "Gaming Laptop",
    "Desk Chair",
    "Coffee Table",
    "Headphones",
    "Camera Lens",
  ][i % 7] + ` #${i + 1}`,
  price: Math.round(50 + Math.random() * 1950),
  image: `/placeholder-${(i % 3) + 1}.svg`,
  location: ["NYC", "Berlin", "Tokyo", "SF", "London"][i % 5],
}));

const QuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  sort: z
    .enum(["price_asc", "price_desc"]) // future: add created_at
    .optional()
    .or(z.literal("").optional()),
  page: z
    .string()
    .transform((v) => Number.parseInt(v || "1", 10))
    .pipe(z.number().int().min(1).catch(1))
    .optional(),
  pageSize: z
    .string()
    .transform((v) => Number.parseInt(v || "12", 10))
    .pipe(z.number().int().min(1).max(50).catch(12))
    .optional(),
  minPrice: z
    .string()
    .optional()
    .transform((v) => (v == null || v === "" ? undefined : Number.parseInt(v, 10)))
    .pipe(z.number().int().min(0).optional())
    .optional(),
  maxPrice: z
    .string()
    .optional()
    .transform((v) => (v == null || v === "" ? undefined : Number.parseInt(v, 10)))
    .pipe(z.number().int().min(0).optional())
    .optional(),
  location: z.string().trim().max(100).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = Object.fromEntries(searchParams.entries());
    const parsed = QuerySchema.parse(raw);

    const q = (parsed.q || "").toLowerCase();
    const page = parsed.page ?? 1;
    const pageSize = parsed.pageSize ?? 12;
    const sort = (parsed.sort || "").toLowerCase();
    const minPrice = parsed.minPrice;
    const maxPrice = parsed.maxPrice;
    const location = parsed.location?.toLowerCase();

    let filtered = q
      ? MOCK.filter(
          (x) => x.title.toLowerCase().includes(q) || x.location?.toLowerCase().includes(q)
        )
      : MOCK.slice();

    if (typeof minPrice === "number") {
      filtered = filtered.filter((x) => x.price >= minPrice);
    }
    if (typeof maxPrice === "number") {
      filtered = filtered.filter((x) => x.price <= maxPrice);
    }
    if (location) {
      filtered = filtered.filter((x) => x.location?.toLowerCase() === location);
    }

    if (sort === "price_asc") filtered.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") filtered.sort((a, b) => b.price - a.price);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return NextResponse.json(
      {
        items,
        meta: {
          total,
          page: currentPage,
          pageSize,
          totalPages,
        },
      },
      {
        headers: {
          // Cache mock data briefly and allow SWR
          "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", issues: err.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

const CreateListingSchema = z.object({
  title: z.string().trim().min(3).max(120),
  price: z.number().int().min(0).max(1_000_000),
  image: z.string().url().optional(),
  location: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().min(0).max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = CreateListingSchema.parse(json);

    const id = String(MOCK.length + 1);
    const record: ApiListing = {
      id,
      title: payload.title,
      price: payload.price,
      image: payload.image || "/placeholder-1.svg",
      location: payload.location || "",
      description: payload.description || "",
    };
    MOCK.unshift(record);

    return NextResponse.json(
      { item: record },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid payload", issues: err.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
