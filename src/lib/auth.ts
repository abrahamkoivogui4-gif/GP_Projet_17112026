import "server-only";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, inArray, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { sessions, users, type User } from "@/db/schema";
import { SESSION_DAYS } from "./constants";

const COOKIE = "gp_session";
/** Tous les comptes connectés sur cet appareil (jetons séparés par des points), pour changer de compte. */
const ACCOUNTS = "gp_accounts";
const MODE = "gp_mode";
const MAX_ACCOUNTS = 5;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production" && !process.env.ALLOW_INSECURE_COOKIE,
    path: "/",
    expires,
  };
}

async function readTokens() {
  const jar = await cookies();
  return (jar.get(ACCOUNTS)?.value ?? "").split(".").filter((t) => /^[\w-]{20,}$/.test(t));
}

async function writeTokens(tokens: string[]) {
  const jar = await cookies();
  if (tokens.length) jar.set(ACCOUNTS, tokens.slice(0, MAX_ACCOUNTS).join("."), cookieOptions(new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000)));
  else jar.delete(ACCOUNTS);
}

export type SavedAccount = { token: string; id: number; name: string; phone: string; role: User["role"]; verification: User["verification"] };

/** Comptes encore valides enregistrés sur cet appareil (le compte actif compris), un seul par personne. */
export async function savedAccounts(): Promise<SavedAccount[]> {
  const jar = await cookies();
  const active = jar.get(COOKIE)?.value;
  const tokens = [...new Set([...(active ? [active] : []), ...(await readTokens())])];
  if (!tokens.length) return [];
  const rows = await db
    .select({ sid: sessions.id, id: users.id, name: users.name, phone: users.phone, role: users.role, verification: users.verification })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(inArray(sessions.id, tokens.map(sha256)), gt(sessions.expiresAt, new Date()), eq(users.suspended, false)));
  const bySid = new Map(rows.map((r) => [r.sid, r]));
  const seen = new Set<number>();
  const out: SavedAccount[] = [];
  for (const token of tokens) {
    const r = bySid.get(sha256(token));
    if (!r || seen.has(r.id)) continue;
    seen.add(r.id);
    out.push({ token, id: r.id, name: r.name, phone: r.phone, role: r.role, verification: r.verification });
  }
  return out;
}

/** Ouvre une session. Les autres comptes déjà connectés sur l'appareil restent disponibles dans le menu du profil. */
export async function createSession(userId: number) {
  const before = await savedAccounts();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt });
  // Ménage des sessions expirées (léger, à chaque connexion)
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  // Une ancienne session du même compte sur cet appareil est remplacée par la nouvelle.
  const stale = before.filter((a) => a.id === userId);
  if (stale.length) await db.delete(sessions).where(inArray(sessions.id, stale.map((a) => sha256(a.token))));
  const jar = await cookies();
  jar.set(COOKIE, token, cookieOptions(expiresAt));
  await writeTokens([token, ...before.filter((a) => a.id !== userId).map((a) => a.token)]);
  const u = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { role: true } });
  await setMode(u?.role === "gp" ? "gp" : "client");
}

/** Passe sur un autre compte déjà connecté sur cet appareil. */
export async function switchToAccount(userId: number) {
  const target = (await savedAccounts()).find((a) => a.id === userId);
  if (!target) return null;
  const jar = await cookies();
  jar.set(COOKIE, target.token, cookieOptions(new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000)));
  await setMode(target.role === "gp" ? "gp" : "client");
  return target;
}

/** Déconnecte le compte actif. S'il reste un autre compte sur l'appareil, il devient actif (renvoyé). */
export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  const rest = (await savedAccounts()).filter((a) => a.token !== token);
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  jar.delete(COOKIE);
  await writeTokens(rest.map((a) => a.token));
  const next = rest[0];
  if (next) {
    jar.set(COOKIE, next.token, cookieOptions(new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000)));
    await setMode(next.role === "gp" ? "gp" : "client");
  }
  return next ?? null;
}

export type Mode = "client" | "gp";

/** Profil actif : expéditeur (client) ou GP. Change le menu et la page d'accueil. */
export async function getMode(): Promise<Mode> {
  const jar = await cookies();
  return jar.get(MODE)?.value === "gp" ? "gp" : "client";
}

export async function setMode(mode: Mode) {
  const jar = await cookies();
  jar.set(MODE, mode, { sameSite: "lax", path: "/", maxAge: 365 * 24 * 3600 });
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
