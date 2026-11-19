"use server";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { createSession, destroySession, hashPassword, requireUser, setMode, switchToAccount, verifyPassword } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";
import { newRecoveryCode, normalizeRecoveryCode, RECOVERY_LENGTH } from "@/lib/recovery";

// `code` : code de récupération à afficher une seule fois. `next` : page où continuer ensuite.
export type FormState = { error?: string; ok?: string; values?: Record<string, string>; code?: string; next?: string };

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
}

function safeNext(next: FormDataEntryValue | null) {
  const s = typeof next === "string" ? next : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : null;
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const cc = String(fd.get("cc") ?? "");
  const national = String(fd.get("phone") ?? "");
  const password = String(fd.get("password") ?? "");
  const values = { cc, phone: national };
  const phone = normalizePhone(cc, national);
  if (!phone) return { error: "Entrez un numéro de téléphone valide.", values };

  const ip = await clientIp();
  if (!rateLimit(`login:${ip}`, 20, 15 * 60_000) || !rateLimit(`login:${phone}`, 8, 15 * 60_000))
    return { error: "Trop de tentatives. Réessayez dans 15 minutes.", values };

  const u = await db.query.users.findFirst({ where: eq(users.phone, phone) });
  if (!u || !(await verifyPassword(password, u.passwordHash)))
    return { error: "Numéro ou mot de passe incorrect.", values };
  if (u.suspended) return { error: "Ce compte est suspendu. Contactez l'équipe.", values };

  await createSession(u.id);
  redirect(safeNext(fd.get("suite")) ?? (u.role === "admin" ? "/admin" : u.role === "gp" ? "/gp" : "/"));
}

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Entrez votre prénom et votre nom.").max(60, "Nom trop long."),
    role: z.enum(["client", "gp"]),
    password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères.").max(100),
    password2: z.string(),
  })
  .refine((v) => v.password === v.password2, { message: "Les deux mots de passe ne sont pas identiques." });

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const cc = String(fd.get("cc") ?? "");
  const national = String(fd.get("phone") ?? "");
  const values = { cc, phone: national, name: String(fd.get("name") ?? ""), role: String(fd.get("role") ?? "client") };
  const parsed = registerSchema.safeParse({
    name: fd.get("name"),
    role: fd.get("role"),
    password: fd.get("password"),
    password2: fd.get("password2"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };
  const phone = normalizePhone(cc, national);
  if (!phone) return { error: "Entrez un numéro de téléphone valide.", values };

  const ip = await clientIp();
  if (!rateLimit(`register:${ip}`, 10, 60 * 60_000)) return { error: "Trop d'inscriptions depuis cet appareil. Réessayez plus tard.", values };

  const exists = await db.query.users.findFirst({ where: eq(users.phone, phone), columns: { id: true } });
  if (exists) return { error: "Ce numéro a déjà un compte. Connectez-vous.", values };

  const code = newRecoveryCode();
  const [u] = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      phone,
      role: parsed.data.role,
      passwordHash: await hashPassword(parsed.data.password),
      recoveryHash: await hashPassword(normalizeRecoveryCode(code)),
    })
    .returning({ id: users.id });
  await createSession(u.id);
  // Le code de récupération est affiché une seule fois, avant de continuer.
  return { code, next: safeNext(fd.get("suite")) ?? (parsed.data.role === "gp" ? "/gp" : "/") };
}

let dummyHash: Promise<string> | undefined;

