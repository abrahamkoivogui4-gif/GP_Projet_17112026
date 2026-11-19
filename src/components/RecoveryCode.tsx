"use client";
import { useState } from "react";

/** Affiche le code de récupération une seule fois. Avec `next`, la suite n'est possible qu'après confirmation. */
export function RecoveryCode({ code, next, title }: { code: string; next?: string; title: string }) {
  const [noted, setNoted] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      /* le code reste sélectionnable à la main */
    }
  }

  return (
    <div className="card">
      <h1>{title}</h1>
      <p>
        Voici votre <b>code de récupération</b>. Si vous oubliez votre mot de passe, il vous permettra d&apos;en créer un nouveau, avec votre numéro de téléphone.
      </p>
      <p className="codebox" aria-label="Code de récupération">
        {code}
      </p>
      <button type="button" className="btn alt" onClick={copy}>
        {copied ? "Code copié" : "Copier le code"}
      </button>
      <p className="warn">
        Il ne sera <b>plus affiché</b>. Écrivez-le sur papier ou faites une capture d&apos;écran, et ne le donnez à personne.
      </p>
      {next && (
        <>
          <label className="check">
            <input type="checkbox" checked={noted} onChange={(e) => setNoted(e.target.checked)} />
            <span>J&apos;ai noté mon code</span>
          </label>
          <button type="button" className="btn" disabled={!noted} onClick={() => window.location.assign(next)}>
            Continuer
          </button>
        </>
      )}
    </div>
  );
}
