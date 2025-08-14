import Image from 'next/image';
import Link from 'next/link';
import { env } from '@/lib/env';
import Script from 'next/script';

export default function Home() {
  const backendUrl = env.NEXT_PUBLIC_BACKEND_URL;

  return (
    <div className="min-h-screen">
      <Script id="ld-org" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Global Classifieds',
          url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          logo: '/favicon.ico',
        })}
      </Script>
      <Script id="ld-website" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Global Classifieds Marketplace',
          url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          potentialAction: {
            '@type': 'SearchAction',
            target: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/browse?q={search_term_string}`,
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
                The modern marketplace for everything. Post listings in seconds, discover deals nearby or worldwide, and chat securely to close the sale.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/post" className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-[rgb(var(--primary)/0.9)]">
                  Post an Ad
                </Link>
                <Link href="/browse" className="inline-flex items-center justify-center rounded-md border border-border bg-background px-5 py-3 text-sm font-medium hover:bg-muted">
                  Browse Listings
                </Link>
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
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-lg bg-muted">
                      <Image src={`/placeholder-${(i % 3) + 1}.svg`} alt="Listing" width={200} height={200} className="size-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border">
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Post in seconds', desc: 'Create listings with photos and reach buyers fast.' },
              { title: 'Powerful search', desc: 'Filter by category, price, location, and more.' },
              { title: 'Built-in chat', desc: 'Secure, real-time messaging with buyers and sellers.' },
              { title: 'Trusted community', desc: 'Ratings, profiles, and moderation keep it safe.' },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-background p-5 shadow-sm">
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
            <p className="max-w-2xl text-balance text-muted-foreground">Join thousands of users buying and selling safely every day. It takes less than a minute to post your first listing.</p>
            <div className="flex gap-3">
              <Link href="/post" className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-[rgb(var(--primary)/0.9)]">
                Post your first ad
              </Link>
              <Link href="/browse" className="inline-flex items-center justify-center rounded-md border border-border bg-background px-5 py-3 text-sm font-medium hover:bg-muted">
                Explore listings
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}