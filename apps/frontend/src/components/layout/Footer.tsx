export function Footer() {
  return (
    <footer className="border-t border-[rgb(var(--border)/0.6)] bg-white dark:bg-neutral-950">
      <div className="container mx-auto max-w-7xl px-4 py-8 text-sm text-muted-foreground">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p>© {new Date().getFullYear()} Global Classifieds. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a className="hover:text-foreground" href="#">Privacy</a>
            <a className="hover:text-foreground" href="#">Terms</a>
            <a className="hover:text-foreground" href="#">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
