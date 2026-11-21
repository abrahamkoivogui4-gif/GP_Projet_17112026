import Link from "next/link";

export const metadata = { title: "Compte supprimé" };

export default function Page() {
  return (
    <div className="card">
      <h1>Votre compte a été supprimé</h1>
      <p>Vos informations personnelles ont été effacées. Merci d&apos;avoir utilisé Lilalink.</p>
      <Link className="btn" href="/">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