/** Mot de passe oublié : numéro + code de récupération + nouveau mot de passe. */
export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  const cc = String(fd.get("cc") ?? "");
  const national = String(fd.get("phone") ?? "");
  const values = { cc, phone: national };
  const password = String(fd.get("password") ?? "");
  if (password.length < 6) return { error: "Le mot de passe doit faire au moins 6 caractères.", values };
  if (password !== String(fd.get("password2") ?? "")) return { error: "Les deux mots de passe ne sont pas identiques.", values };
  const phone = normalizePhone(cc, national);
  if (!phone) return { error: "Entrez un numéro de téléphone valide.", values };

  const ip = await clientIp();
  if (!rateLimit(`reset:${ip}`, 10, 15 * 60_000) || !rateLimit(`reset:${phone}`, 5, 15 * 60_000))
    return { error: "Trop de tentatives. Réessayez dans 15 minutes.", values };

  const code = normalizeRecoveryCode(String(fd.get("code") ?? ""));
  const u = await db.query.users.findFirst({ where: eq(users.phone, phone) });
  // Même message et même durée de calcul que le numéro existe ou non.
  const hash = u?.recoveryHash ?? (await (dummyHash ??= hashPassword("lilalink")));
  const valid = (await verifyPassword(code, hash)) && !!u?.recoveryHash && code.length === RECOVERY_LENGTH;
  if (!u || !valid) return { error: "Numéro ou code de récupération incorrect.", values };
  if (u.suspended) return { error: "Ce compte est suspendu. Contactez l'équipe.", values };

  // Le code ne sert qu'une fois : on en crée un nouveau, et on déconnecte les anciens appareils.
  const fresh = newRecoveryCode();
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password), recoveryHash: await hashPassword(normalizeRecoveryCode(fresh)) })
    .where(eq(users.id, u.id));
  await db.delete(sessions).where(eq(sessions.userId, u.id));
  await createSession(u.id);
  return { code: fresh, next: u.role === "admin" ? "/admin" : u.role === "gp" ? "/gp" : "/" };
}

/** Depuis « Mon compte » : crée un nouveau code de récupération (l'ancien ne marche plus). */
export async function regenerateRecovery(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser("/compte");
  if (!rateLimit(`recovery:${u.id}`, 5, 15 * 60_000)) return { error: "Trop de tentatives. Réessayez dans 15 minutes." };
  const row = await db.query.users.findFirst({ where: eq(users.id, u.id) });
  if (!row || !(await verifyPassword(String(fd.get("password") ?? ""), row.passwordHash))) return { error: "Mot de passe incorrect." };
  const code = newRecoveryCode();
  await db.update(users).set({ recoveryHash: await hashPassword(normalizeRecoveryCode(code)) }).where(eq(users.id, u.id));
  return { code };
}

export async function logout() {
  const next = await destroySession();
  // S'il reste un autre compte connecté sur l'appareil, on passe dessus ; sinon retour à la connexion.
  redirect(next ? (next.role === "admin" ? "/admin" : next.role === "gp" ? "/gp" : "/") : "/connexion");
}

/** Menu du profil : passer sur un autre compte déjà connecté sur cet appareil. */
export async function switchAccount(fd: FormData) {
  const target = await switchToAccount(Number(fd.get("userId")));
  if (!target) redirect("/connexion?ajout=1");
  redirect(target.role === "admin" ? "/admin" : target.role === "gp" ? "/gp" : "/");
}

/** Menu du profil : passer du profil expéditeur au profil GP (et inversement). */
export async function switchMode(fd: FormData) {
  const u = await requireUser();
  if (fd.get("mode") === "gp") {
    if (u.role === "client") await db.update(users).set({ role: "gp" }).where(eq(users.id, u.id));
    await setMode("gp");
    redirect("/gp");
  }
  await setMode("client");
  redirect("/");
}

export async function becomeGp() {
  const u = await requireUser();
  if (u.role === "client") await db.update(users).set({ role: "gp" }).where(eq(users.id, u.id));
  await setMode("gp");
  redirect("/gp");
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next.length < 6) return { error: "Le nouveau mot de passe doit faire au moins 6 caractères." };
  const row = await db.query.users.findFirst({ where: eq(users.id, u.id) });
  if (!row || !(await verifyPassword(current, row.passwordHash))) return { error: "Mot de passe actuel incorrect." };
  await db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, u.id));
  return { ok: "Mot de passe modifié." };
}
