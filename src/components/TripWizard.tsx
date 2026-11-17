"use client";
import { useActionState, useState } from "react";
import { createTrip } from "@/app/actions";
import type { FormState } from "@/app/auth-actions";
import { CITIES, DEFAULT_FORBIDDEN } from "@/lib/constants";
import { addDays, delayLabel, longDate, shortDate } from "@/lib/format";
import { DelayField, ForbiddenEditor, KgField, PriceField } from "./TripFields";
import { SubmitButton } from "./SubmitButton";

const STEPS = 8;

export function TripWizard({ today }: { today: string }) {
  const [state, action] = useActionState<FormState, FormData>(createTrip, {});
  const [step, setStep] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [kg, setKg] = useState(20);
  const [price, setPrice] = useState(8);
  const [delay, setDelay] = useState(3);
  const [ban, setBan] = useState<string[]>(DEFAULT_FORBIDDEN.slice(0, 4));
  const [showAllCities, setShowAll] = useState(false);

  const top = ["Paris", "Lyon", "Marseille", "Lille", "Conakry", "Kankan", "Labé", "Dakar", "Abidjan", "Bamako"];
  const cityList = (exclude: string) => (showAllCities ? CITIES : top).filter((c) => c !== exclude);
  const go = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0 });
  };
  const ok = (step === 1 && from) || (step === 2 && to) || (step === 3 && date) || step >= 4;
  const quickDates = [
    ["Dans 1 semaine", 7],
    ["Dans 2 semaines", 14],
    ["Dans 1 mois", 30],
    ["Dans 2 mois", 60],
  ] as const;

  const CityChips = ({ value, set, exclude, next }: { value: string; set: (c: string) => void; exclude: string; next: number }) => (
    <>
      <div className="chips">
        {cityList(exclude).map((c) => (
          <button
            key={c}
            type="button"
            className="chip"
            aria-pressed={value === c}
            onClick={() => {
              set(c);
              go(next);
            }}
          >
            {c}
          </button>
        ))}
      </div>
      {!showAllCities && (
        <button type="button" className="link" onClick={() => setShowAll(true)}>
          Voir toutes les villes
        </button>
      )}
    </>
  );

  return (
    <form action={action} className="card">
      <div className="steps" aria-hidden>
        {Array.from({ length: STEPS }, (_, i) => (
          <i key={i} className={i < step ? "on" : ""} />
        ))}
      </div>
      <p className="kicker">
        Étape {step} sur {STEPS}
      </p>

      {step === 1 && (
        <>
          <h2>D&apos;où partez-vous ?</h2>
          <CityChips value={from} set={(c) => { setFrom(c); if (to === c) setTo(""); }} exclude="" next={2} />
        </>
      )}
      {step === 2 && (
        <>
          <h2>Où allez-vous ?</h2>
          <CityChips value={to} set={setTo} exclude={from} next={3} />
        </>
      )}
      {step === 3 && (
        <>
          <h2>Quel jour partez-vous ?</h2>
          <div className="chips">
            {quickDates.map(([l, n]) => {
              const d = addDays(today, n);
              return (
                <button key={l} type="button" className="chip" aria-pressed={date === d} onClick={() => { setDate(d); go(4); }}>
                  {l}
                </button>
              );
            })}
          </div>
          <div className="field">
            <label htmlFor="d">Ou choisissez une date</label>
            <input id="d" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </>
      )}
      {step === 4 && (
        <>
          <h2>Combien de kilos pouvez-vous prendre ?</h2>
          <KgField value={kg} onChange={setKg} />
        </>
      )}
      {step === 5 && (
        <>
          <h2>Quel prix par kilo ?</h2>
          <PriceField value={price} onChange={setPrice} />
          <div className="total">
            <span>Exemple : un colis de 5 kg</span>
            <b>{(5 * price).toLocaleString("fr-FR")} €</b>
          </div>
          <p className="tag">Le client voit ce prix et le total de son colis avant d&apos;envoyer sa demande. Le paiement se fait entre vous.</p>
        </>
      )}
      {step === 6 && (
        <>
          <h2>En combien de temps livrez-vous le colis ?</h2>
          <p className="tag">Délai entre votre arrivée à {to} et la remise au destinataire.</p>
          <DelayField value={delay} onChange={setDelay} />
          <p className="warn">
            Livraison au plus tard le <b>{shortDate(addDays(date, delay))}</b>
          </p>
        </>
      )}
      {step === 7 && (
        <>
          <h2>Quels objets refusez-vous ?</h2>
          <ForbiddenEditor value={ban} onChange={setBan} />
        </>
      )}
      {step === 8 && (
        <>
          <h2>Tout est bon ?</h2>
          <dl className="recap">
            <dt>Départ</dt>
            <dd>{from}</dd>
            <dt>Arrivée</dt>
            <dd>{to}</dd>
            <dt>Date</dt>
            <dd>{longDate(date)}</dd>
            <dt>Place</dt>
            <dd>{kg} kg</dd>
            <dt>Prix</dt>
            <dd>{price} € / kg</dd>
            <dt>Livraison</dt>
            <dd>sous {delayLabel(delay)}</dd>
            <dt>Objets refusés</dt>
            <dd>{ban.length ? `${ban.length} objet${ban.length > 1 ? "s" : ""}` : "aucun"}</dd>
          </dl>
        </>
      )}

      {/* Valeurs envoyées au serveur */}
      <input type="hidden" name="fromCity" value={from} />
      <input type="hidden" name="toCity" value={to} />
      <input type="hidden" name="departureDate" value={date} />
      <input type="hidden" name="capacityKg" value={kg} />
      <input type="hidden" name="pricePerKg" value={price} />
      <input type="hidden" name="deliveryDays" value={delay} />
      {step !== 7 && ban.map((b) => <input key={b} type="hidden" name="forbidden" value={b} />)}

      {state.error && <p className="err">{state.error}</p>}
      {step < STEPS ? (
        <button type="button" className="btn" disabled={!ok} onClick={() => go(step + 1)}>
          Continuer
        </button>
      ) : (
        <SubmitButton pendingText="Publication…">Publier mon trajet</SubmitButton>
      )}
      {step > 1 && (
        <button type="button" className="link" onClick={() => go(step - 1)}>
          ← Retour
        </button>
      )}
    </form>
  );
}
