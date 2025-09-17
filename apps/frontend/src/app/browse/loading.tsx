import SkeletonCard from '@/components/SkeletonCard';

export default function Loading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <div className="h-6 w-64 rounded bg-muted" />
        <div className="mt-2 h-4 w-80 rounded bg-muted" />
      </div>
      <div className="mb-4 flex items-center justify-between">
        <div className="h-10 w-64 rounded-md bg-muted" />
        <div className="h-10 w-72 rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
