"use client";

import SearchBar from "@/components/SearchBar";
import ListingCard, { Listing } from "@/components/ListingCard";
import SortControls from "@/components/SortControls";
import Link from "next/link";
import FiltersBar from "@/components/FiltersBar";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import SkeletonCard from "@/components/SkeletonCard"; // Import SkeletonCard

type ListingsResponse = {
  items: Listing[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

async function getListings(searchParams: URLSearchParams): Promise<ListingsResponse> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/listings?${searchParams.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load listings");
  const data = await res.json();

  const limit = Number.parseInt(searchParams.get("limit") || "12", 10);
  const page = Number.parseInt(searchParams.get("page") || "1", 10);
  const total = data.total;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    items: data.listings,
    meta: {
      total,
      page,
      pageSize: limit,
      totalPages,
    },
  };
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
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Browse Listings</h1>
          <p className="text-sm text-muted-foreground">Loading listings...</p>
        </div>
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="h-10 w-full rounded-md bg-muted sm:w-64" />
            <div className="h-10 w-full rounded-md bg-muted sm:w-48" />
          </div>
          <div className="h-10 w-full rounded-md bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
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
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-12 w-12 text-muted-foreground"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" x2="8" y1="13" y2="13"></line>
            <line x1="16" x2="8" y1="17" y2="17"></line>
            <line x1="10" x2="8" y1="9" y2="9"></line>
          </svg>
          <h3 className="mt-4 text-xl font-semibold">No listings found</h3>
          <p className="mt-2 text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
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
