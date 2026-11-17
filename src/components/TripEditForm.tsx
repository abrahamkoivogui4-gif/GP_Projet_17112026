"use client";
import { useActionState, useState } from "react";
import { updateTrip } from "@/app/actions";
import type { FormState } from "@/app/auth-actions";
import { addDays, shortDate } from "@/lib/format";
import { DelayField, ForbiddenEditor, KgField, PriceField } from "./TripFields";
import { SubmitButton } from "./SubmitButton";

export function TripEditForm(p: { id: number; to: string; date: string; capacity: number; booked: number; price: number; delay: number; forbidden: string[] }) {
  const [state, action] = useActionState<FormState, FormData>(updateTrip, {});
  const [kg, setKg] = useState(p.capacity);
  const [price, setPrice] = useState(p.price);
  const [delay, setDelay] = useState(p.delay);
  const [ban, setBan] = useState(p.forbidden);

  return (
    <form action={action} className="card">
      <input type="hidden" name="id" value={p.id} />
      <input type="hidden" name="capacityKg" value={kg} />
      <input type="hidden" name="pricePerKg" value={price} />
      <input type="hidden" name="deliveryDays" value={delay} />
      <section className="field" style={{ gap: 10 }}>
        <h3>Prix par kilo</h3>
        <PriceField value={price} onChange={setPrice} />
        <p className="tag">Les demandes déjà envoyées gardent le prix du moment où elles ont été faites.</p>
      </section>
      <section className="field" style={{ gap: 10 }}>
        <h3>Place totale</h3>
        <KgField value={kg} onChange={(n) => setKg(Math.max(n, p.booked || 1))} />
        {p.booked > 0 && <p className="tag">{p.booked} kg sont déjà réservés : la place ne peut pas descendre en dessous.</p>}
      </section>
      <section className="field" style={{ gap: 10 }}>
        <h3>Délai de livraison</h3>
        <p className="tag">Après votre arrivée à {p.to}.</p>
        <DelayField value={delay} onChange={setDelay} />
        <p className="tag">
          Livraison au plus tard le <b>{shortDate(addDays(p.date, delay))}</b>
        </p>
      </section>
      <section className="field" style={{ gap: 10 }}>
        <h3>Objets refusés</h3>
        <ForbiddenEditor value={ban} onChange={setBan} />
      </section>
      {state.error && <p className="err">{state.error}</p>}
      {state.ok && <p className="okmsg">{state.ok}</p>}
      <SubmitButton pendingText="Enregistrement…">Enregistrer les modifications</SubmitButton>
    </form>
  );
}
