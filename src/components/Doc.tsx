/** Mise en page des pages d'information (aide, légal…) : titre, sous-titre, texte lisible. */
export function Doc({ title, lead, updated, children }: { title: string; lead?: string; updated?: string; children: React.ReactNode }) {
  return (
    <article className="doc">
      <header>
        <h1>{title}</h1>
        {lead && <p className="doc-lead">{lead}</p>}
        {updated && <p className="hint">Dernière mise à jour : {updated}</p>}
      </header>
      {children}
    </article>
  );
}

/** Valeur légale à renseigner : affichée en évidence tant qu'elle manque. */
export function Fill({ v, label }: { v: string; label: string }) {
  return v ? <>{v}</> : <mark className="tofill">[{label} — à compléter]</mark>;
}
