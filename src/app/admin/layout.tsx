import { requireAdmin } from "@/lib/auth";
import { SubNav } from "@/components/Nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <SubNav
        items={[
          { href: "/admin", label: "Tableau de bord" },
          { href: "/admin/verifications", label: "Vérifications" },
          { href: "/admin/signalements", label: "Signalements" },
          { href: "/admin/trajets", label: "Trajets" },
          { href: "/admin/demandes", label: "Demandes" },
          { href: "/admin/utilisateurs", label: "Utilisateurs" },
          { href: "/admin/avis", label: "Avis" },
        ]}
      />
      {children}
    </>
  );
}
