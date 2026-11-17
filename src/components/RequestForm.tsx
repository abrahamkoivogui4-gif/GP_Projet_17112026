"use client";
import { useActionState, useState } from "react";
import { createRequest } from "@/app/actions";
import type { FormState } from "@/app/auth-actions";
import { CATEGORIES } from "@/lib/constants";
import { SubmitButton } from "./SubmitButton";

export function RequestForm(p: { tripId: number; gpName: string; price: number; free: number; forbidden: string[] }) {
  const [state, action] = useActionState<FormState, FormData>(createRequest, {});
  const [kg, setKg] = useState(Math.min(5, p.free));
  const [ok, setOk] = useState(false);

  return (
    <form action={action} className="card">
      <h2>Demander {p.gpName}</h2>
      <input type="hidden" name="tripId" value={p.tripId} />
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
        <select id="category" name="category" defaultValue="Vêtements">
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="description">Décrivez votre colis (facultatif)</label>
        <textarea id="description" name="description" maxLength={500} placeholder="Ex. : un sac fermé avec des vêtements et des chaussures, pas de liquide." />
      </div>
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
