import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="aspect-square w-full rounded-md bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="h-3 w-24 rounded bg-muted" />
          </div>
          <div className="h-4 w-12 shrink-0 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
