import Link from "next/link";
import { Doc, Fill } from "@/components/Doc";
import { LEGAL_UPDATED, siteInfo } from "@/lib/site";

export const metadata = { title: "Conditions générales d'utilisation" };
export const dynamic = "force-dynamic";

export default function Page() {
  const s = siteInfo();
  return (
    <Doc title="Conditions générales d'utilisation" updated={LEGAL_UPDATED}>
      <section>
        <h2>1. Objet</h2>
        <p>
          Les présentes conditions encadrent l&apos;utilisation de Lilalink (lilalink.fr), édité par <Fill v={s.legalName} label="nom ou raison sociale" />.
          Lilalink permet à des voyageurs (« GP ») de proposer de la place dans leurs bagages et à des expéditeurs de leur confier des colis. En créant un
          compte, vous acceptez ces conditions.
        </p>
      </section>
      <section>
        <h2>2. Rôle de Lilalink</h2>
        <ul>
          <li>Lilalink est un intermédiaire : il met en relation expéditeurs et GP. Il n&apos;est ni transporteur, ni commissionnaire de transport.</li>
          <li>Le contrat de transport est conclu directement entre l&apos;expéditeur et le GP, qui fixent ensemble les conditions de remise.</li>
          <li>Le paiement se fait directement entre eux. Lilalink ne reçoit aucun paiement et ne prélève aucune commission.</li>
          <li>Lilalink ne contrôle pas le contenu des colis et n&apos;est pas responsable de leur perte, de leur dégradation ou de leur retard.</li>
        </ul>
      </section>
      <section>
        <h2>3. Compte</h2>
        <ul>
          <li>L&apos;inscription est gratuite et réservée aux personnes majeures.</li>
          <li>Vous vous inscrivez avec votre numéro de téléphone et un mot de passe personnel. Vos informations doivent être exactes.</li>
          <li>Vous êtes responsable de ce qui est fait depuis votre compte. Gardez votre mot de passe et votre code de récupération secrets.</li>
        </ul>
      </section>
      <section>
        <h2>4. Engagements de l&apos;expéditeur</h2>
        <ul>
          <li>
            Décrire honnêtement le contenu et le poids du colis, et ne jamais confier un <Link href="/objets-interdits">objet interdit</Link> ni un objet
            refusé par le GP.
          </li>
          <li>Emballer correctement le colis et accepter que le GP en vérifie le contenu.</li>
          <li>Payer le GP au prix convenu et transmettre le code de livraison uniquement au destinataire.</li>
        </ul>
      </section>
      <section>
        <h2>5. Engagements du GP</h2>
        <ul>
          <li>Publier des trajets réels, avec des informations exactes (date, kilos disponibles, prix, délai).</li>
          <li>Vérifier le contenu des colis, refuser tout colis suspect et respecter les règles douanières et celles des compagnies de transport.</li>
          <li>Appliquer le prix annoncé et remettre le colis au destinataire indiqué, en lui demandant le code de livraison.</li>
          <li>Prévenir rapidement les expéditeurs en cas d&apos;annulation ou de changement.</li>
        </ul>
      </section>
      <section>
        <h2>6. Badge « GP vérifié »</h2>
        <p>
          Le badge indique que l&apos;identité du GP a été contrôlée à partir d&apos;une pièce d&apos;identité. Il ne constitue pas une garantie sur la qualité
          du service rendu.
        </p>
      </section>
      <section>
        <h2>7. Avis et messages</h2>
        <p>
          Les avis doivent être sincères et porter sur une livraison réelle. Les messages insultants, discriminatoires ou frauduleux sont interdits.
          Lilalink peut retirer un contenu qui ne respecte pas ces règles.
        </p>
      </section>
      <section>
        <h2>8. Signalements, suspension</h2>
        <p>
          Chacun peut <Link href="/signaler">signaler</Link> un problème. Lilalink peut suspendre un trajet ou un compte en cas de manquement à ces
          conditions, de fraude ou de comportement dangereux, et transmettre les informations utiles aux autorités si la loi l&apos;exige.
        </p>
      </section>
      <section>
        <h2>9. Responsabilité</h2>
        <p>
          Lilalink fait de son mieux pour que le site fonctionne, sans garantir l&apos;absence d&apos;interruption. Les litiges liés à un transport se règlent
          entre l&apos;expéditeur et le GP ; Lilalink peut aider à les résoudre sans y être tenu.
        </p>
      </section>
      <section>
        <h2>10. Données personnelles</h2>
        <p>
          Voir la <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </section>
      <section>
        <h2>11. Modification et droit applicable</h2>
        <p>
          Ces conditions peuvent évoluer ; la version en vigueur est celle publiée sur cette page. Elles sont soumises au droit français. En cas de
          litige, une solution amiable sera recherchée avant toute action en justice.
        </p>
      </section>
    </Doc>
  );
}
