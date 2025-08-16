"use client";

import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="p-6 text-sm text-red-900 bg-red-50 border border-red-200 rounded-md">
      <h2 className="text-base font-semibold">Something went wrong on the About page.</h2>
      <p className="mt-2 opacity-80">{error.message || "Unexpected error"}</p>
      <div className="mt-4 flex gap-2">
        <button onClick={() => reset()} className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700">
          Try again
        </button>
        <Link href="/" className="px-3 py-1.5 rounded border border-red-300 hover:bg-red-100">Go home</Link>
      </div>
    </div>
  );
}
