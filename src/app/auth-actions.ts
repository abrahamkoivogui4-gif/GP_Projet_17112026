"use server";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";

export type FormState = { error?: string; ok?: string; values?: Record<string, string> };

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

  const [u] = await db
    .insert(users)
    .values({ name: parsed.data.name, phone, role: parsed.data.role, passwordHash: await hashPassword(parsed.data.password) })
    .returning({ id: users.id });
  await createSession(u.id);
  redirect(safeNext(fd.get("suite")) ?? (parsed.data.role === "gp" ? "/gp" : "/"));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function becomeGp() {
  const u = await requireUser();
  if (u.role === "client") await db.update(users).set({ role: "gp" }).where(eq(users.id, u.id));
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
