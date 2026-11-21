"use client";
import { useActionState, useState } from "react";
import { deleteAccount } from "@/app/account-actions";
import type { FormState } from "@/app/auth-actions";
import { SubmitButton } from "./SubmitButton";

/** Suppression du compte : expliquée, puis confirmée par le mot de passe et une case à cocher. */
export function DeleteAccountForm({ isGp }: { isGp: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(deleteAccount, {});
  const [open, setOpen] = useState(false);
  const [ok, setOk] = useState(false);
  return (
    <div className="card danger-zone" id="supprimer">
      <h2>Supprimer mon compte</h2>
      {!open ? (
        <>
          <p className="tag">Vous pourrez toujours recréer un compte plus tard avec le même numéro.</p>
          <button type="button" className="btn no" onClick={() => setOpen(true)}>
            Supprimer mon compte
          </button>
        </>
      ) : (
        <form action={action} className="stack">
          <div className="note bad">
            <b>Ce qui sera supprimé, définitivement</b>
            Votre nom, votre numéro de téléphone, votre adresse e-mail, votre mot de passe, votre pièce d&apos;identité et les coordonnées des
            destinataires de vos colis. Vos demandes en attente seront annulées
            {isGp ? " et vos trajets en ligne seront retirés" : ""}.
          </div>
          <div className="note">
            <b>Ce qui reste, sans votre nom</b>
            Vos anciens échanges et avis restent visibles pour les autres personnes concernées, signés « Utilisateur supprimé ».
          </div>
          <div className="field">
            <label htmlFor="del-pw">Votre mot de passe</label>
            <input id="del-pw" name="password" type="password" autoComplete="current-password" required />
          </div>
          <label className="check">
            <input type="checkbox" name="confirm" checked={ok} onChange={(e) => setOk(e.target.checked)} />
            <span>Je comprends que la suppression est définitive.</span>
          </label>
          {state.error && <p className="err">{state.error}</p>}
          <SubmitButton className="btn no" disabled={!ok} pendingText="Suppression…">
            Supprimer définitivement mon compte
          </SubmitButton>
          <button type="button" className="link" onClick={() => setOpen(false)}>
            Annuler
          </button>
        </form>
      )}
    </div>
  );
}
