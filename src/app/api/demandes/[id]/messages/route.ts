import { NextResponse } from "next/server";
import { and, asc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { loadRequestFor } from "@/lib/requests";

export const dynamic = "force-dynamic";

/** Messages d'une demande (lecture par le client, le GP ou l'admin). ?apres=<id> pour ne récupérer que les nouveaux. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getUser();
  if (!u) return NextResponse.json({ error: "non connecté" }, { status: 401 });
  const row = await loadRequestFor(u, Number((await params).id) || 0);
  if (!row) return NextResponse.json({ error: "introuvable" }, { status: 404 });
  const after = Number(new URL(req.url).searchParams.get("apres")) || 0;
  const list = await db
    .select({ id: messages.id, senderId: messages.senderId, body: messages.body, createdAt: messages.createdAt })
    .from(messages)
    .where(and(eq(messages.requestId, row.r.id), gt(messages.id, after)))
    .orderBy(asc(messages.id))
    .limit(200);
  return NextResponse.json({ messages: list, status: row.r.status });
}
