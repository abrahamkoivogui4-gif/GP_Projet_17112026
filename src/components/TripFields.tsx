"use client";
import { useState } from "react";
import { DEFAULT_FORBIDDEN, DELAYS, MAX_KG, MAX_PRICE } from "@/lib/constants";

/** Liste d'objets refusés : le GP coche/décoche et ajoute les siens. Envoie des champs cachés "forbidden". */
export function ForbiddenEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [extra, setExtra] = useState("");
  const all = [...DEFAULT_FORBIDDEN, ...value.filter((x) => !DEFAULT_FORBIDDEN.includes(x))];
  const toggle = (b: string) => onChange(value.includes(b) ? value.filter((x) => x !== b) : [...value, b]);
  const add = () => {
    const s = extra.trim().slice(0, 60);
    if (s && !value.includes(s)) onChange([...value, s]);
    setExtra("");
  };
  return (
    <div className="field" style={{ gap: 10 }}>
      <p className="tag">Touchez un objet pour l&apos;ajouter ou le retirer. Les objets en rouge sont refusés et seront montrés au client avant sa demande.</p>
      <div className="bans">
        {all.map((b) => {
          const on = value.includes(b);
          return (
            <button key={b} type="button" className="bchip" aria-pressed={on} onClick={() => toggle(b)}>
              {on ? "✕ " : "+ "}
              {b}
            </button>
          );
        })}
      </div>
      <div className="addban">
        <input
          type="text"
          value={extra}
          maxLength={60}
          onChange={(e) => setExtra(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Autre objet (ex. batteries)"
          aria-label="Ajouter un objet refusé"
        />
        <button type="button" className="btn small" onClick={add}>
          Ajouter
        </button>
      </div>
      {value.map((b) => (
        <input key={b} type="hidden" name="forbidden" value={b} />
      ))}
    </div>
  );
}

export function NumberStepper({ value, onChange, unit, min = 1, max }: { value: number; onChange: (n: number) => void; unit: string; min?: number; max: number }) {
  return (
    <div className="stepper">
      <button type="button" aria-label="Moins" onClick={() => onChange(Math.max(min, value - 1))}>
        −
      </button>
      <output>
        {value} <small>{unit}</small>
      </output>
      <button type="button" aria-label="Plus" onClick={() => onChange(Math.min(max, value + 1))}>
        +
      </button>
    </div>
  );
}

export function PriceField({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <>
      <NumberStepper value={value} onChange={onChange} unit="€/kg" max={MAX_PRICE} />
      <div className="chips three">
        {[6, 7, 8, 9, 10, 12].map((p) => (
          <button key={p} type="button" className="chip" aria-pressed={value === p} onClick={() => onChange(p)}>
            {p} €
          </button>
        ))}
      </div>
    </>
  );
}

export function KgField({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <>
      <NumberStepper value={value} onChange={onChange} unit="kg" max={MAX_KG} />
      <div className="chips four">
        {[10, 20, 23, 30].map((k) => (
          <button key={k} type="button" className="chip" aria-pressed={value === k} onClick={() => onChange(k)}>
            {k} kg
          </button>
        ))}
      </div>
    </>
  );
}

export function DelayField({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="chips">
      {DELAYS.map((d) => (
        <button key={d.days} type="button" className="chip" aria-pressed={value === d.days} onClick={() => onChange(d.days)}>
          {d.label}
        </button>
      ))}
    </div>
  );
}
