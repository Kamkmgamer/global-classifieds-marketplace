export default function RootLoading() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-2/3 rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="h-40 rounded bg-muted" />
          <div className="h-40 rounded bg-muted" />
          <div className="h-40 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
