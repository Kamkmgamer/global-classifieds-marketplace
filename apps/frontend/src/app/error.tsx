"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Ideally hook into your error reporting service here.
    console.error("App Error:", error);
  }, [error]);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-20 text-center">
      <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl">⚠️</div>
      <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">An unexpected error occurred. You can try again.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-[rgb(var(--primary)/0.9)]"
        >
          Try again
        </button>
        <Link href="/" className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
          Go home
        </Link>
      </div>
    </div>
  );
}
