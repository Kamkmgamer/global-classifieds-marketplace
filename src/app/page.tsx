import Image from 'next/image';
import Link from 'next/link';
import { env } from '@/lib/env';
import Script from 'next/script';
import { headers, cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import ListingCard from '@/components/ListingCard';
import { api } from '@/lib/http';
import { ListingsResponseSchema } from '@/lib/schemas';

// Function to fetch listings through the robust API client
async function fetchListings(limit: number = 6) {
  const mock = () =>
    Array.from({ length: limit }).map((_, i) => ({
      id: `mock-${i + 1}`,
      title: `Sample item ${i + 1}`,
      price: (i + 1) * 10,
      image: `/placeholder-${(i % 3) + 1}.svg`,
      location: 'Local',
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
  { name: 'Electronics', icon: '⚡️' },
  { name: 'Vehicles', icon: '🚗' },
  { name: 'Home & Garden', icon: '🏡' },
  { name: 'Fashion', icon: '👕' },
  { name: 'Sports', icon: '⚽️' },
  { name: 'Books', icon: '📚' },
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
    <div className="min-h-screen">
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
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[rgb(var(--primary)/0.1)] via-transparent to-transparent" />
        <div className="container mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Buy. Sell. Chat. Anywhere.
              </h1>
              <p className="mt-4 text-balance text-lg text-muted-foreground">
                The modern marketplace for everything. Post listings in seconds, discover deals
                nearby or worldwide, and chat securely to close the sale.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/post">Post an Ad</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/browse">Browse Listings</Link>
                </Button>
              </div>
              {backendUrl && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Backend: <code className="font-semibold">{backendUrl}</code>
                </p>
              )}
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute -right-10 -top-10 hidden size-40 rounded-full bg-[rgb(var(--primary)/0.2)] blur-3xl sm:block" />
              <div className="rounded-xl border border-border bg-white p-4 shadow-sm dark:bg-neutral-900">
                <div className="grid grid-cols-3 gap-3">
                  {/* Display featured listings */}
                  {featuredListings.length > 0
                    ? featuredListings.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} />
                      ))
                    : Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="aspect-square overflow-hidden rounded-lg bg-muted">
                          <Image
                            src={`/placeholder-${(i % 3) + 1}.svg`}
                            alt="Listing"
                            width={200}
                            height={200}
                            className="size-full object-cover"
                          />
                        </div>
                      ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings Section */}
      {featuredListings.length > 0 && (
        <section className="border-t border-border py-12">
          <div className="container mx-auto max-w-7xl px-4">
            <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">
              Featured Listings
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button asChild variant="outline" size="lg">
                <Link href="/browse">View All Listings</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Popular Categories Section */}
      <section className="border-t border-border py-12">
        <div className="container mx-auto max-w-7xl px-4">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">Popular Categories</h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {popularCategories.map((category) => (
              <Link
                key={category.name}
                href={`/browse?category=${category.name.toLowerCase()}`}
                className="flex flex-col items-center justify-center rounded-xl border border-border bg-background p-5 shadow-sm transition-colors hover:bg-muted"
              >
                <span className="text-4xl">{category.icon}</span>
                <h3 className="mt-3 text-base font-semibold">{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="border-t border-border py-12">
        <div className="container mx-auto max-w-7xl px-4">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">What Our Users Say</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-background p-6 shadow-sm"
              >
                <p className="text-lg italic text-muted-foreground">
                  &quot;{testimonial.quote}&quot;
                </p>
                <p className="mt-4 font-semibold">{testimonial.author}</p>
                <p className="text-sm text-muted-foreground">{testimonial.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border">
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Post in seconds',
                desc: 'Create listings with photos and reach buyers fast.',
              },
              { title: 'Powerful search', desc: 'Filter by category, price, location, and more.' },
              {
                title: 'Built-in chat',
                desc: 'Secure, real-time messaging with buyers and sellers.',
              },
              {
                title: 'Trusted community',
                desc: 'Ratings, profiles, and moderation keep it safe.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-background p-5 shadow-sm"
              >
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-[rgb(var(--muted)/0.4)]">
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-pretty text-2xl font-bold sm:text-3xl">Ready to sell something?</h2>
            <p className="max-w-2xl text-balance text-muted-foreground">
              Join thousands of users buying and selling safely every day. It takes less than a
              minute to post your first listing.
            </p>
            <div className="flex gap-3">
              <Button asChild size="lg">
                <Link href="/post">Post your first ad</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/browse">Explore listings</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
