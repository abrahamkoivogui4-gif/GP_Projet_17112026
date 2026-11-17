"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; count?: number };

export function Nav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" || path.startsWith("/trajets") : path.startsWith(href));
  return (
    <nav className="nav" aria-label="Menu principal">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={active(i.href) ? "page" : undefined}>
          {i.label}
          {i.count ? <span className="count">{i.count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}

export function SubNav({ items }: { items: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <div className="subnav">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={path === i.href ? "page" : undefined}>
          {i.label}
        </Link>
      ))}
    </div>
  );
}
