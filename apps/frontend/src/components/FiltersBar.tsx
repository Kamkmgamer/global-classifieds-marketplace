"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LOCATIONS = ["NYC", "Berlin", "Tokyo", "SF", "London"];

type Filters = {
  minPrice?: string;
  maxPrice?: string;
  location?: string;
};

export default function FiltersBar({ className }: { className?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [filters, setFilters] = React.useState<Filters>({
    minPrice: params.get("minPrice") || "",
    maxPrice: params.get("maxPrice") || "",
    location: params.get("location") || "",
  });

  function set<K extends keyof Filters>(key: K, val: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: val }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const usp = new URLSearchParams(Array.from(params.entries()));

    const { minPrice, maxPrice, location } = filters;

    if (minPrice) usp.set("minPrice", minPrice);
    else usp.delete("minPrice");
    if (maxPrice) usp.set("maxPrice", maxPrice);
    else usp.delete("maxPrice");
    if (location) usp.set("location", location);
    else usp.delete("location");

    // Reset pagination when filters change
    usp.set("page", "1");

    router.push(`/browse?${usp.toString()}`);
  }

  function onClear() {
    const usp = new URLSearchParams(Array.from(params.entries()));
    ["minPrice", "maxPrice", "location", "page"].forEach((k) => usp.delete(k));
    router.push(`/browse?${usp.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`flex flex-wrap items-end gap-2 ${className || ""}`}
    >
      <div className="flex flex-col">
        <label htmlFor="minPrice" className="text-xs text-muted-foreground">
          Min Price
        </label>
        <Input
          id="minPrice"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="0"
          value={filters.minPrice}
          onChange={(e) => set("minPrice", e.target.value.replace(/[^0-9]/g, ""))}
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="maxPrice" className="text-xs text-muted-foreground">
          Max Price
        </label>
        <Input
          id="maxPrice"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="2000"
          value={filters.maxPrice}
          onChange={(e) => set("maxPrice", e.target.value.replace(/[^0-9]/g, ""))}
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="location" className="text-xs text-muted-foreground">
          Location
        </label>
        <Select
          value={filters.location}
          onValueChange={(value) => set("location", value)}
        >
          <SelectTrigger className="h-10 w-[180px]">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any</SelectItem>
            {LOCATIONS.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button className="h-12 px-5">Apply</Button>
        <Button type="button" variant="outline" onClick={onClear} className="h-12 px-5">
          Clear
        </Button>
      </div>
    </form>
  );
}
