import { desc, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { dateTime } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { setUserSuspended } from "@/app/admin-actions";
import { ResetPasswordButton } from "@/components/ResetPasswordButton";
import { SubmitButton } from "@/components/SubmitButton";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export const metadata = { title: "Utilisateurs" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const me = await requireAdmin();
  const q = ((await searchParams).q ?? "").trim().slice(0, 50);
  const digits = q.replace(/\D/g, "").replace(/^0+/, "");
  const where = q
    ? or(ilike(users.name, `%${q.replace(/[%_]/g, "")}%`), ...(digits.length >= 3 ? [ilike(users.phone, `%${digits}%`)] : []))
    : undefined;
  const rows = await db.select().from(users).where(where).orderBy(desc(users.createdAt)).limit(100);

  return (
    <div className="card">
      <h1>Utilisateurs</h1>
      <form method="get" className="send">
        <input type="text" name="q" defaultValue={q} placeholder="Nom ou numéro de téléphone" aria-label="Rechercher un utilisateur" />
        <button className="btn small" type="submit">
          Chercher
        </button>
      </form>
      {rows.map((u) => (
        <div className="arow" key={u.id}>
          <div>
            <b>{u.name}</b> {u.verification === "verified" && <VerifiedBadge />} {u.deletedAt ? <span className="pill cancelled">Compte supprimé</span> : u.suspended && <span className="pill suspended">Suspendu</span>}
            <small>
              {u.deletedAt ? "—" : formatPhone(u.phone)} · {u.role === "admin" ? "Admin" : u.role === "gp" ? "GP" : "Client"} · inscrit le {dateTime(u.createdAt)}
            </small>
          </div>
          {u.id !== me.id && !u.deletedAt && (
            <>
              <ResetPasswordButton id={u.id} />
              <form action={setUserSuspended}>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="suspended" value={u.suspended ? "0" : "1"} />
                <SubmitButton className={`btn small ${u.suspended ? "alt" : "no"}`}>{u.suspended ? "Réactiver" : "Suspendre"}</SubmitButton>
              </form>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
