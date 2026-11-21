import Link from "next/link";
import { Doc } from "@/components/Doc";
import { siteInfo } from "@/lib/site";

export const metadata = { title: "Nous contacter" };
export const dynamic = "force-dynamic";

export default function Page() {
  const s = siteInfo();
  return (
    <Doc title="Nous contacter" lead="Une question, une suggestion, un problème ? Nous lisons tous les messages.">
      <section className="card">
        <h2>Un problème avec un GP ou un colis</h2>
        <p>Le plus rapide est de faire un signalement depuis votre compte : il arrive directement à l&apos;équipe, avec le trajet ou la demande concernée.</p>
        <Link className="btn" href="/signaler">
          Signaler un problème
        </Link>
      </section>
      {s.contactEmail && (
        <section className="card">
          <h2>Pour tout le reste</h2>
          <p>Écrivez-nous, nous répondons en général sous 48 heures.</p>
          <a className="btn alt" href={`mailto:${s.contactEmail}`}>
            {s.contactEmail}
          </a>
        </section>
      )}
      <p>
        Avant d&apos;écrire, jetez un œil aux <Link href="/aide">questions fréquentes</Link>.
      </p>
    </Doc>
  );
}
