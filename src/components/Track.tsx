"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Signale chaque page vue au serveur (statistiques de fréquentation de l'admin). */
export function Track() {
  const path = usePathname();
  useEffect(() => {
    if (path.startsWith("/admin")) return;
    const body = JSON.stringify({ p: path });
    if (!navigator.sendBeacon?.("/api/vue", body)) {
      fetch("/api/vue", { method: "POST", body, keepalive: true }).catch(() => {});
    }
  }, [path]);
  return null;
}
