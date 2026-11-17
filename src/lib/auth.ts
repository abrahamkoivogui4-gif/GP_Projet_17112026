import "server-only";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { sessions, users, type User } from "@/db/schema";
import { SESSION_DAYS } from "./constants";

const COOKIE = "gp_session";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt });
  // Ménage des sessions expirées (léger, à chaque connexion)
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !process.env.ALLOW_INSECURE_COOKIE,
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  jar.delete(COOKIE);
}

export type SessionUser = Pick<User, "id" | "name" | "phone" | "role" | "verification" | "suspended">;

/** Utilisateur connecté (ou null). Mis en cache le temps d'une requête. */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      role: users.role,
      verification: users.verification,
      suspended: users.suspended,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const u = rows[0];
  if (!u || u.suspended) return null;
  return u;
});

/** Exige une connexion ; redirige vers /connexion sinon. */
export async function requireUser(next?: string) {
  const u = await getUser();
  if (!u) redirect(next ? `/connexion?suite=${encodeURIComponent(next)}` : "/connexion");
  return u;
}

export async function requireGp() {
  const u = await requireUser("/gp");
  if (u.role !== "gp" && u.role !== "admin") redirect("/compte?devenir=gp");
  return u;
}

export async function requireAdmin() {
  const u = await requireUser("/admin");
  if (u.role !== "admin") redirect("/");
  return u;
}
