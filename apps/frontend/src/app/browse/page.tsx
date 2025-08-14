import SearchBar from "@/components/SearchBar";
import ListingCard, { Listing } from "@/components/ListingCard";
import SortControls from "@/components/SortControls";
import Link from "next/link";
import FiltersBar from "@/components/FiltersBar";

type ListingsResponse = {
  items: Listing[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

async function getListings(params: {
  q?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
}): Promise<ListingsResponse> {
  const usp = new URLSearchParams();
  if (params.q) usp.set("q", params.q);
  if (params.sort) usp.set("sort", params.sort);
  if (params.page) usp.set("page", String(params.page));
  if (params.pageSize) usp.set("pageSize", String(params.pageSize));
  if (typeof params.minPrice === "number") usp.set("minPrice", String(params.minPrice));
  if (typeof params.maxPrice === "number") usp.set("maxPrice", String(params.maxPrice));
  if (params.location) usp.set("location", params.location);
  const url = `/api/listings${usp.toString() ? `?${usp.toString()}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load listings");
  const data = await res.json();
  return data as ListingsResponse;
}

export default async function BrowsePage({ searchParams }: { searchParams?: { q?: string | string[]; sort?: string | string[]; page?: string | string[]; pageSize?: string | string[]; minPrice?: string | string[]; maxPrice?: string | string[]; location?: string | string[] } }) {
  const sp = searchParams || {};
  const qParam = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const sortParam = Array.isArray(sp.sort) ? sp.sort[0] : sp.sort;
  const pageParam = Number.parseInt(Array.isArray(sp.page) ? sp.page[0] || "1" : sp.page || "1", 10) || 1;
  const pageSizeParam = Number.parseInt(Array.isArray(sp.pageSize) ? sp.pageSize[0] || "12" : sp.pageSize || "12", 10) || 12;
  const minPriceParam = (() => {
    const v = Array.isArray(sp.minPrice) ? sp.minPrice[0] : sp.minPrice; return v ? Number.parseInt(v, 10) : undefined;
  })();
  const maxPriceParam = (() => {
    const v = Array.isArray(sp.maxPrice) ? sp.maxPrice[0] : sp.maxPrice; return v ? Number.parseInt(v, 10) : undefined;
  })();
  const locationParam = Array.isArray(sp.location) ? sp.location[0] : sp.location;

  const { items, meta } = await getListings({ q: qParam, sort: sortParam, page: pageParam, pageSize: pageSizeParam, minPrice: minPriceParam, maxPrice: maxPriceParam, location: locationParam });
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Browse Listings</h1>
        <p className="text-sm text-muted-foreground">Find great deals from around the world.</p>
        <div className="mt-2 text-xs text-muted-foreground">{meta.total.toLocaleString()} results</div>
      </div>
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar className="" />
          <SortControls />
        </div>
        <FiltersBar />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <PaginationControls meta={meta} q={qParam} sort={sortParam} minPrice={minPriceParam} maxPrice={maxPriceParam} location={locationParam} />
      </div>
    </div>
  );
}

function PaginationControls({ meta, q, sort, minPrice, maxPrice, location }: { meta: { total: number; page: number; pageSize: number; totalPages: number }; q?: string; sort?: string; minPrice?: number; maxPrice?: number; location?: string }) {
  const { page, totalPages } = meta;
  const buildHref = (targetPage: number) => {
    const usp = new URLSearchParams();
    if (q) usp.set("q", q);
    if (sort) usp.set("sort", sort);
    if (typeof minPrice === "number") usp.set("minPrice", String(minPrice));
    if (typeof maxPrice === "number") usp.set("maxPrice", String(maxPrice));
    if (location) usp.set("location", location);
    usp.set("page", String(targetPage));
    usp.set("pageSize", String(meta.pageSize));
    return `/browse?${usp.toString()}`;
  };
  return (
    <div className="flex w-full items-center justify-between gap-4">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={`rounded-md border px-3 py-2 text-sm ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-accent"}`}
      >
        Prev
      </Link>
      <div className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </div>
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={`rounded-md border px-3 py-2 text-sm ${page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-accent"}`}
      >
        Next
      </Link>
    </div>
  );
}
