"use client";
import { useActionState, useState } from "react";
import { acceptOffer, proposePrice } from "@/app/actions";
import type { FormState } from "@/app/auth-actions";
import { MAX_PRICE } from "@/lib/constants";
import { NumberStepper } from "./TripFields";
import { SubmitButton } from "./SubmitButton";

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} €`;

/** Encadré « Négociation du prix » d'une demande en attente (côté client et côté GP). */
export function PriceOffer(p: {
  id: number;
  side: "client" | "gp";
  adPrice: number;
  offer: { price: number; by: "client" | "gp" } | null;
  weightKg: number;
  otherName: string;
}) {
  const [propState, propose] = useActionState<FormState, FormData>(proposePrice, {});
  const [accState, accept] = useActionState<FormState, FormData>(acceptOffer, {});
  const current = p.offer?.price ?? p.adPrice;
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(Math.max(1, current - 1));
  const mine = p.offer?.by === p.side;
  const theirs = p.offer && !mine;

  return (
    <div className="nego">
      <b className="nego-t">Négociation du prix</b>
      <div className="nego-row">
        <span>Prix de l&apos;annonce</span>
        <span className={p.offer ? "nego-old" : ""}>{fmt(p.adPrice)} / kg</span>
      </div>
      {p.offer && (
        <div className="nego-row nego-now">
          <span>{mine ? "Votre proposition" : `Proposition de ${p.otherName}`}</span>
          <span>
            {fmt(p.offer.price)} / kg · <b>{fmt(p.offer.price * p.weightKg)}</b>
          </span>
        </div>
      )}

      {mine && <p className="hint">En attente de la réponse de {p.otherName}.</p>}
      {theirs && p.side === "gp" && <p className="hint">Acceptez ce prix avec le bouton « Accepter » ci-dessous, ou faites une autre proposition.</p>}
      {theirs && p.side === "client" && (
        <form action={accept}>
          <input type="hidden" name="id" value={p.id} />
          {accState.error && <p className="err">{accState.error}</p>}
          <SubmitButton className="btn cta" pendingText="Validation…">
            Accepter {fmt(p.offer!.price)} / kg
          </SubmitButton>
        </form>
      )}

      {!open ? (
        <button type="button" className="btn alt small" onClick={() => { setPrice(Math.max(1, current - 1)); setOpen(true); }}>
          {p.offer ? "Faire une autre proposition" : "Proposer un autre prix"}
        </button>
      ) : (
        <form action={propose} className="nego-form">
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="price" value={price} />
          <span className="label">Votre prix au kilo</span>
          <NumberStepper value={price} onChange={setPrice} unit="€/kg" max={MAX_PRICE} />
          <p className="hint" style={{ textAlign: "center" }}>
            Soit <b>{fmt(price * p.weightKg)}</b> pour {p.weightKg} kg
          </p>
          {propState.error && <p className="err">{propState.error}</p>}
          <SubmitButton pendingText="Envoi…">Envoyer ma proposition</SubmitButton>
          <button type="button" className="link" onClick={() => setOpen(false)}>
            Annuler
          </button>
        </form>
      )}
    </div>
  );
}
