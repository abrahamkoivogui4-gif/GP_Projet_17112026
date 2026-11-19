import { requireGp } from "@/lib/auth";

// Le menu GP (Mes trajets, Publier, Demandes reçues, Colis en attente) est dans l'en-tête.
export default async function GpLayout({ children }: { children: React.ReactNode }) {
  await requireGp();
  return <>{children}</>;
}
