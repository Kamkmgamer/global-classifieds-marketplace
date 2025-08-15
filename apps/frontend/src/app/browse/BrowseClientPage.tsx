"use client";

import SearchBar from "@/components/SearchBar";
import ListingCard, { Listing } from "@/components/ListingCard";
import SortControls from "@/components/SortControls";
import Link from "next/link";
import FiltersBar from "@/components/FiltersBar";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type ListingsResponse = {
  items: Listing[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

async function getListings(searchParams: URLSearchParams): Promise<ListingsResponse> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/listings?${searchParams.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load listings");
  const data = await res.json();
  return data as ListingsResponse;
}

export default function BrowseClientPage() {
  const searchParams = useSearchParams();
  const [listingsData, setListingsData] = useState<ListingsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListingsData = async () => {
      try {
        const data = await getListings(searchParams);
        setListingsData(data);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchListingsData();
  }, [searchParams]);

  if (error) {
    return <div className="container mx-auto max-w-7xl px-4 py-8 text-red-500">Error: {error}</div>;
  }

  if (!listingsData) {
    return <div className="container mx-auto max-w-7xl px-4 py-8">Loading...</div>;
  }

  const { items, meta } = listingsData;

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
        <PaginationControls meta={meta} q={searchParams.get("q") || undefined} sort={searchParams.get("sort") || undefined} minPrice={searchParams.get("minPrice") ? Number.parseInt(searchParams.get("minPrice")!, 10) : undefined} maxPrice={searchParams.get("maxPrice") ? Number.parseInt(searchParams.get("maxPrice")!, 10) : undefined} location={searchParams.get("location") || undefined} />
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
