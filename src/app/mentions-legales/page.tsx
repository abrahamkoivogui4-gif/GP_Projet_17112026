import { Doc, Fill } from "@/components/Doc";
import { LEGAL_UPDATED, siteInfo } from "@/lib/site";

export const metadata = { title: "Mentions légales" };
export const dynamic = "force-dynamic";

export default function Page() {
  const s = siteInfo();
  return (
    <Doc title="Mentions légales" updated={LEGAL_UPDATED}>
      <section>
        <h2>Éditeur du site</h2>
        <p>
          Le site lilalink.fr est édité par <Fill v={s.legalName} label="nom ou raison sociale" />, <Fill v={s.legalForm} label="statut juridique" />.
          <br />
          Adresse : <Fill v={s.legalAddress} label="adresse" />
          <br />
          Immatriculation : <Fill v={s.legalId} label="SIREN / SIRET" />
          <br />
          Contact : {s.contactEmail ? <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a> : <Fill v="" label="e-mail de contact" />}
        </p>
        <p>
          Directeur de la publication : <Fill v={s.publisher} label="nom" />
        </p>
      </section>
      <section>
        <h2>Hébergeur</h2>
        <p>
          OVH SAS, 2 rue Kellermann, 59100 Roubaix, France.
          <br />
          Téléphone : 1007 · ovhcloud.com
        </p>
      </section>
      <section>
        <h2>Activité</h2>
        <p>
          Lilalink est une plateforme de mise en relation entre des expéditeurs de colis et des voyageurs (GP). Lilalink ne transporte pas de colis et
          n&apos;intervient pas dans le paiement entre utilisateurs. Voir les conditions générales d&apos;utilisation.
        </p>
      </section>
      <section>
        <h2>Propriété intellectuelle</h2>
        <p>
          Le nom Lilalink, le site et ses contenus sont protégés. Toute reproduction sans autorisation est interdite. Les annonces, messages et avis
          restent la responsabilité des utilisateurs qui les publient.
        </p>
      </section>
      <section>
        <h2>Données personnelles</h2>
        <p>
          Le traitement de vos données est décrit dans notre <a href="/confidentialite">politique de confidentialité</a>.
        </p>
      </section>
    </Doc>
  );
}
