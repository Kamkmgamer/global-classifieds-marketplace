"use client";

import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = React.useState<string>(params.get("q") || "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const usp = new URLSearchParams(Array.from(params.entries()));
    if (q) usp.set("q", q); else usp.delete("q");
    // Reset pagination on new searches
    usp.set("page", "1");
    router.push(`/browse?${usp.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className={className} role="search">
      <div className="flex gap-2">
        <Input
          className="h-12 rounded-lg shadow-sm-soft focus:shadow-md-soft"
          placeholder="Search listings…"
          value={q}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
          aria-label="Search listings"
        />
        <Button className="h-12 px-6">Search</Button>
      </div>
    </form>
  );
}
