import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { requests, trips } from "@/db/schema";
import type { SessionUser } from "./auth";

/** Charge une demande avec son trajet, et vérifie que l'utilisateur en fait partie. */
export async function loadRequestFor(u: SessionUser, id: number) {
  const rows = await db
    .select({ r: requests, t: trips })
    .from(requests)
    .innerJoin(trips, eq(trips.id, requests.tripId))
    .where(eq(requests.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const side = row.r.clientId === u.id ? "client" : row.t.gpId === u.id ? "gp" : u.role === "admin" ? "admin" : null;
  if (!side) return null;
  return { ...row, side } as const;
}

