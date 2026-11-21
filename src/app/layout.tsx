import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { reports, requests, trips, verificationDocs } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { Nav, type NavItem } from "@/components/Nav";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Track } from "@/components/Track";
import { siteInfo } from "@/lib/site";
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
    { media: "(prefers-color-scheme: light)", color: "#000000" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

const FOOTER: { title: string; links: [string, string][] }[] = [
  { title: "Lilalink", links: [["/a-propos", "Qui sommes-nous"], ["/comment-ca-marche", "Comment ça marche"], ["/contact", "Nous contacter"]] },
  { title: "Envoyer un colis", links: [["/", "Trouver un GP"], ["/demandes", "Mes demandes"], ["/objets-interdits", "Objets interdits"]] },
  { title: "Devenir GP", links: [["/gp/publier", "Publier un trajet"], ["/gp/verification", "Badge GP vérifié"], ["/gp", "Espace GP"]] },
  { title: "Aide et confiance", links: [["/aide", "Questions fréquentes"], ["/signaler", "Signaler un problème"], ["/confidentialite", "Vos données"]] },
];

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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@600;700&display=swap"
        />
      </head>
      <body>
        <header className="top">
          <div className="topin">
            <Link href="/" className="brand">
              Lilalink
            </Link>
            {user ? (
              <Link href="/compte" className="side who-mini">
                {user.name.split(" ")[0]}
                {user.verification === "verified" && <VerifiedBadge size={16} />}
              </Link>
            ) : (
              <Link href="/inscription" className="side barbtn">
                S&apos;inscrire
              </Link>
            )}
            <Nav items={items} />
          </div>
        </header>
        <Track />
        <main className="wrap">{children}</main>
        <footer className="foot">
          <div className="footin">
            <Link href="/" className="brand">
              Lilalink
            </Link>
            <Link href="/aide" className="foot-help">
              Questions fréquentes et aide
            </Link>
            <nav className="foot-cols" aria-label="Plan du site">
              {FOOTER.map((col) => (
                <div key={col.title}>
                  <h2>{col.title}</h2>
                  <ul>
                    {col.links.map(([href, label]) => (
                      <li key={href}>
                        <Link href={href}>{label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
            <div className="foot-row">
              <div className="foot-pills">
                {siteInfo().socials.map((s) => (
                  <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                ))}
              </div>
              <div className="foot-pills">
                <span>France ↔ Afrique de l&apos;Ouest</span>
              </div>
            </div>
            <p className="foot-note">
              La plateforme met en relation expéditeurs et GP. Le paiement et la remise du colis se font directement entre vous.
            </p>
            <div className="foot-legal">
              <small>© {new Date().getFullYear()} Lilalink</small>
              <Link href="/mentions-legales">Mentions légales</Link>
              <Link href="/cgu">CGU</Link>
              <Link href="/confidentialite">Confidentialité</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
