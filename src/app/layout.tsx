import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { reports, requests, trips, verificationDocs } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { Nav, type NavItem } from "@/components/Nav";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Plateforme GP", template: "%s · Plateforme GP" },
  description: "Trouvez un GP de confiance pour envoyer vos colis entre la France et l'Afrique.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b7a4b",
};

async function navItems(): Promise<{ items: NavItem[]; user: Awaited<ReturnType<typeof getUser>> }> {
  const user = await getUser();
  const items: NavItem[] = [{ href: "/", label: "Trouver un GP" }];
  if (!user) return { items: [...items, { href: "/connexion", label: "Se connecter" }], user };

  items.push({ href: "/demandes", label: "Mes demandes" });
  if (user.role === "gp" || user.role === "admin") {
    const [{ n }] = await db
      .select({ n: count() })
      .from(requests)
      .innerJoin(trips, eq(trips.id, requests.tripId))
      .where(and(eq(trips.gpId, user.id), eq(requests.status, "pending")));
    items.push({ href: "/gp", label: "Espace GP", count: n });
  }
  items.push({ href: "/signaler", label: "Signaler" });
  if (user.role === "admin") {
    const [{ r }] = await db.select({ r: count() }).from(reports).where(inArray(reports.status, ["new", "in_progress"]));
    const [{ v }] = await db.select({ v: count() }).from(verificationDocs).where(eq(verificationDocs.status, "pending"));
    items.push({ href: "/admin", label: "Admin", count: r + v });
  }
  return { items, user };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { items, user } = await navItems();
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&display=swap"
        />
      </head>
      <body>
        <header className="top">
          <div className="brandrow">
            <Link href="/" className="brand">
              <span className="logo">GP</span>
              <b>Plateforme GP</b>
            </Link>
            {user && (
              <Link href="/compte" className="who-mini">
                {user.name.split(" ")[0]}
                {user.verification === "verified" && <VerifiedBadge size={16} />}
              </Link>
            )}
          </div>
          <Nav items={items} />
        </header>
        <main className="wrap">{children}</main>
        <footer className="foot">
          La plateforme met en relation expéditeurs et GP. Le paiement et la remise du colis se font directement entre vous.
        </footer>
      </body>
    </html>
  );
}
