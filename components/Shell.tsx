"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Play" },
  { href: "/about", label: "About" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span>🧐</span> Gender Guesser
            </Link>
            <nav className="hidden gap-6 md:flex">
              {LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm ${pathname === href ? "font-medium text-brand underline underline-offset-4" : "text-muted hover:text-foreground"}`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <button type="button" className="p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            <div className="space-y-1">
              <span className="block h-0.5 w-5 bg-foreground" />
              <span className="block h-0.5 w-5 bg-foreground" />
              <span className="block h-0.5 w-5 bg-foreground" />
            </div>
          </button>
        </div>
        {open && (
          <nav className="border-t px-4 py-2 md:hidden">
            {LINKS.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} className="block py-2 text-sm">
                {label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8 text-center text-xs text-muted">
        Gender Guesser does not discriminate against any gender identities.
      </footer>
    </>
  );
}
