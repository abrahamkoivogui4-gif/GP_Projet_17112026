import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card empty">
      <h1>Page introuvable</h1>
      <p>Ce trajet ou cette page n&apos;existe pas, ou vous n&apos;y avez pas accès.</p>
      <Link className="btn" href="/">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
