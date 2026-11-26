import "server-only";
import { and, inArray, isNotNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { identityRecords, users } from "@/db/schema";
import { IDENTITY_KEEP_DAYS } from "./constants";

/** Compare deux noms sans tenir compte des accents, majuscules, tirets ni de l'ordre des mots. */
export function sameName(a: string, b: string) {
  const words = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z ]+/g, " ")
      .split(" ")
      .filter((w) => w.length > 1)
      .sort()
      .join(" ");
  return words(a) === words(b);
}

/** Efface les fiches des comptes supprimés depuis plus d'un an. */
export async function purgeOldIdentities() {
  const limit = new Date(Date.now() - IDENTITY_KEEP_DAYS * 24 * 3600_000);
  const old = db.select({ id: users.id }).from(users).where(and(isNotNull(users.deletedAt), lt(users.deletedAt, limit)));
  await db.delete(identityRecords).where(inArray(identityRecords.userId, old));
}
