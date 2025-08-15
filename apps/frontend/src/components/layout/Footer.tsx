import { Facebook, Twitter, Instagram } from "lucide-react";
import Link from "next/link";

const footerLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

const socialLinks = [
  { href: "#", icon: Facebook },
  { href: "#", icon: Twitter },
  { href: "#", icon: Instagram },
];

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Global Classifieds. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-6">
            {footerLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4">
            {socialLinks.map(({ href, icon: Icon }) => (
              <Link
                key={Icon.displayName}
                href={href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Icon className="h-5 w-5" />
                <span className="sr-only">{Icon.displayName}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
