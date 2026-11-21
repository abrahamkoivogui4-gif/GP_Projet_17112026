"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Bandeau horizontal façon vitrine : fond gris clair, grandes cartes, flèches en bas à droite.
 * On glisse au doigt sur téléphone, ou on utilise les flèches sur ordinateur.
 */
export function TripRail({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const rail = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const update = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update]);

  const go = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step * Math.max(1, Math.floor((el.clientWidth - 40) / step)), behavior: "smooth" });
  };

  return (
    <section className="bleed shelf" aria-label={title}>
      <h2 className="pagein shelf-title">
        <b>{title}</b> <span>{subtitle}</span>
      </h2>
      <div className="rail" ref={rail} tabIndex={0}>
        {children}
      </div>
      {!(edges.start && edges.end) && (
        <div className="pagein railnav">
          <button type="button" aria-label="Trajets précédents" disabled={edges.start} onClick={() => go(-1)}>
            <svg viewBox="0 0 36 36" width="36" height="36" aria-hidden>
              <path d="M21 11l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" aria-label="Trajets suivants" disabled={edges.end} onClick={() => go(1)}>
            <svg viewBox="0 0 36 36" width="36" height="36" aria-hidden>
              <path d="M15 11l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
