export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border bg-card p-3">
      <div className="aspect-square w-full rounded-md bg-muted" />
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
        <div className="h-4 w-12 shrink-0 rounded bg-muted" />
      </div>
    </div>
  );
}
