"use client";
import { useActionState, useState } from "react";
import { createRequest } from "@/app/actions";
import type { FormState } from "@/app/auth-actions";
import { CATEGORIES, COUNTRY_CODES } from "@/lib/constants";
import { SubmitButton } from "./SubmitButton";

type Prefill = { id: number; weightKg: number; category: string; description: string };

export function RequestForm(p: { tripId: number; gpName: string; price: number; free: number; forbidden: string[]; defaultCc: string; parcel?: Prefill }) {
  const [state, action] = useActionState<FormState, FormData>(createRequest, {});
  const [kg, setKg] = useState(Math.min(p.parcel?.weightKg ?? 5, p.free));
  const [ok, setOk] = useState(false);

  return (
    <form action={action} className="card">
      <h2>Demander {p.gpName}</h2>
      <input type="hidden" name="tripId" value={p.tripId} />
      {p.parcel && <input type="hidden" name="parcelId" value={p.parcel.id} />}
      {p.parcel && <p className="info">Les informations de votre demande d&apos;envoi sont déjà remplies. Vérifiez-les, puis ajoutez le destinataire.</p>}
      <input type="hidden" name="weightKg" value={kg} />
      <div className="field">
        <span className="label">Poids de votre colis</span>
        <div className="stepper">
          <button type="button" aria-label="Moins" onClick={() => setKg(Math.max(1, kg - 1))}>
            −
          </button>
          <output>
            {kg} <small>kg</small>
          </output>
          <button type="button" aria-label="Plus" onClick={() => setKg(Math.min(p.free, kg + 1))}>
            +
          </button>
        </div>
        <p className="hint" style={{ textAlign: "center" }}>
          {p.free} kg disponibles au maximum
        </p>
      </div>
      <div className="total">
        <span>
          Total estimé
          <br />
          <small className="tag">
            {kg} kg × {p.price} €
          </small>
        </span>
        <b>{(kg * p.price).toLocaleString("fr-FR")} €</b>
      </div>
      <div className="field">
        <label htmlFor="category">Type de colis</label>
        <select id="category" name="category" defaultValue={p.parcel?.category ?? "Vêtements"}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="description">Décrivez votre colis (facultatif)</label>
        <textarea id="description" name="description" maxLength={500} defaultValue={p.parcel?.description} placeholder="Ex. : un sac fermé avec des vêtements et des chaussures, pas de liquide." />
      </div>
      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0, gap: 10 }}>
        <legend className="label">Qui reçoit le colis à l&apos;arrivée ?</legend>
        <p className="hint" style={{ marginTop: 0 }}>
          Vous recevrez un code de livraison à lui transmettre. Le GP lui demandera ce code au moment de la remise.
        </p>
        <div className="field">
          <label htmlFor="recipientName">Nom du destinataire</label>
          <input id="recipientName" name="recipientName" type="text" required maxLength={60} placeholder="Ex. Fatou Camara" />
        </div>
        <div className="field">
          <label htmlFor="recipientPhone">Téléphone du destinataire</label>
          <div className="phone">
            <select name="recipientCc" aria-label="Indicatif du pays du destinataire" defaultValue={p.defaultCc}>
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <input id="recipientPhone" name="recipientPhone" type="tel" inputMode="tel" required placeholder="620 12 34 56" />
          </div>
        </div>
      </fieldset>
      {p.forbidden.length > 0 && (
        <div className="note bad">
          <b>{p.gpName} refuse</b>
          {p.forbidden.join(" · ")}
        </div>
      )}
      <label className="check">
        <input type="checkbox" name="confirm" checked={ok} onChange={(e) => setOk(e.target.checked)} />
        <span>Je confirme que mon colis ne contient aucun de ces objets, ni aucun produit illégal.</span>
      </label>
      {state.error && (
        <p className="err" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton disabled={!ok} pendingText="Envoi…">
        Envoyer ma demande
      </SubmitButton>
      <p className="tag">Le paiement se fait directement avec le GP, à la remise du colis.</p>
    </form>
  );
}
