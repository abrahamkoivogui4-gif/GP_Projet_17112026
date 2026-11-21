import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { siteVisits } from "@/db/schema";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp|curl|wget|python|monitor/i;

/** Jour courant à Paris, au format AAAA-MM-JJ. */
function parisDay() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
}

/**
 * Compte une page vue. Appelé par le navigateur à chaque changement de page (composant Track).
 * Aucune donnée personnelle stockée : le visiteur est une empreinte qui change chaque jour.
 * Les pages d'administration, les robots et les administrateurs ne sont pas comptés.
 */
export async function POST(req: Request) {
  const done = new Response(null, { status: 204 });
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return done;

  let path = "/";
  try {
    path = String(JSON.parse(await req.text())?.p ?? "/");
  } catch {}
  if (path.startsWith("/admin") || path.startsWith("/api")) return done;

  const user = await getUser();
  if (user?.role === "admin") return done;

  // Caddy remplace l'en-tête X-Forwarded-For par l'IP réelle du visiteur.
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",").pop()?.trim() || "?";
  const day = parisDay();
  const visitor = createHash("sha256")
    .update(`${process.env.DATABASE_URL ?? ""}|${day}|${ip}|${ua}`)
    .digest("base64url")
    .slice(0, 24);

  await db
    .insert(siteVisits)
    .values({ day, visitor, views: 1 })
    .onConflictDoUpdate({
      target: [siteVisits.day, siteVisits.visitor],
      // Plafond par visiteur et par jour, pour qu'un robot ou un abus ne fausse pas le graphe.
      set: { views: sql`least(${siteVisits.views} + 1, 500)` },
    });
  return done;
}
