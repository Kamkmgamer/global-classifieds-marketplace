"use client";

import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

const SORT_OPTIONS = [
  { value: "", label: "Relevance" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export default function SortControls({ className }: { className?: string }) {
  const router = useRouter();
  const params = useSearchParams();

  const sort = params.get("sort") || "";
  const pageSize = params.get("pageSize") || "12";

  const onChange = (key: "sort" | "pageSize", value: string) => {
    const usp = new URLSearchParams(Array.from(params.entries()));
    if (value) usp.set(key, value); else usp.delete(key);
    // Reset to page 1 when changing sort or pageSize
    usp.set("page", "1");
    router.push(`/browse?${usp.toString()}`);
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-muted-foreground">Sort</label>
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={sort}
          onChange={(e) => onChange("sort", e.target.value)}
          aria-label="Sort listings"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="ml-4 h-4 w-px bg-border" />
        <label className="text-sm text-muted-foreground">Per page</label>
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={pageSize}
          onChange={(e) => onChange("pageSize", e.target.value)}
          aria-label="Results per page"
        >
          {[12, 24, 36, 48].map((n) => (
            <option key={n} value={String(n)}>{n}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
