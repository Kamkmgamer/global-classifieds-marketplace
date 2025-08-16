import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type Listing = {
  id: string;
  title: string;
  price: number;
  image: string;
  location?: string;
};

export default function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Card>
      <CardHeader>
        <div className="aspect-square w-full overflow-hidden rounded-md bg-muted">
          <Image
            src={listing.image}
            alt={listing.title}
            width={600}
            height={600}
            className="h-full w-full object-cover"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="line-clamp-1 font-medium">
              {listing.title}
            </CardTitle>
            {listing.location && (
              <div className="mt-0.5 text-xs text-muted-foreground">
                {listing.location}
              </div>
            )}
          </div>
          <div className="shrink-0 font-semibold">
            ${listing.price.toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
