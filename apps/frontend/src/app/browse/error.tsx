"use client";

import * as React from "react";
import Link from "next/link";

export default function BrowseError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    // TODO: wire to observability provider (Sentry, OpenTelemetry) in prod
    console.error("Browse page error:", error);
  }, [error]);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">We couldn’t load listings right now. Please try again.</p>
      {error?.digest && (
        <p className="mt-2 text-xs text-muted-foreground">Error ID: {error.digest}</p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-[rgb(var(--primary)/0.9)]"
        >
          Retry
        </button>
        <Link
          href="/"
          className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm hover:bg-muted"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
