'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Menu as MenuIcon, X as XIcon, Globe } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const navLinks = [
  { href: '/browse', label: 'Browse' },
  { href: '/post', label: 'Post' },
  { href: '/about', label: 'About' },
];

export function Navbar() {
  const pathname = usePathname();
  const [isSheetOpen, setSheetOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();

  const closeSheet = () => setSheetOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-prose">
        <nav className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold transition-opacity hover:opacity-90"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Globe className="h-5 w-5" />
            </div>
            <span className="hidden tracking-tight sm:inline-block">Global Classifieds</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === href ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 md:flex">
              <ThemeToggle />
              {isAuthenticated ? (
                <>
                  <Button asChild variant="default" size="sm" className="shadow-sm">
                    <Link href="/post">Post Ad</Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm" className="shadow-sm">
                    <Link href="/register">Get Started</Link>
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    {isSheetOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full max-w-xs sm:max-w-sm">
                  <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
                  <SheetDescription className="sr-only">
                    Navigation links for the mobile version of the site.
                  </SheetDescription>
                  <div className="flex h-full flex-col">
                    <div className="mb-4 flex items-center justify-between border-b pb-4">
                      <Link
                        href="/"
                        className="flex items-center gap-2 text-lg font-bold"
                        onClick={closeSheet}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                          <Globe className="h-5 w-5" />
                        </div>
                        <span>Global Classifieds</span>
                      </Link>
                    </div>
                    <div className="flex flex-1 flex-col gap-4">
                      {navLinks.map(({ href, label }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={closeSheet}
                          className={`text-lg font-medium transition-colors hover:text-primary ${
                            pathname === href ? 'text-primary' : 'text-foreground'
                          }`}
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                    <div className="mt-auto flex flex-col gap-3 pb-6">
                      {isAuthenticated ? (
                        <>
                          <Button asChild className="w-full" onClick={closeSheet}>
                            <Link href="/post">Post an Ad</Link>
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              logout();
                              closeSheet();
                            }}
                          >
                            Logout
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button asChild variant="outline" className="w-full" onClick={closeSheet}>
                            <Link href="/login">Login</Link>
                          </Button>
                          <Button asChild className="w-full" onClick={closeSheet}>
                            <Link href="/register">Get Started</Link>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
