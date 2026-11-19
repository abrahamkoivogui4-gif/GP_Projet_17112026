import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { and, count, eq, gte, inArray, isNull, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { parcels, reports, requests, trips, verificationDocs } from "@/db/schema";
import { getMode, getUser, savedAccounts } from "@/lib/auth";
import { todayIso } from "@/lib/format";
import { HideOnAuth, Nav, type NavItem } from "@/components/Nav";
import { ProfileMenu, type MenuAccount } from "@/components/ProfileMenu";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Lilalink · Envoyez vos colis avec un GP de confiance", template: "%s · Lilalink" },
  description: "Lilalink, le colis entre personnes de confiance. Trouvez un GP vérifié pour envoyer vos colis entre la France et l'Afrique.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

async function header() {
  const [user, mode] = await Promise.all([getUser(), getMode()]);
  const client: NavItem[] = [
    { href: "/", label: "Trouver un GP" },
    { href: "/colis/nouveau", label: "Envoyer un colis" },
  ];
  if (!user) return { user, mode, client, gp: undefined, accounts: [] as MenuAccount[] };

  client.push({ href: "/demandes", label: "Mes demandes" }, { href: "/signaler", label: "Signaler" });
  let gp: NavItem[] | undefined;
  if (user.role === "gp" || user.role === "admin") {
    const [[{ n }], [{ c }]] = await Promise.all([
      db
        .select({ n: count() })
        .from(requests)
        .innerJoin(trips, eq(trips.id, requests.tripId))
        .where(and(eq(trips.gpId, user.id), eq(requests.status, "pending"))),
      db
        .select({ c: count() })
        .from(parcels)
        .where(and(eq(parcels.status, "open"), ne(parcels.clientId, user.id), or(isNull(parcels.beforeDate), gte(parcels.beforeDate, todayIso())))),
    ]);
    gp = [
      { href: "/gp", label: "Mes trajets" },
      { href: "/gp/publier", label: "Publier" },
      { href: "/gp/demandes", label: "Demandes reçues", count: n },
      { href: "/gp/colis", label: "Colis en attente", count: c },
      { href: "/signaler", label: "Signaler" },
    ];
  }
  if (user.role === "admin") {
    const [{ r }] = await db.select({ r: count() }).from(reports).where(inArray(reports.status, ["new", "in_progress"]));
    const [{ v }] = await db.select({ v: count() }).from(verificationDocs).where(eq(verificationDocs.status, "pending"));
    const admin = { href: "/admin", label: "Admin", count: r + v };
    client.push(admin);
    gp?.push(admin);
  }
  const accounts: MenuAccount[] = (await savedAccounts()).map((a) => ({
    id: a.id,
    name: a.name,
    phone: a.phone,
    role: a.role,
    verified: a.verification === "verified",
  }));
  return { user, mode: gp ? mode : ("client" as const), client, gp, accounts };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { user, mode, client, gp, accounts } = await header();
  const me: MenuAccount | undefined = user
    ? { id: user.id, name: user.name, phone: user.phone, role: user.role, verified: user.verification === "verified" }
    : undefined;
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
        <HideOnAuth>
          <header className="top">
            <div className="brandrow">
              <Link href={mode === "gp" ? "/gp" : "/"} className="brand">
                <span className="logo">L</span>
                <b>Lilalink</b>
                {mode === "gp" && <span className="mode-tag">✈️ Je voyage</span>}
              </Link>
              {me ? (
                <ProfileMenu me={me} mode={mode} others={accounts.filter((a) => a.id !== me.id)} />
              ) : (
                <Link href="/connexion" className="btn small auto round">
                  Se connecter
                </Link>
              )}
            </div>
            <Nav client={client} gp={gp} mode={mode} />
          </header>
        </HideOnAuth>
        <main className="wrap">{children}</main>
        <HideOnAuth>
          <footer className="foot">
            La plateforme met en relation expéditeurs et GP. Le paiement et la remise du colis se font directement entre vous.
          </footer>
        </HideOnAuth>
      </body>
    </html>
  );
}
