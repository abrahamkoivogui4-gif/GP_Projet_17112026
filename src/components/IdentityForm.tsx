"use client";
import { useActionState } from "react";
import { saveIdentity, type IdentityState } from "@/app/admin-actions";
import { ID_DOC_TYPES } from "@/lib/constants";
import { SubmitButton } from "./SubmitButton";

type Rec = { fullName: string; birthDate: string | null; docType: string; country: string; docNumber: string; expiresOn: string | null; note: string };

/** Formulaire de la fiche « pièce d'identité » (admin). */
export function IdentityForm({ userId, rec, suggestedName }: { userId: number; rec: Rec | null; suggestedName: string }) {
  const [state, action] = useActionState<IdentityState, FormData>(saveIdentity, {});
  const v = state.values ?? {};
  const val = (k: keyof Rec, d = "") => v[k] ?? (rec?.[k] as string | null) ?? d;

  return (
    <form action={action} className="card">
      <input type="hidden" name="userId" value={userId} />
      <div className="field">
        <label htmlFor="fullName">Nom et prénom (tels qu&apos;écrits sur la pièce)</label>
        <input id="fullName" name="fullName" type="text" required maxLength={120} defaultValue={val("fullName", suggestedName)} />
      </div>
      <div className="field">
        <label htmlFor="docType">Type de pièce</label>
        <select id="docType" name="docType" defaultValue={val("docType", ID_DOC_TYPES[0])}>
          {ID_DOC_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="docNumber">Numéro de la pièce</label>
        <input id="docNumber" name="docNumber" type="text" maxLength={40} autoComplete="off" defaultValue={val("docNumber")} />
      </div>
      <div className="row">
        <div className="field">
          <label htmlFor="birthDate">Date de naissance</label>
          <input id="birthDate" name="birthDate" type="date" defaultValue={val("birthDate")} />
        </div>
        <div className="field">
          <label htmlFor="expiresOn">Valable jusqu&apos;au</label>
          <input id="expiresOn" name="expiresOn" type="date" defaultValue={val("expiresOn")} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="country">Pays qui a délivré la pièce</label>
        <input id="country" name="country" type="text" maxLength={60} placeholder="Ex. Guinée, France" defaultValue={val("country")} />
      </div>
      <div className="field">
        <label htmlFor="note">Remarque (facultatif)</label>
        <textarea id="note" name="note" maxLength={500} placeholder="Ex. selfie conforme, nom d'usage différent…" defaultValue={val("note")} />
      </div>
      {state.error && (
        <p className="err" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && <p className="okmsg">{state.ok}</p>}
      <SubmitButton pendingText="Enregistrement…">{rec ? "Mettre à jour la fiche" : "Enregistrer la fiche"}</SubmitButton>
    </form>
  );
}
