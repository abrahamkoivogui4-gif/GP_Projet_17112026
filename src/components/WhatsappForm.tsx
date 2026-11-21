"use client";
import { useActionState, useState } from "react";
import { saveWhatsappSettings, sendWhatsappTest } from "@/app/actions";
import type { FormState } from "@/app/auth-actions";
import { COUNTRY_CODES } from "@/lib/constants";
import { SubmitButton } from "./SubmitButton";

/** Réglage du GP : recevoir (ou non) un WhatsApp à chaque nouvelle demande, et sur quel numéro. */
export function WhatsappForm({ enabled, cc, phone, configured }: { enabled: boolean; cc: string; phone: string; configured: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(saveWhatsappSettings, {});
  const [test, testAction] = useActionState<FormState, FormData>(sendWhatsappTest, {});
  const [on, setOn] = useState(enabled);
  return (
    <div className="card" id="whatsapp">
      <form action={action} className="wa">
        <h2>Notifications WhatsApp</h2>
        <p className="tag">Soyez prévenu sur WhatsApp dès qu&apos;un client vous envoie une demande, pour lui répondre vite.</p>
        <label className="check">
          <input type="checkbox" name="enabled" checked={on} onChange={(e) => setOn(e.target.checked)} />
          <span>Recevoir un WhatsApp à chaque nouvelle demande</span>
        </label>
        {on && (
          <div className="field">
            <label htmlFor="wa-phone">Numéro WhatsApp</label>
            <div className="phone">
              <select name="cc" aria-label="Indicatif du pays" defaultValue={state.values?.cc ?? cc}>
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input id="wa-phone" name="phone" type="tel" inputMode="tel" required defaultValue={state.values?.phone ?? phone} placeholder="06 12 34 56 78" />
            </div>
            <p className="hint">Par défaut, le numéro de votre compte. Changez-le si votre WhatsApp est sur un autre numéro.</p>
          </div>
        )}
        {state.error && <p className="err">{state.error}</p>}
        {state.ok && <p className="okmsg">{state.ok}</p>}
        <SubmitButton className="btn alt">Enregistrer</SubmitButton>
      </form>
      {enabled && configured && (
        <form action={testAction}>
          {test.error && <p className="err">{test.error}</p>}
          {test.ok && <p className="okmsg">{test.ok}</p>}
          <SubmitButton className="link" pendingText="Envoi…">
            M&apos;envoyer un message d&apos;essai
          </SubmitButton>
        </form>
      )}
      {!configured && <p className="hint">Les envois WhatsApp seront actifs dès leur mise en service par l&apos;équipe Lilalink. Votre choix est déjà pris en compte.</p>}
    </div>
  );
}
