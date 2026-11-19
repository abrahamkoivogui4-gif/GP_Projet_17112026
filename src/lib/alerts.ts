import "server-only";
import { and, eq, gte, isNull, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { parcels, tripAlerts, users } from "@/db/schema";
import { notifyNewTrip } from "./notify";
import { getTrip } from "./queries";

/**
 * Un nouveau trajet vient d'être publié : on prévient sur WhatsApp
 *  - les expéditeurs qui ont une demande d'envoi ouverte sur ce parcours (lien direct pour réserver) ;
 *  - les personnes qui ont activé une alerte sur ce parcours (ou « toutes les villes »).
 * Une même personne ne reçoit qu'un message.
 */
export async function alertNewTrip(tripId: number) {
  const t = await getTrip(tripId);
  if (!t || t.status !== "active") return;

  const waiting = await db
    .select({ id: parcels.id, phone: users.phone, userId: users.id })
    .from(parcels)
    .innerJoin(users, eq(users.id, parcels.clientId))
    .where(
      and(
        eq(parcels.status, "open"),
        eq(parcels.fromCity, t.fromCity),
        eq(parcels.toCity, t.toCity),
        or(isNull(parcels.beforeDate), gte(parcels.beforeDate, t.departureDate)),
        ne(parcels.clientId, t.gpId),
        eq(users.suspended, false),
      ),
    );

  const subscribed = await db
    .selectDistinct({ phone: users.phone, userId: users.id })
    .from(tripAlerts)
    .innerJoin(users, eq(users.id, tripAlerts.userId))
    .where(
      and(
        or(isNull(tripAlerts.fromCity), eq(tripAlerts.fromCity, t.fromCity)),
        or(isNull(tripAlerts.toCity), eq(tripAlerts.toCity, t.toCity)),
        ne(tripAlerts.userId, t.gpId),
        eq(users.suspended, false),
      ),
    );

  const sent = new Set<number>();
  for (const p of waiting) {
    if (sent.has(p.userId)) continue;
    sent.add(p.userId);
    await notifyNewTrip(p.phone, t, `/trajets/${t.id}?colis=${p.id}`);
  }
  for (const s of subscribed) {
    if (sent.has(s.userId)) continue;
    sent.add(s.userId);
    await notifyNewTrip(s.phone, t);
  }
}
