import Link from "next/link";
import { Doc } from "@/components/Doc";

export const metadata = { title: "Comment ça marche" };

export default function Page() {
  return (
    <Doc title="Comment ça marche" lead="Envoyer un colis ou devenir GP, en quelques étapes.">
      <section>
        <h2>Vous envoyez un colis</h2>
        <ol className="steps3">
          <li>
            <b>Choisissez un trajet</b>
            Cherchez par ville de départ, d&apos;arrivée et date. Comparez le prix au kilo, le délai de livraison, les objets refusés et les avis du GP.
          </li>
          <li>
            <b>Envoyez une demande</b>
            Indiquez le poids, le type de colis et la personne qui le recevra. Vous discutez avec le GP dans l&apos;application. Son numéro
            s&apos;affiche dès qu&apos;il accepte.
          </li>
          <li>
            <b>Remettez le colis et payez le GP</b>
            Vous vous retrouvez avec le GP pour lui confier le colis. Le paiement se fait directement entre vous, au prix annoncé.
          </li>
          <li>
            <b>La livraison avec le code</b>
            Quand le GP accepte, vous recevez un code à 6 chiffres. Transmettez-le à votre destinataire. Il le donne au GP à la remise : c&apos;est ce
            qui confirme la livraison. Ensuite, laissez un avis.
          </li>
        </ol>
      </section>
      <section>
        <h2>Vous êtes GP</h2>
        <ol className="steps3">
          <li>
            <b>Publiez votre trajet</b>
            Ville de départ et d&apos;arrivée, date, kilos disponibles, prix au kilo, délai de livraison et objets que vous refusez.
          </li>
          <li>
            <b>Acceptez les demandes</b>
            Lisez la description du colis, posez vos questions dans la discussion, puis acceptez ou refusez.
          </li>
          <li>
            <b>Livrez avec le code</b>
            À la remise, demandez le code à 6 chiffres au destinataire et tapez-le dans l&apos;application : le colis est marqué livré.
          </li>
        </ol>
        <p>
          Faites vérifier votre identité pour obtenir le badge « GP vérifié » : les expéditeurs font davantage confiance aux GP vérifiés.
        </p>
      </section>
      <p>
        <Link href="/">Trouver un GP</Link> · <Link href="/gp/publier">Publier un trajet</Link> · <Link href="/aide">Questions fréquentes</Link>
      </p>
    </Doc>
  );
}
