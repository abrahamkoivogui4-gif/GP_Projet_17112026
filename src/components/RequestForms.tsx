"use client";
import { Fragment, useActionState } from "react";
import { confirmDelivery, decideRequest, postReview } from "@/app/actions";
import type { FormState } from "@/app/auth-actions";
import { SubmitButton } from "./SubmitButton";

export function DecisionForm({ id, acceptLabel, canAccept = true }: { id: number; acceptLabel?: string; canAccept?: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(decideRequest, {});
  return (
    <form action={action} className="card" style={{ padding: 0, border: 0 }}>
      <input type="hidden" name="id" value={id} />
      <div className="field">
        <label htmlFor={`note${id}`}>Votre message au client (facultatif)</label>
        <textarea
          id={`note${id}`}
          name="note"
          maxLength={500}
          placeholder="Ex. : OK pour ce colis, merci de le fermer et d'éviter les liquides. / Désolé, je n'ai plus de place."
        />
      </div>
      {state.error && <p className="err">{state.error}</p>}
      {state.ok && <p className="okmsg">{state.ok}</p>}
      <div className="row">
        {canAccept && (
          <SubmitButton name="decision" value="accept">
            {acceptLabel ?? "Accepter"}
          </SubmitButton>
        )}
        <SubmitButton name="decision" value="refuse" className="btn no">
          Refuser
        </SubmitButton>
      </div>
    </form>
  );
}

export function ReviewForm({ id, gpName }: { id: number; gpName: string }) {
  const [state, action] = useActionState<FormState, FormData>(postReview, {});
  if (state.ok) return <p className="okmsg">{state.ok}</p>;
  return (
    <form action={action} className="card" style={{ padding: 0, border: 0 }}>
      <input type="hidden" name="id" value={id} />
      <p>
        <b>Le colis est livré.</b> Notez {gpName} pour aider les autres clients.
      </p>
      <fieldset className="stars" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="vh">Note sur 5</legend>
        {[5, 4, 3, 2, 1].map((n) => (
          <Fragment key={n}>
            <input className="vh" type="radio" name="stars" id={`s${id}-${n}`} value={n} />
            <label htmlFor={`s${id}-${n}`} aria-label={`${n} étoile${n > 1 ? "s" : ""}`}>
              ★
            </label>
          </Fragment>
        ))}
      </fieldset>
      <div className="field">
        <label htmlFor={`c${id}`}>Votre avis (facultatif)</label>
        <textarea id={`c${id}`} name="comment" maxLength={500} placeholder="Comment s'est passée la remise ?" />
      </div>
      {state.error && <p className="err">{state.error}</p>}
      <SubmitButton>Publier mon avis</SubmitButton>
    </form>
  );
}

export function DeliveryCodeForm({ id, recipient }: { id: number; recipient: string }) {
  const [state, action] = useActionState<FormState, FormData>(confirmDelivery, {});
  return (
    <form action={action} className="codebox">
      <input type="hidden" name="id" value={id} />
      <b>Valider la livraison</b>
      <span>Au moment de la remise, demandez à {recipient} le code de livraison à 6 chiffres et tapez-le ici.</span>
      <label htmlFor={`code${id}`} className="vh">
        Code de livraison
      </label>
      <input
        id={`code${id}`}
        name="code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]{6,7}"
        maxLength={7}
        required
        placeholder="123 456"
        className="codeinput"
      />
      {state.error && <p className="err">{state.error}</p>}
      {state.ok && <p className="okmsg">{state.ok}</p>}
      <SubmitButton pendingText="Vérification…">Valider la livraison</SubmitButton>
    </form>
  );
}
