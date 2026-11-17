"use client";
import { useEffect, useRef } from "react";

/** Envoie le formulaire parent dès qu'un champ change (filtres de recherche). */
export function AutoSubmit() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const onChange = () => form.requestSubmit();
    form.addEventListener("change", onChange);
    return () => form.removeEventListener("change", onChange);
  }, []);
  return <span ref={ref} hidden />;
}
