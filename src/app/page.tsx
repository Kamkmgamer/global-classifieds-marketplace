import Image from 'next/image';
import Link from 'next/link';
import { env } from '@/lib/env';
import Script from 'next/script';
import { headers, cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import ListingCard from '@/components/ListingCard';
import { api } from '@/lib/http';
import { ListingsResponseSchema } from '@/lib/schemas';
import {
  Zap,
  Car,
  Home as HomeIcon,
  Shirt,
  Dumbbell,
  BookOpen,
  Search,
  MessageCircle,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

// Function to fetch listings through the robust API client
async function fetchListings(limit: number = 6) {
  const mock = () =>
    Array.from({ length: limit }).map((_, i) => ({
      id: `mock-${i + 1}`,
      title: `Sample Premium Item ${i + 1}`,
      price: (i + 1) * 120,
      image: `/placeholder-${(i % 3) + 1}.svg`,
      location: 'New York, NY',
    }));

  // If no backend is configured (e.g., local dev without API), return mock data
  if (!env.NEXT_PUBLIC_BACKEND_URL) {
    return mock();
  }

  try {
    const data = await api.get<
      typeof ListingsResponseSchema,
      {
        listings: Array<{
          id: string;
          title: string;
          price: number;
          image: string;
          location?: string;
        }>;
      }
    >(`/listings?limit=${limit}`, {
      cache: 'no-store',
      schema: ListingsResponseSchema,
      retries: 2,
      timeoutMs: 8000,
    });
    return data.listings;
  } catch (err) {
    // Avoid noisy stack traces when backend is down; show concise warning and use mock data
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Listings unavailable, using mock data:', message);
    return mock();
  }
}

const popularCategories = [
  { name: 'Electronics', icon: Zap, color: 'text-yellow-500' },
  { name: 'Vehicles', icon: Car, color: 'text-blue-500' },
  { name: 'Home & Garden', icon: HomeIcon, color: 'text-green-500' },
  { name: 'Fashion', icon: Shirt, color: 'text-pink-500' },
  { name: 'Sports', icon: Dumbbell, color: 'text-orange-500' },
  { name: 'Books', icon: BookOpen, color: 'text-purple-500' },
];

const testimonials = [
  {
    quote: 'This marketplace is a game-changer! I sold my old bike in less than 24 hours.',
    author: 'John Doe',
    title: 'Happy Seller',
  },
  {
    quote:
      'Finding exactly what I needed was so easy. The chat feature made communication a breeze.',
    author: 'Jane Smith',
    title: 'Satisfied Buyer',
  },
  {
    quote: 'Secure and user-friendly. I highly recommend Global Classifieds to everyone!',
    author: 'Peter Jones',
    title: 'Trusted User',
  },
];

export default async function Home() {
  const backendUrl = env.NEXT_PUBLIC_BACKEND_URL;
  const featuredListings = await fetchListings(6); // Fetch 6 featured listings
  const hdrs = await headers();
  const cookieStore = await cookies();
  const nonce = hdrs.get('x-nonce') || cookieStore.get('nonce')?.value || undefined;

  return (
    <div className="min-h-screen bg-background">
      <Script id="ld-org" type="application/ld+json" strategy="afterInteractive" nonce={nonce}>
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Global Classifieds',
          url: env.NEXT_PUBLIC_SITE_URL,
          logo: '/favicon.ico',
        })}
      </Script>
      <Script id="ld-website" type="application/ld+json" strategy="afterInteractive" nonce={nonce}>
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Global Classifieds Marketplace',
          url: env.NEXT_PUBLIC_SITE_URL,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${env.NEXT_PUBLIC_SITE_URL}/browse?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        })}
      </Script>

      {/* Hero Section */}
      <section className="relative overflow-hidden pb-16 pt-16 md:pt-24 lg:pt-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-8 text-center">
            <div className="max-w-3xl space-y-4">
              <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-4xl font-bold tracking-tighter text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
                Buy. Sell. Chat. Anywhere.
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                The modern marketplace for everything. Post listings in seconds, discover deals
                nearby or worldwide, and chat securely to close the sale.
              </p>
            </div>
            <div className="flex flex-col gap-4 min-[400px]:flex-row">
              <Button asChild size="lg" className="h-12 px-8 text-base">
                <Link href="/post">
                  Post an Ad <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 bg-background/50 px-8 text-base backdrop-blur-sm"
              >
                <Link href="/browse">Browse Listings</Link>
              </Button>
            </div>
            {backendUrl && (
              <div className="mt-8 rounded-full border border-border/50 bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-md">
                Backend connected: <code className="font-semibold">{backendUrl}</code>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="bg-muted/30 py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="mb-12 flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Featured Listings</h2>
              <p className="text-muted-foreground">Discover the best deals available right now.</p>
            </div>
            <Button asChild variant="ghost" className="group">
              <Link href="/browse">
                View all listings
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredListings.length > 0
              ? featuredListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))
              : Array.from({ length: 4 }).map((_, i) => (
                  <Card
                    key={i}
                    className="overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm"
                  >
                    <div className="aspect-square animate-pulse bg-muted" />
                    <CardHeader className="space-y-2">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                    </CardHeader>
                  </Card>
                ))}
          </div>
        </div>
      </section>

      {/* Popular Categories Section */}
      <section className="py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="mb-12 space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Popular Categories</h2>
            <p className="mx-auto max-w-[600px] text-muted-foreground">
              Browse through our most visited categories and find exactly what you&apos;re looking
              for.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {popularCategories.map((category) => (
              <Link
                key={category.name}
                href={`/browse?category=${category.name.toLowerCase()}`}
                className="group relative flex flex-col items-center justify-center gap-4 rounded-xl border bg-background p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
              >
                <div
                  className={`rounded-full bg-muted/50 p-4 transition-colors group-hover:bg-primary/10 ${category.color}`}
                >
                  <category.icon className="h-8 w-8" />
                </div>
                <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Why Choose Global Classifieds?
              </h2>
              <p className="text-lg text-muted-foreground">
                We provide the safest and most convenient way to buy and sell locally and globally.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                {
                  title: 'Post in seconds',
                  desc: 'Create listings with photos and reach buyers fast.',
                  icon: Zap,
                },
                {
                  title: 'Powerful search',
                  desc: 'Filter by category, price, location, and more.',
                  icon: Search,
                },
                {
                  title: 'Built-in chat',
                  desc: 'Secure, real-time messaging with buyers and sellers.',
                  icon: MessageCircle,
                },
                {
                  title: 'Trusted community',
                  desc: 'Ratings, profiles, and moderation keep it safe.',
                  icon: ShieldCheck,
                },
              ].map((f) => (
                <Card
                  key={f.title}
                  className="border-border/50 bg-background/50 backdrop-blur-sm transition-colors hover:border-primary/20 hover:bg-background"
                >
                  <CardHeader>
                    <f.icon className="mb-2 h-10 w-10 text-primary" />
                    <CardTitle className="text-lg">{f.title}</CardTitle>
                    <CardDescription>{f.desc}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tighter sm:text-4xl">
            What Our Users Say
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-none bg-muted/30 shadow-none">
                <CardContent className="pt-6">
                  <div className="mb-4 text-primary">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="none"
                      className="h-8 w-8 opacity-20"
                    >
                      <path d="M14.017 21L14.017 18C14.017 16.0547 15.373 15.122 16.4141 15.122C17.4551 15.122 18.1719 16.0547 18.1719 18C18.1719 19.9453 16.8154 21 15.7744 21H14.017ZM8.01758 21L8.01758 18C8.01758 16.0547 9.37305 15.122 10.4141 15.122C11.4551 15.122 12.1719 16.0547 12.1719 18C12.1719 19.9453 10.8154 21 9.77441 21H8.01758ZM16.4141 13.122C16.4141 13.122 18.1719 13.122 18.1719 11C18.1719 8.87805 16.4141 7.12207 14.017 7.12207C11.6199 7.12207 9.8623 8.87805 9.8623 11C9.8623 13.122 11.6199 13.122 11.6199 13.122C11.6199 13.122 10.4141 13.122 10.4141 15.122C10.4141 17.122 11.6199 17.122 11.6199 17.122C11.6199 17.122 9.8623 17.122 9.8623 15.122C9.8623 13.122 11.6199 13.122 11.6199 13.122ZM10.4141 11C10.4141 9.87805 11.6199 9.12207 12.8174 9.12207C14.0149 9.12207 15.2207 9.87805 15.2207 11C15.2207 12.122 14.0149 12.878 12.8174 12.878C11.6199 12.878 10.4141 12.122 10.4141 11Z" />
                    </svg>
                  </div>
                  <p className="mb-6 text-lg italic text-muted-foreground">
                    &quot;{testimonial.quote}&quot;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {testimonial.author[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to sell something?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join thousands of users buying and selling safely every day. It takes less than a
                minute to post your first listing.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button asChild size="lg" className="px-8">
                <Link href="/post">Post your first ad</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8">
                <Link href="/browse">Explore listings</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
