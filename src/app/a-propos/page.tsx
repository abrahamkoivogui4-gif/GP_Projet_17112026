import Link from "next/link";
import { Doc } from "@/components/Doc";

export const metadata = { title: "Qui sommes-nous" };

export default function Page() {
  return (
    <Doc title="Qui sommes-nous" lead="Lilalink, le colis entre personnes de confiance.">
      <section>
        <p>
          Entre la France et l&apos;Afrique de l&apos;Ouest, des milliers de colis voyagent chaque semaine dans les valises des <b>GP</b> : des voyageurs qui
          ont de la place et qui la proposent, au kilo. C&apos;est rapide et souvent moins cher qu&apos;un transporteur, mais trouver un GP sérieux se fait
          encore de bouche à oreille ou dans des groupes WhatsApp, sans garantie.
        </p>
        <p>Lilalink rend ce système plus simple et plus sûr :</p>
        <ul>
          <li>les GP publient leurs trajets avec la date, les kilos disponibles, le prix au kilo et les objets qu&apos;ils refusent ;</li>
          <li>les expéditeurs comparent, envoient une demande et discutent avec le GP avant de lui confier quoi que ce soit ;</li>
          <li>les GP peuvent faire vérifier leur identité pour obtenir le badge « GP vérifié » ;</li>
          <li>chaque colis est remis avec un code à 6 chiffres, et les expéditeurs notent les GP après la livraison.</li>
        </ul>
      </section>
      <section>
        <h2>Notre rôle</h2>
        <p>
          Lilalink met en relation. Nous ne transportons pas les colis et nous ne prenons pas de paiement : le prix se règle directement entre
          l&apos;expéditeur et le GP. L&apos;inscription et l&apos;utilisation du site sont gratuites.
        </p>
      </section>
      <p>
        <Link href="/comment-ca-marche">Voir comment ça marche</Link> · <Link href="/contact">Nous contacter</Link>
      </p>
    </Doc>
  );
}
