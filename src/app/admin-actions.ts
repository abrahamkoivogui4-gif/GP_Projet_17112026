"use server";
import { randomInt } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { identityRecords, reports, reviews, sessions, trips, users, verificationDocs } from "@/db/schema";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { deleteUpload } from "@/lib/uploads";
import { z } from "zod";
import { ID_DOC_TYPES } from "@/lib/constants";
import type { FormState } from "./auth-actions";

const num = (fd: FormData, k: string) => Number(fd.get(k)) || 0;

export async function decideVerification(fd: FormData) {
  await requireAdmin();
  const doc = await db.query.verificationDocs.findFirst({ where: eq(verificationDocs.id, num(fd, "id")) });
  if (!doc || doc.status !== "pending") return;
  const approve = fd.get("decision") === "approve";
  const note = String(fd.get("note") ?? "").trim().slice(0, 300);
  if (doc.filePath) await deleteUpload(doc.filePath); // on ne garde pas la pièce d'identité
  await db
    .update(verificationDocs)
    .set({ status: approve ? "approved" : "refused", adminNote: note, filePath: null, decidedAt: new Date() })
    .where(eq(verificationDocs.id, doc.id));
  const [u] = await db
    .update(users)
    .set({ verification: approve ? "verified" : "refused" })
    .where(eq(users.id, doc.userId))
    .returning({ phone: users.phone });
  if (u) await notify(u.phone, approve ? "Votre identité est vérifiée : le badge GP vérifié s'affiche sur vos trajets." : "Votre vérification d'identité a été refusée. Ouvrez l'application pour en savoir plus.");
  revalidatePath("/admin/verifications");
}

export async function updateReport(fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  const status = fd.get("status") === "closed" ? "closed" : "in_progress";
  const reply = String(fd.get("reply") ?? "").trim().slice(0, 2000);
  await db
    .update(reports)
    .set({ status, ...(reply ? { adminReply: reply } : {}), updatedAt: new Date() })
    .where(eq(reports.id, id));
  revalidatePath("/admin/signalements");
}

export async function setTripStatus(fd: FormData) {
  await requireAdmin();
  const status = fd.get("status") === "active" ? "active" : "suspended";
  await db.update(trips).set({ status }).where(eq(trips.id, num(fd, "id")));
  revalidatePath("/admin/trajets");
  revalidatePath("/admin/signalements");
  revalidatePath("/");
}

export async function setUserSuspended(fd: FormData) {
  const admin = await requireAdmin();
  const id = num(fd, "id");
  if (id === admin.id) return;
  const suspended = fd.get("suspended") === "1";
  // Un compte supprimé par son titulaire reste bloqué.
  await db.update(users).set({ suspended }).where(and(eq(users.id, id), isNull(users.deletedAt)));
  if (suspended) await db.delete(sessions).where(eq(sessions.userId, id)); // déconnexion immédiate
  revalidatePath("/admin/utilisateurs");
  revalidatePath("/admin/signalements");
}

export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = num(fd, "id");
  const target = await db.query.users.findFirst({ where: eq(users.id, id), columns: { deletedAt: true } });
  if (!target || target.deletedAt) return { error: "Ce compte a été supprimé par son titulaire." };
  const temp = String(randomInt(10_000_000, 99_999_999));
  await db.update(users).set({ passwordHash: await hashPassword(temp) }).where(eq(users.id, id));
  await db.delete(sessions).where(eq(sessions.userId, id));
  return { ok: `Mot de passe temporaire : ${temp}. Donnez-le à la personne et demandez-lui de le changer dans « Mon compte ».` };
}

export async function deleteReview(fd: FormData) {
  await requireAdmin();
  await db.delete(reviews).where(eq(reviews.id, num(fd, "id")));
  revalidatePath("/admin/avis");
}

/* ------------------------------------------------------------------ */
/* Fiche « pièce d'identité » (réservée à l'admin)                     */
/* ------------------------------------------------------------------ */

const isoDate = z
  .string()
  .trim()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Date invalide.")
  .transform((v) => v || null);

const identitySchema = z.object({
  userId: z.coerce.number().int().positive(),
  fullName: z.string().trim().min(2, "Indiquez le nom et le prénom écrits sur la pièce.").max(120),
  birthDate: isoDate,
  docType: z.enum(ID_DOC_TYPES as [string, ...string[]], { errorMap: () => ({ message: "Choisissez le type de pièce." }) }),
  country: z.string().trim().max(60).default(""),
  docNumber: z
    .string()
    .trim()
    .max(40)
    .transform((v) => v.toUpperCase().replace(/\s+/g, " "))
    .default(""),
  expiresOn: isoDate,
  note: z.string().trim().max(500).default(""),
});

export type IdentityState = FormState & { values?: Record<string, string> };

export async function saveIdentity(_: IdentityState, fd: FormData): Promise<IdentityState> {
  const me = await requireAdmin();
  const raw = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const p = identitySchema.safeParse(raw);
  if (!p.success) return { error: p.error.issues[0].message, values: raw };
  const target = await db.query.users.findFirst({ where: eq(users.id, p.data.userId), columns: { id: true } });
  if (!target) return { error: "Utilisateur introuvable.", values: raw };
  const now = new Date();
  const data = { ...p.data, checkedBy: me.id, updatedAt: now };
  await db
    .insert(identityRecords)
    .values({ ...data, checkedAt: now })
    .onConflictDoUpdate({ target: identityRecords.userId, set: data });
  revalidatePath(`/admin/utilisateurs/${p.data.userId}/identite`);
  revalidatePath("/admin/utilisateurs");
  return { ok: "Fiche enregistrée." };
}

export async function deleteIdentity(fd: FormData) {
  await requireAdmin();
  const id = num(fd, "userId");
  await db.delete(identityRecords).where(eq(identityRecords.userId, id));
  revalidatePath(`/admin/utilisateurs/${id}/identite`);
  revalidatePath("/admin/utilisateurs");
}
