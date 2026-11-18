"use server";
import { randomInt, timingSafeEqual } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { messages, reports, requests, reviews, trips, users, verificationDocs } from "@/db/schema";
import { requireGp, requireUser, type SessionUser } from "@/lib/auth";
import { CATEGORIES, CITIES, DELAYS, MAX_KG, MAX_PRICE, REPORT_TYPES, URGENT_REPORT_TYPES } from "@/lib/constants";
import { shortDate, todayIso } from "@/lib/format";
import { notify } from "@/lib/notify";
import { getTrip } from "@/lib/queries";
import { loadRequestFor } from "@/lib/requests";
import { rateLimit } from "@/lib/rate-limit";
import { saveUpload } from "@/lib/uploads";
import { normalizePhone } from "@/lib/phone";
import type { FormState } from "./auth-actions";

/* ------------------------------------------------------------------ */
/* Trajets (GP)                                                        */
/* ------------------------------------------------------------------ */

const forbiddenSchema = z.array(z.string().trim().min(1).max(60)).max(30);

function parseForbidden(fd: FormData) {
  const raw = fd.getAll("forbidden").map(String);
  return forbiddenSchema.parse([...new Set(raw.map((s) => s.trim()).filter(Boolean))]);
}

const tripSchema = z
  .object({
    fromCity: z.enum(CITIES),
    toCity: z.enum(CITIES),
    departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    capacityKg: z.coerce.number().int().min(1).max(MAX_KG),
    pricePerKg: z.coerce.number().int().min(1).max(MAX_PRICE),
    deliveryDays: z.coerce.number().int().refine((d) => DELAYS.some((x) => x.days === d)),
  })
  .refine((v) => v.fromCity !== v.toCity, { message: "La ville de départ et la destination doivent être différentes." })
  .refine((v) => v.departureDate >= todayIso(), { message: "La date de départ est déjà passée." });

export async function createTrip(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireGp();
  const parsed = tripSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message.startsWith("Invalid") ? "Vérifiez les informations du trajet." : parsed.error.issues[0].message };
  if (!rateLimit(`trip:${u.id}`, 20, 24 * 3600_000)) return { error: "Trop de trajets publiés aujourd'hui." };
  const [t] = await db
    .insert(trips)
    .values({ ...parsed.data, gpId: u.id, forbiddenItems: parseForbidden(fd) })
    .returning({ id: trips.id });
  revalidatePath("/");
  redirect(`/gp/trajets/${t.id}?publie=1`);
}

async function ownTrip(u: SessionUser, tripId: number) {
  const t = await db.query.trips.findFirst({ where: eq(trips.id, tripId) });
  if (!t || (t.gpId !== u.id && u.role !== "admin")) throw new Error("Trajet introuvable");
  return t;
}

const tripUpdateSchema = z.object({
  capacityKg: z.coerce.number().int().min(1).max(MAX_KG),
  pricePerKg: z.coerce.number().int().min(1).max(MAX_PRICE),
  deliveryDays: z.coerce.number().int().refine((d) => DELAYS.some((x) => x.days === d)),
});

export async function updateTrip(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireGp();
  const id = Number(fd.get("id"));
  await ownTrip(u, id);
  const parsed = tripUpdateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Vérifiez les informations du trajet." };
  await db
    .update(trips)
    .set({ ...parsed.data, forbiddenItems: parseForbidden(fd) })
    .where(eq(trips.id, id));
  revalidatePath(`/gp/trajets/${id}`);
  revalidatePath(`/trajets/${id}`);
  return { ok: "Modifications enregistrées. Elles sont visibles tout de suite par les clients." };
}

export async function cancelTrip(fd: FormData) {
  const u = await requireGp();
  const id = Number(fd.get("id"));
  const t = await ownTrip(u, id);
  await db.update(trips).set({ status: "cancelled" }).where(eq(trips.id, id));
  const pending = await db
    .select({ id: requests.id, phone: users.phone })
    .from(requests)
    .innerJoin(users, eq(users.id, requests.clientId))
    .where(and(eq(requests.tripId, id), inArray(requests.status, ["pending", "accepted"])));
  if (pending.length) {
    await db
      .update(requests)
      .set({ status: "cancelled", decidedAt: new Date() })
      .where(inArray(requests.id, pending.map((p) => p.id)));
    for (const p of pending) await notify(p.phone, `Le trajet ${t.fromCity} → ${t.toCity} a été annulé par le GP.`);
  }
  revalidatePath("/gp");
  redirect("/gp?annule=1");
}

/* ------------------------------------------------------------------ */
/* Demandes (client)                                                   */
/* ------------------------------------------------------------------ */

