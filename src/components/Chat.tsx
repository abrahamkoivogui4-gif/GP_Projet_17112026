"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/app/actions";

type Msg = { id: number; senderId: number; body: string; createdAt: string };

const QUICK = ["Où se retrouve-t-on ?", "Quand puis-je déposer le colis ?", "Le prix est bien celui de l'annonce ?"];

export function Chat(p: { requestId: number; meId: number; otherName: string; initial: Msg[]; canWrite: boolean; status: string; quick?: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>(p.initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const lastStatus = useRef(p.status);

  const refresh = useCallback(async () => {
    const after = msgs.length ? msgs[msgs.length - 1].id : 0;
    try {
      const res = await fetch(`/api/demandes/${p.requestId}/messages?apres=${after}`, { cache: "no-store" });
      if (!res.ok) return;
      const data: { messages: Msg[]; status: string } = await res.json();
      if (data.messages.length) setMsgs((m) => [...m, ...data.messages.filter((x) => !m.some((y) => y.id === x.id))]);
      if (data.status !== lastStatus.current) {
        lastStatus.current = data.status;
        router.refresh(); // le statut a changé (acceptée, refusée…) : on recharge la page
      }
    } catch {
      /* réseau indisponible : on réessaiera */
    }
  }, [msgs, p.requestId, router]);

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 5000);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [msgs.length]);

  async function send(body: string) {
    if (!body.trim() || busy) return;
    setBusy(true);
    const r = await sendMessage(p.requestId, body);
    setBusy(false);
    if (r.ok) {
      setText("");
      refresh();
    }
  }

  return (
    <section className="chat">
      <h3>Discussion avec {p.otherName}</h3>
      <div className="bubbles" ref={box} aria-live="polite">
        {msgs.length === 0 && <p className="tag">Aucun message pour l&apos;instant.</p>}
        {msgs.map((m) => {
          const mine = m.senderId === p.meId;
          return (
            <div key={m.id} className={`bub ${mine ? "me" : "them"}`}>
              <small>
                {mine ? "Vous" : p.otherName} ·{" "}
                {new Date(m.createdAt).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </small>
              {m.body}
            </div>
          );
        })}
      </div>
      {p.canWrite ? (
        <>
          {p.quick && (
            <div className="qr">
              {QUICK.map((q) => (
                <button key={q} type="button" onClick={() => send(q)} disabled={busy}>
                  {q}
                </button>
              ))}
            </div>
          )}
          <form
            className="send"
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
          >
            <input type="text" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Écrivez votre message" aria-label={`Message pour ${p.otherName}`} />
            <button className="btn small" type="submit" disabled={busy || !text.trim()}>
              Envoyer
            </button>
          </form>
        </>
      ) : (
        <p className="tag">La discussion est fermée pour cette demande.</p>
      )}
    </section>
  );
}
