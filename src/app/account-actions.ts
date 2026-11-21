"use server";
import { randomBytes } from "node:crypto";
import { and, eq, inArray, isNotNull, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { requests, sessions, trips, users, verificationDocs } from "@/db/schema";
import { destroySession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { rateLimit } from "@/lib/rate-limit";
import { deleteUpload } from "@/lib/uploads";
import type { FormState } from "./auth-actions";

/** Numéro de remplacement d'un compte supprimé : unique, et ne peut correspondre à aucun vrai numéro. */
const deletedPhone = (id: number) => `supprime-${id}`;

/**
 * Suppression du compte par son titulaire.
 * Les données personnelles sont effacées (nom, téléphone, e-mail, mot de passe, pièce d'identité,
 * coordonnées des destinataires). Les demandes, messages et avis restent pour l'historique de l'autre
 * personne, mais signés « Utilisateur supprimé ». Refusé tant qu'un envoi validé n'est pas terminé.
 */
export async function deleteAccount(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser("/compte");
  if (u.role === "admin") return { error: "Un compte administrateur ne peut pas être supprimé ici." };
  if (!rateLimit(`delete:${u.id}`, 5, 15 * 60_000)) return { error: "Trop de tentatives. Réessayez dans 15 minutes." };
  if (fd.get("confirm") !== "on") return { error: "Cochez la case pour confirmer." };
  const row = await db.query.users.findFirst({ where: eq(users.id, u.id) });
  if (!row || !(await verifyPassword(String(fd.get("password") ?? ""), row.passwordHash))) return { error: "Mot de passe incorrect." };

  // Envois validés mais pas encore livrés : on ne laisse pas l'autre personne sans contact.
  const ongoing = await db
    .select({ id: requests.id })
    .from(requests)
    .innerJoin(trips, eq(trips.id, requests.tripId))
    .where(and(eq(requests.status, "accepted"), or(eq(requests.clientId, u.id), eq(trips.gpId, u.id))));
  if (ongoing.length)
    return {
      error: `Vous avez ${ongoing.length > 1 ? `${ongoing.length} envois validés` : "1 envoi validé"} pas encore ${ongoing.length > 1 ? "livrés" : "livré"}. Terminez la livraison ou annulez la demande avant de supprimer votre compte.`,
    };

  const toNotify: { phone: string; text: string }[] = [];
  const files: string[] = [];
  await db.transaction(async (tx) => {
    // Demandes en attente envoyées par la personne : annulées, le GP est prévenu.
    const mine = await tx
      .select({ id: requests.id, gpPhone: users.phone, from: trips.fromCity, to: trips.toCity })
      .from(requests)
      .innerJoin(trips, eq(trips.id, requests.tripId))
      .innerJoin(users, eq(users.id, trips.gpId))
      .where(and(eq(requests.clientId, u.id), eq(requests.status, "pending")));
    // Demandes en attente reçues sur ses trajets : annulées, les clients sont prévenus.
    const received = await tx
      .select({ id: requests.id, clientPhone: users.phone, from: trips.fromCity, to: trips.toCity })
      .from(requests)
      .innerJoin(trips, eq(trips.id, requests.tripId))
      .innerJoin(users, eq(users.id, requests.clientId))
      .where(and(eq(trips.gpId, u.id), eq(requests.status, "pending")));
    const ids = [...mine.map((x) => x.id), ...received.map((x) => x.id)];
    if (ids.length) await tx.update(requests).set({ status: "cancelled", decidedAt: new Date() }).where(inArray(requests.id, ids));
    for (const x of mine) toNotify.push({ phone: x.gpPhone, text: `Une demande pour ${x.from} → ${x.to} a été annulée : le client a supprimé son compte.` });
    for (const x of received) toNotify.push({ phone: x.clientPhone, text: `Votre demande pour ${x.from} → ${x.to} a été annulée : le GP a supprimé son compte.` });

    // Trajets encore en ligne : annulés.
    await tx.update(trips).set({ status: "cancelled" }).where(and(eq(trips.gpId, u.id), eq(trips.status, "active")));

    // Pièces d'identité : fichiers et lignes supprimés.
    const docs = await tx
      .select({ filePath: verificationDocs.filePath })
      .from(verificationDocs)
      .where(and(eq(verificationDocs.userId, u.id), isNotNull(verificationDocs.filePath)));
    files.push(...docs.map((d) => d.filePath!));
    await tx.delete(verificationDocs).where(eq(verificationDocs.userId, u.id));

    // Coordonnées des destinataires de ses colis.
    await tx.update(requests).set({ recipientName: "", recipientPhone: "" }).where(eq(requests.clientId, u.id));

    // Le compte lui-même : anonymisé et bloqué.
    await tx
      .update(users)
      .set({
        name: "Utilisateur supprimé",
        phone: deletedPhone(u.id),
        passwordHash: await hashPassword(randomBytes(32).toString("hex")),
        recoveryHash: null,
        email: null,
        emailNotify: false,
        verification: "none",
        suspended: true,
        deletedAt: new Date(),
      })
      .where(eq(users.id, u.id));
  });

  for (const f of files) await deleteUpload(f);
  for (const n of toNotify) await notify(n.phone, n.text);
  await destroySession();
  await db.delete(sessions).where(eq(sessions.userId, u.id));
  redirect("/compte-supprime");
}
