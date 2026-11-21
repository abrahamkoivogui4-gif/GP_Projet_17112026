import Link from "next/link";
import { Doc, Fill } from "@/components/Doc";
import { SESSION_DAYS } from "@/lib/constants";
import { LEGAL_UPDATED, siteInfo } from "@/lib/site";

export const metadata = { title: "Politique de confidentialité" };
export const dynamic = "force-dynamic";

export default function Page() {
  const s = siteInfo();
  const mail = s.contactEmail ? <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a> : <Fill v="" label="e-mail de contact" />;
  return (
    <Doc title="Politique de confidentialité" lead="Quelles données nous utilisons, pourquoi, et vos droits." updated={LEGAL_UPDATED}>
      <section>
        <h2>Responsable du traitement</h2>
        <p>
          <Fill v={s.legalName} label="nom ou raison sociale" />, <Fill v={s.legalAddress} label="adresse" />. Contact : {mail}.
        </p>
      </section>
      <section>
        <h2>Les données que nous utilisons</h2>
        <ul>
          <li>
            <b>Votre compte</b> : nom, numéro de téléphone, mot de passe (enregistré chiffré, jamais lisible), rôle (client ou GP).
          </li>
          <li>
            <b>Vos trajets et demandes</b> : villes, dates, kilos, prix, description du colis, nom et téléphone du destinataire, messages échangés,
            avis.
          </li>
          <li>
            <b>Le badge « GP vérifié »</b> : la photo de votre pièce d&apos;identité, visible uniquement par l&apos;équipe Lilalink et supprimée dès la
            décision.
          </li>
          <li>
            <b>Les signalements</b> que vous envoyez et les réponses de l&apos;équipe.
          </li>
          <li>
            <b>Votre adresse e-mail</b>, seulement si vous activez les notifications par e-mail dans l&apos;Espace GP.
          </li>
        </ul>
      </section>
      <section>
        <h2>Pourquoi</h2>
        <ul>
          <li>Faire fonctionner le service : créer votre compte, publier les trajets, mettre en relation, livrer avec le code (exécution du contrat).</li>
          <li>Assurer la sécurité : vérification d&apos;identité, signalements, lutte contre la fraude (intérêt légitime).</li>
          <li>Vous prévenir d&apos;une nouvelle demande par e-mail, si vous l&apos;avez choisi (consentement, retirable à tout moment).</li>
          <li>Mesurer la fréquentation du site, de façon anonyme (intérêt légitime).</li>
        </ul>
      </section>
      <section>
        <h2>Qui voit vos données</h2>
        <ul>
          <li>
            Les autres utilisateurs voient le nom que vous avez indiqué, vos trajets et les avis vous concernant. Votre numéro de téléphone n&apos;est montré
            qu&apos;à la personne dont vous avez accepté la demande (ou qui a accepté la vôtre).
          </li>
          <li>L&apos;équipe Lilalink, pour gérer le service et traiter les signalements.</li>
          <li>Notre hébergeur, OVH, qui stocke les données. Et notre service d&apos;envoi d&apos;e-mails, si vous avez activé les notifications.</li>
        </ul>
        <p>Nous ne vendons pas vos données et nous ne faisons pas de publicité ciblée.</p>
      </section>
      <section>
        <h2>Cookies et mesure d&apos;audience</h2>
        <p>
          Lilalink utilise un seul cookie : celui qui garde votre session ouverte ({SESSION_DAYS} jours). Il est indispensable au fonctionnement du
          site et ne demande pas votre accord. La mesure de fréquentation se fait sans cookie : nous comptons les pages vues avec une empreinte
          anonyme qui change chaque jour, sans enregistrer votre adresse IP.
        </p>
      </section>
      <section>
        <h2>Durée de conservation</h2>
        <ul>
          <li>Les données de votre compte sont conservées tant que votre compte existe, et effacées quand vous le supprimez.</li>
          <li>La pièce d&apos;identité est supprimée dès que l&apos;équipe a pris sa décision.</li>
          <li>Les sauvegardes de la base de données sont gardées 14 jours.</li>
        </ul>
      </section>
      <section>
        <h2>Vos droits</h2>
        <p>
          Vous pouvez accéder à vos données, les corriger, les supprimer, vous opposer à un traitement ou demander à les récupérer. Écrivez-nous à{" "}
          {mail}. Nous pourrons vous demander de prouver votre identité. Vous pouvez aussi saisir la CNIL (cnil.fr).
        </p>
        <p>
          Pour supprimer votre compte : <Link href="/compte">Mon compte</Link> → « Supprimer mon compte ». Votre nom, votre numéro, votre e-mail,
          votre mot de passe, votre pièce d&apos;identité et les coordonnées de vos destinataires sont effacés. Vos anciens messages et avis restent
          visibles pour les personnes concernées, sans votre nom.
        </p>
      </section>
    </Doc>
  );
}
