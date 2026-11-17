import { eq } from "drizzle-orm";
import { db } from "@/db";
import { verificationDocs } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { readUpload } from "@/lib/uploads";

export const dynamic = "force-dynamic";

/** Affiche la pièce d'identité, uniquement pour un administrateur connecté. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getUser();
  if (!u || u.role !== "admin") return new Response("Accès refusé", { status: 403 });
  const doc = await db.query.verificationDocs.findFirst({ where: eq(verificationDocs.id, Number((await params).id) || 0) });
  if (!doc?.filePath) return new Response("Fichier introuvable ou déjà supprimé", { status: 404 });
  const data = await readUpload(doc.filePath);
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": "inline",
      "Cache-Control": "no-store, private",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
    },
  });
}
