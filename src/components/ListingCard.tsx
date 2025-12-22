import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import Link from 'next/link';

export type Listing = {
  id: string;
  title: string;
  price: number;
  image: string;
  location?: string;
};

export default function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listing/${listing.id}`}>
      <Card className="group overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg">
        <CardHeader className="p-0">
          <div className="relative aspect-square w-full overflow-hidden bg-muted">
            <Image
              src={listing.image}
              alt={listing.title}
              width={600}
              height={600}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute right-2 top-2">
              <Badge
                variant="secondary"
                className="bg-background/80 font-semibold backdrop-blur-md"
              >
                ${listing.price.toLocaleString()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="line-clamp-1 text-lg font-semibold transition-colors group-hover:text-primary">
            {listing.title}
          </h3>
          {listing.location && (
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              <MapPin className="mr-1 h-3 w-3" />
              {listing.location}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
