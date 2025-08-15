"use client";

import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    if (value) usp.set(key, value);
    else usp.delete(key);
    // Reset to page 1 when changing sort or pageSize
    usp.set("page", "1");
    router.push(`/browse?${usp.toString()}`);
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-muted-foreground">Sort</label>
        <Select value={sort} onValueChange={(value) => onChange("sort", value)}>
          <SelectTrigger className="h-10 w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-4 h-4 w-px bg-border" />
        <label className="text-sm text-muted-foreground">Per page</label>
        <Select
          value={pageSize}
          onValueChange={(value) => onChange("pageSize", value)}
        >
          <SelectTrigger className="h-10 w-[100px]">
            <SelectValue placeholder="Per page" />
          </SelectTrigger>
          <SelectContent>
            {[12, 24, 36, 48].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
