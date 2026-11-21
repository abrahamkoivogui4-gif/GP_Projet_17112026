"use client";
import { useEffect, useRef, useState } from "react";

export type DayStat = { day: string; views: number; visitors: number };

const fmtDay = (d: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", ...opts }).format(new Date(`${d}T00:00:00Z`));

/** Arrondit le maximum de l'axe à une valeur ronde (1, 2, 5 × 10ⁿ) pour des graduations lisibles. */
function niceMax(v: number) {
  if (v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

/** Histogramme des pages vues par jour, avec info-bulle au survol ou au toucher. */
export function VisitsChart({ data }: { data: DayStat[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(680);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const h = 220;
  const pad = { top: 12, right: 4, bottom: 28, left: 36 };
  const iw = w - pad.left - pad.right;
  const ih = h - pad.top - pad.bottom;
  const max = niceMax(Math.max(0, ...data.map((d) => d.views)));
  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];
  const step = iw / data.length;
  const bw = Math.max(2, step - 2); // 2 px d'écart entre les barres
  const y = (v: number) => pad.top + ih - (v / max) * ih;
  const labelEvery = w < 480 ? 7 : 5;
  const hd = hover === null ? null : data[hover];

  return (
    <div className="vchart" ref={box} onMouseLeave={() => setHover(null)}>
      <svg width={w} height={h} role="img" aria-label="Pages vues par jour sur les 30 derniers jours">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={w - pad.right} y1={y(t)} y2={y(t)} className={t === 0 ? "base" : "grid"} />
            <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="tick">
              {Number.isInteger(t) ? t : t.toFixed(1)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.left + i * step + (step - bw) / 2;
          const bh = Math.max(0, pad.top + ih - y(d.views));
          const r = Math.min(4, bw / 2, bh);
          const top = pad.top + ih - bh;
          return (
            <g key={d.day}>
              {bh > 0 && (
                <path
                  className={`bar${hover !== null && hover !== i ? " dim" : ""}`}
                  d={`M${x},${top + bh} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${top + bh} Z`}
                />
              )}
              {(i % labelEvery === (data.length - 1) % labelEvery) && (
                <text
                  x={i === data.length - 1 ? x + bw : x + bw / 2}
                  y={h - 8}
                  textAnchor={i === data.length - 1 ? "end" : "middle"}
                  className="tick"
                >
                  {fmtDay(d.day, { day: "numeric", month: "short" })}
                </text>
              )}
              <rect
                x={pad.left + i * step}
                y={pad.top}
                width={step}
                height={ih}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onClick={() => setHover(i)}
              />
            </g>
          );
        })}
      </svg>
      {hd && hover !== null && (
        <div
          className="vtip"
          style={{
            left: Math.min(Math.max(pad.left + hover * step + step / 2, 70), w - 70),
            top: Math.max(0, y(hd.views) - 8),
          }}
        >
          <b>{fmtDay(hd.day, { weekday: "long", day: "numeric", month: "long" })}</b>
          <span>
            {hd.views} page{hd.views > 1 ? "s" : ""} vue{hd.views > 1 ? "s" : ""}
          </span>
          <span>
            {hd.visitors} visiteur{hd.visitors > 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