const requestSchema = z.object({
  tripId: z.coerce.number().int().positive(),
  weightKg: z.coerce.number().int().min(1).max(MAX_KG),
  category: z.enum(CATEGORIES as [string, ...string[]]),
  description: z.string().trim().max(500).default(""),
  recipientName: z.string().trim().min(2, "Indiquez le nom de la personne qui recevra le colis.").max(60),
  confirm: z.literal("on", { errorMap: () => ({ message: "Confirmez que votre colis ne contient aucun objet refusé." }) }),
});

export async function createRequest(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const parsed = requestSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message.startsWith("Invalid") || parsed.error.issues[0].message.startsWith("Expected") ? "Vérifiez votre demande." : parsed.error.issues[0].message };
  const recipientPhone = normalizePhone(String(fd.get("recipientCc") ?? ""), String(fd.get("recipientPhone") ?? ""));
  if (!recipientPhone) return { error: "Indiquez un numéro de téléphone valide pour la personne qui recevra le colis." };
  const t = await getTrip(parsed.data.tripId);
  if (!t || t.status !== "active" || t.departureDate < todayIso()) return { error: "Ce trajet n'est plus disponible." };
  if (t.gpId === u.id) return { error: "Vous ne pouvez pas faire une demande sur votre propre trajet." };
  const free = t.capacityKg - t.bookedKg;
  if (parsed.data.weightKg > free) return { error: `Ce GP n'a plus que ${free} kg disponibles.` };
  if (!rateLimit(`req:${u.id}`, 30, 24 * 3600_000)) return { error: "Trop de demandes envoyées aujourd'hui." };

  const already = await db.query.requests.findFirst({
    where: and(eq(requests.tripId, t.id), eq(requests.clientId, u.id), eq(requests.status, "pending")),
    columns: { id: true },
  });
  if (already) redirect(`/demandes/${already.id}`);

  const [r] = await db
    .insert(requests)
    .values({
      tripId: t.id,
      clientId: u.id,
      weightKg: parsed.data.weightKg,
      category: parsed.data.category,
      description: parsed.data.description,
      recipientName: parsed.data.recipientName,
      recipientPhone,
      pricePerKg: t.pricePerKg,
    })
    .returning({ id: requests.id });
  await db.insert(messages).values({
    requestId: r.id,
    senderId: u.id,
    body: `Bonjour, je voudrais envoyer ${parsed.data.weightKg} kg (${parsed.data.category.toLowerCase()}) avec vous.`,
  });
  await notify(t.gpPhone, `Nouvelle demande de ${u.name} : ${parsed.data.weightKg} kg pour ${t.fromCity} → ${t.toCity}.`);
  revalidatePath("/demandes");
  redirect(`/demandes/${r.id}?envoyee=1`);
}

const decisionSchema = z.object({
  id: z.coerce.number().int().positive(),
  decision: z.enum(["accept", "refuse"]),
  note: z.string().trim().max(500).default(""),
});

export async function decideRequest(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireGp();
  const p = decisionSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Action invalide." };
  const row = await loadRequestFor(u, p.data.id);
  if (!row || row.side !== "gp") return { error: "Demande introuvable." };
  if (row.r.status !== "pending") return { error: "Cette demande a déjà reçu une réponse." };

  if (p.data.decision === "accept") {
    const t = await getTrip(row.t.id);
    const free = (t?.capacityKg ?? 0) - (t?.bookedKg ?? 0);
    if (row.r.weightKg > free) return { error: `Il ne vous reste que ${free} kg sur ce trajet. Augmentez la place dans « Mes trajets » ou refusez la demande.` };
  }
  const status = p.data.decision === "accept" ? "accepted" : "refused";
  await db
    .update(requests)
    .set({ status, gpNote: p.data.note, decidedAt: new Date(), ...(status === "accepted" ? { deliveryCode: newCode(), codeAttempts: 0 } : {}) })
    .where(eq(requests.id, row.r.id));
  if (p.data.note) await db.insert(messages).values({ requestId: row.r.id, senderId: u.id, body: p.data.note });
  const client = await db.query.users.findFirst({ where: eq(users.id, row.r.clientId), columns: { phone: true } });
  if (client)
    await notify(
      client.phone,
      status === "accepted"
        ? `${u.name} a accepté votre colis pour ${row.t.fromCity} → ${row.t.toCity}. Son numéro et votre code de livraison sont dans l'application : transmettez le code à ${row.r.recipientName || "votre destinataire"}.`
        : `${u.name} n'a pas pu accepter votre colis pour ${row.t.fromCity} → ${row.t.toCity}.`,
    );
  revalidatePath(`/demandes/${row.r.id}`);
  revalidatePath("/gp/demandes");
  return { ok: status === "accepted" ? "Demande acceptée." : "Demande refusée." };
}

