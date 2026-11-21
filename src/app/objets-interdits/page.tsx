import Link from "next/link";
import { Doc } from "@/components/Doc";
import { DEFAULT_FORBIDDEN } from "@/lib/constants";

export const metadata = { title: "Objets interdits" };

export default function Page() {
  return (
    <Doc title="Objets interdits" lead="Ce que vous ne devez jamais confier à un GP.">
      <section>
        <h2>Refusés par défaut sur Lilalink</h2>
        <ul className="banlist">
          {DEFAULT_FORBIDDEN.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <p>
          Chaque GP peut ajouter ses propres refus. Ils sont affichés sur la page du trajet : lisez-les avant d&apos;envoyer votre demande.
        </p>
      </section>
      <section>
        <h2>Toujours interdits par la loi</h2>
        <ul>
          <li>drogues et stupéfiants ;</li>
          <li>armes, munitions, explosifs, feux d&apos;artifice ;</li>
          <li>contrefaçons et marchandises volées ;</li>
          <li>espèces protégées (ivoire, peaux, animaux vivants…) ;</li>
          <li>produits dangereux : gaz, batteries au lithium en vrac, produits chimiques, inflammables.</li>
        </ul>
        <p>
          Les règles de la douane et des compagnies aériennes s&apos;appliquent aussi : quantités de nourriture, alcool, tabac, médicaments, valeur
          des marchandises. En cas de doute, renseignez-vous avant le départ.
        </p>
      </section>
      <section>
        <h2>Pour les GP</h2>
        <p>
          Vous êtes responsable de ce que vous transportez. Demandez à voir le contenu du colis et refusez tout colis fermé dont vous ne connaissez
          pas le contenu. Si un colis vous semble suspect, refusez-le et <Link href="/signaler">signalez-le</Link>.
        </p>
      </section>
    </Doc>
  );
}
