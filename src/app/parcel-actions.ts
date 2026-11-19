"use server";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { parcelOffers, parcels, tripAlerts, trips, users } from "@/db/schema";
import { requireGp, requireUser } from "@/lib/auth";
import { CATEGORIES, CITIES, MAX_KG } from "@/lib/constants";
import { shortDate, todayIso } from "@/lib/format";
import { appLink, notify } from "@/lib/notify";
import { rateLimit } from "@/lib/rate-limit";
import type { FormState } from "./auth-actions";

/* ------------------------------------------------------------------ */
/* Demandes d'envoi sans trajet (expéditeur)                           */
/* ------------------------------------------------------------------ */

const parcelSchema = z
  .object({
    fromCity: z.enum(CITIES, { errorMap: () => ({ message: "Choisissez la ville de départ." }) }),
    toCity: z.enum(CITIES, { errorMap: () => ({ message: "Choisissez la destination." }) }),
    beforeDate: z
      .string()
      .regex(/^(\d{4}-\d{2}-\d{2})?$/)
      .transform((v) => v || null),
    weightKg: z.coerce.number().int().min(1).max(MAX_KG),
    category: z.enum(CATEGORIES as [string, ...string[]]),
    description: z.string().trim().max(500).default(""),
  })
  .refine((v) => v.fromCity !== v.toCity, { message: "La ville de départ et la destination doivent être différentes." })
  .refine((v) => !v.beforeDate || v.beforeDate >= todayIso(), { message: "La date choisie est déjà passée." });

export async function createParcel(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser("/colis/nouveau");
  const values = Object.fromEntries([...fd.entries()].map(([k, v]) => [k, String(v)]));
  const p = parcelSchema.safeParse({ ...values, beforeDate: values.beforeDate ?? "" });
  if (!p.success) {
    const m = p.error.issues[0].message;
    return { error: m.startsWith("Invalid") || m.startsWith("Expected") || m.startsWith("Number") ? "Vérifiez votre demande." : m, values };
  }
  if (!rateLimit(`parcel:${u.id}`, 10, 24 * 3600_000)) return { error: "Trop de demandes d'envoi aujourd'hui.", values };
  const [row] = await db
    .insert(parcels)
    .values({ ...p.data, clientId: u.id })
    .returning({ id: parcels.id });
  revalidatePath("/demandes");
  revalidatePath("/gp/colis");
  redirect(`/colis/${row.id}?envoyee=1`);
}

export async function closeParcel(fd: FormData) {
  const u = await requireUser();
  const id = Number(fd.get("id"));
  await db
    .update(parcels)
    .set({ status: "closed" })
    .where(and(eq(parcels.id, id), eq(parcels.clientId, u.id), eq(parcels.status, "open")));
  revalidatePath(`/colis/${id}`);
  revalidatePath("/demandes");
  redirect("/demandes");
}

/* ------------------------------------------------------------------ */
/* Proposition d'un trajet par un GP                                   */
/* ------------------------------------------------------------------ */

export async function offerTrip(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireGp();
  const parcelId = Number(fd.get("parcelId"));
  const tripId = Number(fd.get("tripId"));
  if (!tripId) return { error: "Choisissez un de vos trajets." };
  const p = await db.query.parcels.findFirst({ where: eq(parcels.id, parcelId) });
  if (!p || p.status !== "open") return { error: "Cette demande n'est plus ouverte." };
  if (p.clientId === u.id) return { error: "C'est votre propre demande." };
  const t = await db.query.trips.findFirst({ where: and(eq(trips.id, tripId), eq(trips.gpId, u.id)) });
  if (!t || t.status !== "active" || t.departureDate < todayIso()) return { error: "Ce trajet n'est plus disponible." };
  if (t.fromCity !== p.fromCity || t.toCity !== p.toCity) return { error: "Ce trajet ne va pas au même endroit que le colis." };
  if (!rateLimit(`offer:${u.id}`, 40, 24 * 3600_000)) return { error: "Trop de propositions aujourd'hui." };

  const inserted = await db.insert(parcelOffers).values({ parcelId, tripId, gpId: u.id }).onConflictDoNothing().returning({ id: parcelOffers.id });
  if (inserted.length) {
    const client = await db.query.users.findFirst({ where: eq(users.id, p.clientId), columns: { phone: true } });
    if (client)
      await notify(
        client.phone,
        `${u.name} vous propose son trajet ${t.fromCity} → ${t.toCity} du ${shortDate(t.departureDate)} pour votre colis de ${p.weightKg} kg : ${appLink(`/colis/${p.id}`)}`,
      );
  }
  revalidatePath("/gp/colis");
  revalidatePath(`/colis/${p.id}`);
  return { ok: "Proposition envoyée. Le client est prévenu et peut vous envoyer sa demande en un clic." };
}

/* ------------------------------------------------------------------ */
/* Alertes WhatsApp « nouveau trajet »                                 */
/* ------------------------------------------------------------------ */

const city = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "");
  return (CITIES as readonly string[]).includes(s) ? s : null;
};

export async function createAlert(fd: FormData) {
  const back = String(fd.get("back") ?? "/alertes");
  const u = await requireUser(back.startsWith("/") ? back : "/alertes");
  const fromCity = city(fd.get("fromCity"));
  const toCity = city(fd.get("toCity"));
  const same = await db.query.tripAlerts.findFirst({
    where: and(
      eq(tripAlerts.userId, u.id),
      fromCity ? eq(tripAlerts.fromCity, fromCity) : isNull(tripAlerts.fromCity),
      toCity ? eq(tripAlerts.toCity, toCity) : isNull(tripAlerts.toCity),
    ),
    columns: { id: true },
  });
  const count = await db.$count(tripAlerts, eq(tripAlerts.userId, u.id));
  if (!same && count < 20) await db.insert(tripAlerts).values({ userId: u.id, fromCity, toCity });
  revalidatePath("/alertes");
  revalidatePath("/");
  redirect(back.startsWith("/") && !back.startsWith("//") ? `${back}${back.includes("?") ? "&" : "?"}alerte=1` : "/alertes?alerte=1");
}

export async function deleteAlert(fd: FormData) {
  const u = await requireUser("/alertes");
  await db.delete(tripAlerts).where(and(eq(tripAlerts.id, Number(fd.get("id"))), eq(tripAlerts.userId, u.id)));
  revalidatePath("/alertes");
  revalidatePath("/");
}
