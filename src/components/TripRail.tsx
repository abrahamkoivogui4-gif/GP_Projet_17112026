"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/** Bandeau horizontal de trajets : on glisse au doigt, ou on utilise les flèches sur ordinateur. */
export function TripRail({ title, children }: { title: string; children: React.ReactNode }) {
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
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step * Math.max(1, Math.floor(el.clientWidth / step)), behavior: "smooth" });
  };

  return (
    <section aria-label={title}>
      <div className="railhead">
        <h2>{title}</h2>
        {!(edges.start && edges.end) && (
          <div className="railnav">
            <button type="button" aria-label="Trajets précédents" disabled={edges.start} onClick={() => go(-1)}>
              ←
            </button>
            <button type="button" aria-label="Trajets suivants" disabled={edges.end} onClick={() => go(1)}>
              →
            </button>
          </div>
        )}
      </div>
      <div className="rail" ref={rail} tabIndex={0}>
        {children}
      </div>
    </section>
  );
}
