"use client";
import { useActionState, useState } from "react";
import { createReport } from "@/app/actions";
import type { FormState } from "@/app/auth-actions";
import { REPORT_TYPES } from "@/lib/constants";
import { SubmitButton } from "./SubmitButton";

export function ReportForm({ subjects, initialSubject }: { subjects: { value: string; label: string }[]; initialSubject?: string }) {
  const [state, action] = useActionState<FormState, FormData>(createReport, {});
  const [type, setType] = useState(state.values?.type ?? "");
  return (
    <form action={action} className="card" key={state.ok ? "sent" : "form"}>
      <h1>Signaler un problème</h1>
      <p className="tag">
        Colis perdu ou abîmé, personne injoignable, prix qui change, arnaque… Dites-nous ce qui s&apos;est passé. L&apos;équipe lit chaque signalement et la
        personne concernée ne voit pas votre nom.
      </p>
      {state.ok && <p className="info">{state.ok}</p>}
      <div className="field">
        <span className="label">Que s&apos;est-il passé ?</span>
        <input type="hidden" name="type" value={type} />
        <div className="chips">
          {REPORT_TYPES.map((t) => (
            <button key={t} type="button" className="chip" aria-pressed={type === t} onClick={() => setType(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor="subject">Qui ou quel trajet ?</label>
        <select id="subject" name="subject" defaultValue={state.values?.subject ?? initialSubject ?? ""}>
          <option value="">Choisissez…</option>
          {subjects.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {subjects.length === 0 && <p className="hint">Vous n&apos;avez encore aucune mise en relation. Ouvrez le trajet concerné et touchez « Signaler ce trajet ».</p>}
      </div>
      <div className="field">
        <label htmlFor="description">Racontez en quelques lignes</label>
        <textarea id="description" name="description" maxLength={2000} defaultValue={state.ok ? "" : state.values?.description} placeholder="Que s'est-il passé, quand, et qu'avez-vous déjà essayé ?" />
      </div>
      {state.error && <p className="err">{state.error}</p>}
      <SubmitButton>Envoyer le signalement</SubmitButton>
      <p className="warn">En cas de danger ou de vol, contactez aussi la police. En attendant notre réponse, ne remettez plus de colis à cette personne.</p>
    </form>
  );
}
