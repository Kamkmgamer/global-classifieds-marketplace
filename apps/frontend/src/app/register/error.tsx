'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-900"
    >
      <h2 className="text-base font-semibold">Registration error.</h2>
      <p className="mt-2 opacity-80">{error.message || 'Please try again.'}</p>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => reset()}
          className="rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
        >
          Try again
        </button>
        <a href="/login" className="rounded border border-red-300 px-3 py-1.5 hover:bg-red-100">
          Go to login
        </a>
      </div>
    </div>
  );
}
