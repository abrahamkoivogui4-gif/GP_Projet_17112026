"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; count?: number };

/** Pages de connexion : affichées seules, sans en-tête, comme sur Facebook. */
const AUTH_PAGES = ["/connexion", "/inscription", "/mot-de-passe-oublie"];

export function HideOnAuth({ children, guest }: { children: React.ReactNode; guest?: boolean }) {
  const path = usePathname();
  // Sans compte, la page d'accueil est la page de connexion (comme Facebook) : pas d'en-tête non plus.
  return AUTH_PAGES.some((p) => path.startsWith(p)) || (guest && path === "/") ? null : <>{children}</>;
}

export function Nav({ client, gp, mode }: { client: NavItem[]; gp?: NavItem[]; mode: "client" | "gp" }) {
  const path = usePathname();
  // Dans l'espace GP, on affiche toujours le menu GP.
  const items = gp && (mode === "gp" || path.startsWith("/gp")) ? gp : client;
  const active = (href: string) =>
    href === "/" ? path === "/" || path.startsWith("/trajets") : href === "/trajets" ? path.startsWith("/trajets") : href === "/gp" ? path === "/gp" || path.startsWith("/gp/trajets") : path.startsWith(href);
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
