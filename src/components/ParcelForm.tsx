"use client";
import { useActionState, useState } from "react";
import { createParcel } from "@/app/parcel-actions";
import type { FormState } from "@/app/auth-actions";
import { CATEGORIES, CITIES, MAX_KG } from "@/lib/constants";
import { SubmitButton } from "./SubmitButton";

/** Demande d'envoi sans trajet : l'expéditeur dit ce qu'il veut envoyer, les GP lui proposent un trajet. */
export function ParcelForm({ from = "", to = "", today }: { from?: string; to?: string; today: string }) {
  const [state, action] = useActionState<FormState, FormData>(createParcel, {});
  const v = state.values ?? {};
  const [kg, setKg] = useState(Number(v.weightKg) || 5);

  return (
    <form action={action} className="card">
      <div>
        <h1>Envoyer un colis</h1>
        <p className="lead">Pas de trajet disponible ? Déposez votre demande : les GP la voient et vous proposent leur trajet.</p>
      </div>
      <input type="hidden" name="weightKg" value={kg} />
      <div className="row">
        <div className="field">
          <label htmlFor="fromCity">Ville de départ</label>
          <select id="fromCity" name="fromCity" required defaultValue={v.fromCity ?? from}>
            <option value="">Choisir…</option>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="toCity">Destination</label>
          <select id="toCity" name="toCity" required defaultValue={v.toCity ?? to}>
            <option value="">Choisir…</option>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="beforeDate">Le colis doit partir avant le (facultatif)</label>
        <input id="beforeDate" name="beforeDate" type="date" min={today} defaultValue={v.beforeDate} />
        <p className="hint">Laissez vide si vous n&apos;êtes pas pressé.</p>
      </div>
      <div className="field">
        <span className="label">Poids de votre colis</span>
        <div className="stepper">
          <button type="button" aria-label="Moins" onClick={() => setKg(Math.max(1, kg - 1))}>
            −
          </button>
          <output>
            {kg} <small>kg</small>
          </output>
          <button type="button" aria-label="Plus" onClick={() => setKg(Math.min(MAX_KG, kg + 1))}>
            +
          </button>
        </div>
      </div>
      <div className="field">
        <label htmlFor="category">Type de colis</label>
        <select id="category" name="category" defaultValue={v.category ?? "Vêtements"}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="description">Décrivez votre colis (facultatif)</label>
        <textarea id="description" name="description" maxLength={500} defaultValue={v.description} placeholder="Ex. : un carton de vêtements pour la famille, pas de liquide." />
      </div>
      <p className="info">📲 Vous serez prévenu sur WhatsApp dès qu&apos;un GP vous propose un trajet ou publie un trajet qui correspond.</p>
      {state.error && (
        <p className="err" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton pendingText="Envoi…">Déposer ma demande</SubmitButton>
      <p className="tag">Votre numéro n&apos;est pas montré aux GP. Il ne sera partagé qu&apos;avec le GP que vous aurez choisi, une fois votre colis accepté.</p>
    </form>
  );
}
