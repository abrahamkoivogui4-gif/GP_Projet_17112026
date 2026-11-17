import { requireGp } from "@/lib/auth";
import { SubNav } from "@/components/Nav";

export default async function GpLayout({ children }: { children: React.ReactNode }) {
  await requireGp();
  return (
    <>
      <SubNav
        items={[
          { href: "/gp", label: "Mes trajets" },
          { href: "/gp/publier", label: "Publier un trajet" },
          { href: "/gp/demandes", label: "Demandes reçues" },
          { href: "/gp/verification", label: "Badge vérifié" },
        ]}
      />
      {children}
    </>
  );
}