export async function cancelRequest(fd: FormData) {
  const u = await requireUser();
  const row = await loadRequestFor(u, Number(fd.get("id")));
  if (!row || row.side !== "client" || row.r.status !== "pending") return;
  await db.update(requests).set({ status: "cancelled", decidedAt: new Date() }).where(eq(requests.id, row.r.id));
  revalidatePath(`/demandes/${row.r.id}`);
}

/* ------------------------------------------------------------------ */
/* Code de livraison                                                   */
/* ------------------------------------------------------------------ */

const MAX_CODE_ATTEMPTS = 5;

function newCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function sameCode(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Le GP saisit le code donné par le destinataire : c'est la seule façon de marquer le colis comme livré. */
export async function confirmDelivery(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireGp();
  const row = await loadRequestFor(u, Number(fd.get("id")));
  if (!row || row.side !== "gp") return { error: "Demande introuvable." };
  if (row.r.status !== "accepted") return { error: "Cette demande n'attend pas de livraison." };
  if (!row.r.deliveryCode) return { error: "Le client n'a pas encore de code. Demandez-lui de le créer depuis sa demande." };
  if (row.r.codeAttempts >= MAX_CODE_ATTEMPTS)
    return { error: "Trop d'essais. Le client doit créer un nouveau code depuis sa demande, puis le redonner au destinataire." };

  const code = String(fd.get("code") ?? "").replace(/\D/g, "");
  if (!sameCode(code, row.r.deliveryCode)) {
    const attempts = row.r.codeAttempts + 1;
    await db.update(requests).set({ codeAttempts: attempts }).where(eq(requests.id, row.r.id));
    const left = MAX_CODE_ATTEMPTS - attempts;
    return {
      error: left > 0 ? `Code incorrect. Il reste ${left} essai${left > 1 ? "s" : ""}.` : "Code incorrect. Plus d'essai possible : le client doit créer un nouveau code.",
    };
  }

  await db.update(requests).set({ status: "delivered", deliveredAt: new Date() }).where(eq(requests.id, row.r.id));
  const client = await db.query.users.findFirst({ where: eq(users.id, row.r.clientId), columns: { phone: true } });
  if (client) await notify(client.phone, `Votre colis a été remis à ${row.r.recipientName || "votre destinataire"} par ${u.name}. Pensez à laisser un avis.`);
  revalidatePath(`/demandes/${row.r.id}`);
  revalidatePath("/gp/demandes");
  return { ok: "Livraison confirmée. Merci !" };
}

/** Le client crée un nouveau code (code perdu, ou trop d'essais ratés). L'ancien ne marche plus. */
export async function regenerateCode(fd: FormData) {
  const u = await requireUser();
  const row = await loadRequestFor(u, Number(fd.get("id")));
  if (!row || row.side !== "client" || row.r.status !== "accepted") return;
  if (!rateLimit(`code:${row.r.id}`, 5, 24 * 3600_000)) return;
  await db.update(requests).set({ deliveryCode: newCode(), codeAttempts: 0 }).where(eq(requests.id, row.r.id));
  revalidatePath(`/demandes/${row.r.id}`);
}

/** Litige : l'admin peut marquer une livraison comme faite sans code. */
export async function adminMarkDelivered(fd: FormData) {
  const u = await requireUser();
  if (u.role !== "admin") return;
  const row = await loadRequestFor(u, Number(fd.get("id")));
  if (!row || row.r.status !== "accepted") return;
  await db.update(requests).set({ status: "delivered", deliveredAt: new Date() }).where(eq(requests.id, row.r.id));
  revalidatePath(`/demandes/${row.r.id}`);
}

const reviewSchema = z.object({
  id: z.coerce.number().int().positive(),
  stars: z.coerce.number().int().min(1, "Choisissez une note de 1 à 5 étoiles.").max(5),
  comment: z.string().trim().max(500).default(""),
});

export async function postReview(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const p = reviewSchema.safeParse({ ...Object.fromEntries(fd), stars: fd.get("stars") ?? 0 });
  if (!p.success) return { error: p.error.issues[0].message };
  const row = await loadRequestFor(u, p.data.id);
  if (!row || row.side !== "client" || row.r.status !== "delivered") return { error: "Vous ne pouvez pas encore noter ce GP." };
  const exists = await db.query.reviews.findFirst({ where: eq(reviews.requestId, row.r.id), columns: { id: true } });
  if (exists) return { error: "Vous avez déjà donné votre avis." };
  await db.insert(reviews).values({ requestId: row.r.id, gpId: row.t.gpId, clientId: u.id, stars: p.data.stars, comment: p.data.comment });
  revalidatePath(`/demandes/${row.r.id}`);
  revalidatePath(`/trajets/${row.t.id}`);
  return { ok: "Merci, votre avis est publié." };
}

/* ------------------------------------------------------------------ */
/* Messages                                                            */
/* ------------------------------------------------------------------ */

export async function sendMessage(requestId: number, body: string) {
  const u = await requireUser();
  const text = body.trim().slice(0, 1000);
  if (!text) return { ok: false };
  const row = await loadRequestFor(u, requestId);
  if (!row || row.side === "admin" || row.r.status === "refused" || row.r.status === "cancelled") return { ok: false };
  if (!rateLimit(`msg:${u.id}`, 60, 60_000)) return { ok: false };
  await db.insert(messages).values({ requestId, senderId: u.id, body: text });
  const otherId = row.side === "client" ? row.t.gpId : row.r.clientId;
  const other = await db.query.users.findFirst({ where: eq(users.id, otherId), columns: { phone: true } });
  if (other) await notify(other.phone, `Nouveau message de ${u.name} : « ${text.slice(0, 80)} »`);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Badge GP vérifié                                                    */
/* ------------------------------------------------------------------ */

export async function submitVerification(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireGp();
  if (u.verification === "verified") return { ok: "Vous avez déjà le badge." };
  if (u.verification === "pending") return { ok: "Votre pièce est déjà en cours de contrôle." };
  const file = fd.get("document");
  if (!(file instanceof File) || file.size === 0) return { error: "Choisissez une photo de votre pièce d'identité." };
  if (!rateLimit(`verif:${u.id}`, 5, 24 * 3600_000)) return { error: "Trop d'envois aujourd'hui." };
  let name: string;
  try {
    name = await saveUpload(file);
  } catch (e) {
    return {
      error:
        (e as Error).message === "size"
          ? "Le fichier dépasse 5 Mo. Prenez une photo moins lourde."
          : "Format non accepté. Envoyez une photo (JPG, PNG) ou un PDF.",
    };
  }
  await db.insert(verificationDocs).values({ userId: u.id, filePath: name, mimeType: file.type });
  await db.update(users).set({ verification: "pending" }).where(eq(users.id, u.id));
  revalidatePath("/gp");
  return { ok: "Pièce envoyée. L'équipe la contrôle et vous aurez le badge dès validation." };
}

/* ------------------------------------------------------------------ */
/* Signalements                                                        */
/* ------------------------------------------------------------------ */

const reportSchema = z.object({
  type: z.enum(REPORT_TYPES as [string, ...string[]], { errorMap: () => ({ message: "Choisissez ce qui s'est passé." }) }),
  subject: z.string().regex(/^(t|r)\d+$/, "Choisissez la personne ou le trajet concerné."),
  description: z.string().trim().min(10, "Racontez en quelques mots ce qui s'est passé (10 caractères minimum).").max(2000),
});

export async function createReport(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser("/signaler");
  const values = { type: String(fd.get("type") ?? ""), subject: String(fd.get("subject") ?? ""), description: String(fd.get("description") ?? "") };
  const p = reportSchema.safeParse(values);
  if (!p.success) return { error: p.error.issues[0].message, values };
  if (!rateLimit(`report:${u.id}`, 10, 24 * 3600_000)) return { error: "Trop de signalements aujourd'hui.", values };

  const id = Number(p.data.subject.slice(1));
  let tripId: number | null = null,
    requestId: number | null = null,
    targetUserId: number | null = null,
    subject = "";
  if (p.data.subject.startsWith("r")) {
    const row = await loadRequestFor(u, id);
    if (!row || row.side === "admin") return { error: "Demande introuvable.", values };
    requestId = row.r.id;
    tripId = row.t.id;
    targetUserId = row.side === "client" ? row.t.gpId : row.r.clientId;
    const other = await db.query.users.findFirst({ where: eq(users.id, targetUserId), columns: { name: true } });
    subject = `${other?.name ?? "?"} · ${row.t.fromCity} → ${row.t.toCity} · ${shortDate(row.t.departureDate)}`;
  } else {
    const t = await getTrip(id);
    if (!t) return { error: "Trajet introuvable.", values };
    tripId = t.id;
    targetUserId = t.gpId;
    subject = `${t.gpName} · ${t.fromCity} → ${t.toCity} · ${shortDate(t.departureDate)}`;
  }
  await db.insert(reports).values({
    reporterId: u.id,
    type: p.data.type,
    tripId,
    requestId,
    targetUserId,
    subject,
    description: p.data.description,
    urgent: URGENT_REPORT_TYPES.includes(p.data.type),
  });
  revalidatePath("/signaler");
  return { ok: "Signalement envoyé. L'équipe vous répondra ici." };
}

