import Link from "next/link";
import { Doc } from "@/components/Doc";

export const metadata = { title: "Questions fréquentes" };

const QA: { q: string; a: React.ReactNode }[] = [
  {
    q: "Qu'est-ce qu'un GP ?",
    a: <p>Un GP est un voyageur qui a de la place dans ses bagages et qui transporte des colis pour d&apos;autres personnes, en échange d&apos;un prix au kilo.</p>,
  },
  {
    q: "Combien coûte Lilalink ?",
    a: <p>Rien. L&apos;inscription et l&apos;utilisation du site sont gratuites. Vous payez seulement le GP, au prix au kilo affiché sur son trajet.</p>,
  },
  {
    q: "Comment se passe le paiement ?",
    a: (
      <p>
        Directement entre l&apos;expéditeur et le GP, en espèces ou par le moyen de votre choix. Lilalink ne prend aucun paiement. Ne payez jamais un
        montant différent de celui annoncé sans en avoir discuté.
      </p>
    ),
  },
  {
    q: "Quand vois-je le numéro du GP ?",
    a: <p>Dès que le GP accepte votre demande. Avant, vous pouvez lui écrire dans la discussion de la demande.</p>,
  },
  {
    q: "À quoi sert le code de livraison ?",
    a: (
      <>
        <p>
          Quand le GP accepte, vous recevez un code à 6 chiffres. Envoyez-le à votre destinataire, par exemple sur WhatsApp. À la remise, le destinataire
          donne le code au GP, qui le tape dans l&apos;application : c&apos;est la seule façon de marquer le colis comme livré.
        </p>
        <p>Après 5 essais faux, le code est bloqué : vous pouvez en créer un nouveau depuis votre demande.</p>
      </>
    ),
  },
  {
    q: "Que veut dire « GP vérifié » ?",
    a: (
      <p>
        Le GP a envoyé une pièce d&apos;identité que l&apos;équipe Lilalink a contrôlée. La pièce est supprimée après la vérification. Le badge ne garantit
        pas la qualité du transport : regardez aussi les avis.
      </p>
    ),
  },
  {
    q: "Que puis-je envoyer ?",
    a: (
      <p>
        Vêtements, documents, cosmétiques, alimentaire emballé, électronique… à condition que l&apos;objet ne figure pas dans les{" "}
        <Link href="/objets-interdits">objets interdits</Link> ni dans la liste des refus du GP.
      </p>
    ),
  },
  {
    q: "Mon colis est perdu, abîmé ou le GP ne répond plus",
    a: (
      <p>
        Contactez d&apos;abord le GP. Si le problème continue, <Link href="/signaler">faites un signalement</Link> : l&apos;équipe vous répond et peut
        suspendre un trajet ou un compte. En cas de vol ou d&apos;arnaque, portez aussi plainte.
      </p>
    ),
  },
  {
    q: "J'ai oublié mon mot de passe",
    a: (
      <p>
        Utilisez le code de récupération reçu à la création de votre compte, depuis la page <Link href="/connexion">Se connecter</Link> → « Mot de passe
        oublié ? ». Sans ce code, <Link href="/contact">contactez-nous</Link> : nous vérifierons votre identité avant de vous aider.
      </p>
    ),
  },
  {
    q: "Comment devenir GP ?",
    a: (
      <p>
        Créez un compte, puis dans <Link href="/compte">Mon compte</Link> activez votre espace GP. Vous pourrez publier vos trajets aussitôt.
      </p>
    ),
  },
  {
    q: "Comment supprimer mon compte ou mes données ?",
    a: (
      <p>
        Écrivez-nous depuis la page <Link href="/contact">Nous contacter</Link>. Voir aussi notre <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
    ),
  },
];

export default function Page() {
  return (
    <Doc title="Questions fréquentes" lead="Les réponses aux questions qu'on nous pose le plus souvent.">
      <div className="faq">
        {QA.map((x) => (
          <details key={x.q}>
            <summary>{x.q}</summary>
            <div>{x.a}</div>
          </details>
        ))}
      </div>
      <p>
        Vous ne trouvez pas votre réponse ? <Link href="/contact">Contactez-nous</Link>.
      </p>
    </Doc>
  );
}
