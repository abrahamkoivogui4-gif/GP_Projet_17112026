"use client";
import { useActionState, useState } from "react";
import { saveEmailSettings, sendEmailTest } from "@/app/actions";
import type { FormState } from "@/app/auth-actions";
import { SubmitButton } from "./SubmitButton";

/** Réglage du GP : recevoir (ou non) un e-mail à chaque nouvelle demande. */
export function EmailNotifyForm({ enabled, email }: { enabled: boolean; email: string }) {
  const [state, action] = useActionState<FormState, FormData>(saveEmailSettings, {});
  const [test, testAction] = useActionState<FormState, FormData>(sendEmailTest, {});
  const [on, setOn] = useState(enabled);
  return (
    <div className="card" id="notifications">
      <form action={action} className="stack">
        <h2>Être prévenu par e-mail</h2>
        <p className="tag">Recevez un e-mail dès qu&apos;un client vous envoie une demande, pour lui répondre vite.</p>
        <label className="check">
          <input type="checkbox" name="enabled" checked={on} onChange={(e) => setOn(e.target.checked)} />
          <span>Recevoir un e-mail à chaque nouvelle demande</span>
        </label>
        {on && (
          <div className="field">
            <label htmlFor="notif-email">Adresse e-mail</label>
            <input
              id="notif-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              maxLength={120}
              defaultValue={state.values?.email ?? email}
              placeholder="vous@exemple.com"
            />
          </div>
        )}
        {state.error && <p className="err">{state.error}</p>}
        {state.ok && <p className="okmsg">{state.ok}</p>}
        <SubmitButton className="btn alt">Enregistrer</SubmitButton>
      </form>
      {enabled && (
        <form action={testAction}>
          {test.error && <p className="err">{test.error}</p>}
          {test.ok && <p className="okmsg">{test.ok}</p>}
          <SubmitButton className="link" pendingText="Envoi…">
            M&apos;envoyer un e-mail d&apos;essai
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
