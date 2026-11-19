"use client";
import { useActionState } from "react";
import { offerTrip } from "@/app/parcel-actions";
import type { FormState } from "@/app/auth-actions";
import { SubmitButton } from "./SubmitButton";

/** Le GP propose un de ses trajets pour une demande d'envoi. */
export function OfferForm({ parcelId, trips }: { parcelId: number; trips: { id: number; label: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(offerTrip, {});
  if (state.ok) return <p className="okmsg">✅ {state.ok}</p>;
  return (
    <form action={action} className="field" style={{ gap: 10 }}>
      <input type="hidden" name="parcelId" value={parcelId} />
      {trips.length > 1 ? (
        <select name="tripId" aria-label="Votre trajet" defaultValue={trips[0].id}>
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      ) : (
        <input type="hidden" name="tripId" value={trips[0].id} />
      )}
      {state.error && <p className="err">{state.error}</p>}
      <SubmitButton className="btn small" pendingText="Envoi…">
        {trips.length > 1 ? "Proposer ce trajet" : `Proposer mon trajet du ${trips[0].label}`}
      </SubmitButton>
    </form>
  );
}
