"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Menu as MenuIcon, X as XIcon } from "lucide-react";

const navLinks = [
  { href: "/browse", label: "Browse" },
  { href: "/post", label: "Post" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isSheetOpen, setSheetOpen] = useState(false);

  const closeSheet = () => setSheetOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[rgb(var(--border)/0.6)] bg-background/70 backdrop-blur-lg">
      <div className="container mx-auto max-w-7xl px-4">
        <nav className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              G
            </span>
            <span>Global Classifieds</span>
          </Link>
          <div className="hidden items-center gap-4 md:flex">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <Button asChild>
              <Link href="/post">Post an Ad</Link>
            </Button>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  {isSheetOpen ? ( // Conditionally render XIcon or MenuIcon
                    <XIcon className="h-4 w-4" />
                  ) : (
                    <MenuIcon className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-xs">
                <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b pb-4">
                    <Link href="/" className="flex items-center gap-2 font-semibold" onClick={closeSheet}>
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        G
                      </span>
                      <span>Global Classifieds</span>
                    </Link>
                    {/* Remove the extra SheetTrigger here */}
                  </div>
                  <div className="flex flex-1 flex-col gap-4 py-6">
                    {navLinks.map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={closeSheet}
                        className={`text-lg font-medium transition-colors hover:text-primary ${
                          pathname === href
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                  <div className="mt-auto border-t pt-6">
                    <Button asChild className="w-full">
                      <Link href="/post" onClick={closeSheet}>Post an Ad</Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
