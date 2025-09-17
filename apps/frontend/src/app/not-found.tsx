import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-20 text-center">
      <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl">
        🤔
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 text-muted-foreground">
        The page you are looking for doesn’t exist or has been moved.
      </p>
      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-[rgb(var(--primary)/0.9)]"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
