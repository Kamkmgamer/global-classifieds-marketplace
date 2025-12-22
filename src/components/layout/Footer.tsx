import { Facebook, Twitter, Instagram, Globe } from 'lucide-react';
import Link from 'next/link';

const footerLinks = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/contact', label: 'Contact Support' },
];

const socialLinks = [
  { href: '#', icon: Facebook, label: 'Facebook' },
  { href: '#', icon: Twitter, label: 'Twitter' },
  { href: '#', icon: Instagram, label: 'Instagram' },
];

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-prose py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Globe className="h-5 w-5" />
              </div>
              <span className="tracking-tight">Global Classifieds</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              The modern marketplace for everything. Buy, sell, and chat securely with people nearby
              and around the world.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Marketplace</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/browse" className="transition-colors hover:text-primary">
                  Browse Listings
                </Link>
              </li>
              <li>
                <Link href="/post" className="transition-colors hover:text-primary">
                  Post an Ad
                </Link>
              </li>
              <li>
                <Link href="/categories" className="transition-colors hover:text-primary">
                  Categories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {footerLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="transition-colors hover:text-primary">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Connect</h3>
            <div className="flex gap-4">
              {socialLinks.map(({ href, icon: Icon, label }) => (
                <Link
                  key={label}
                  href={href}
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                >
                  <Icon className="h-5 w-5" />
                  <span className="sr-only">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Global Classifieds. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="transition-colors hover:text-primary">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-primary">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
