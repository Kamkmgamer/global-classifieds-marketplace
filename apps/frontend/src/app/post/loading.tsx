export default function PostLoading() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-1/2 rounded bg-muted" />
        <div className="h-10 w-full rounded bg-muted" />
        <div className="h-64 w-full rounded bg-muted" />
        <div className="h-10 w-1/3 rounded bg-muted" />
      </div>
    </div>
  );
}
