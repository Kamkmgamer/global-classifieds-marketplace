"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-[rgb(var(--border)/0.6)] bg-white/70 backdrop-blur dark:bg-neutral-950/70">
      <div className="container mx-auto max-w-7xl px-4">
        <nav className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-flex w-6 h-6 items-center justify-center rounded-md bg-primary text-white">G</span>
            <span>Global Classifieds</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/browse" className="hidden sm:inline-flex rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Browse</Link>
            <Link href="/post" className="hidden sm:inline-flex rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Post</Link>
            <Link href="/about" className="hidden sm:inline-flex rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground">About</Link>
            <ThemeToggle />
            <Link href="/post" className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-white shadow hover:bg-primary/90">Post an Ad</Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
