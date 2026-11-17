"use client";
import { useState } from "react";

export function ShareButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn alt small"
      onClick={async () => {
        try {
          if (navigator.share) await navigator.share({ text });
          else {
            await navigator.clipboard.writeText(text);
            setDone(true);
          }
        } catch {
          /* partage annulé */
        }
      }}
    >
      {done ? "Texte copié ✓" : "Copier ou partager le lien"}
    </button>
  );
}
