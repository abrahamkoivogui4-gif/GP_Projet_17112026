import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireGp } from "@/lib/auth";
import { TripWizard } from "@/components/TripWizard";
import { todayIso } from "@/lib/format";
import { formatPhone } from "@/lib/phone";

export const metadata = { title: "Publier un trajet" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ pour?: string }> }) {
  const u = await requireGp();
  const pour = Number((await searchParams).pour) || 0;

  // Publication au nom d'un autre compte : réservée aux administrateurs.
  if (pour && u.role === "admin" && pour !== u.id) {
    const target = await db.query.users.findFirst({
      where: eq(users.id, pour),
      columns: { id: true, name: true, phone: true, role: true, suspended: true, deletedAt: true },
    });
    if (!target || target.deletedAt || target.suspended)
      return (
        <div className="card">
          <h1>Publication impossible</h1>
          <p>{!target || target.deletedAt ? "Ce compte n'existe plus." : "Ce compte est suspendu : réactivez-le avant de publier pour lui."}</p>
          <Link className="btn alt" href="/admin/utilisateurs">
            Retour aux utilisateurs
          </Link>
        </div>
      );
    return (
      <TripWizard
        today={todayIso()}
        forUser={{ id: target.id, name: target.name, phone: formatPhone(target.phone), isClient: target.role === "client" }}
      />
    );
  }

  return (
    <>
      {u.role === "admin" && (
        <p className="info">
          Pour publier au nom d&apos;un GP, passez par <Link href="/admin/utilisateurs">Admin → Utilisateurs</Link> → « Publier un trajet ».
        </p>
      )}
      <TripWizard today={todayIso()} />
    </>
  );
}
