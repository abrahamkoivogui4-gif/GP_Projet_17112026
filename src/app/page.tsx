import { searchTrips } from "@/lib/queries";
import { CITIES, CITY_GROUPS } from "@/lib/constants";
import { todayIso } from "@/lib/format";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { AutoSubmit } from "@/components/AutoSubmit";
import { TripRail } from "@/components/TripRail";
import { TripTile } from "@/components/TripTile";

export const dynamic = "force-dynamic";

type SP = { de?: string; vers?: string; date?: string; verifies?: string; tri?: string };

export default async function Home({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const city = (c?: string) => (c && (CITIES as readonly string[]).includes(c) ? c : "");
  const f = { from: city(sp.de), to: city(sp.vers), date: /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date : "", verified: sp.verifies === "1", sort: sp.tri };
  const list = await searchTrips(f);

  return (
    <>
      <section className="bleed hero">
        <div className="pagein heroin">
          <div className="herotext">
            <h1>Envoyez vos colis avec un GP de confiance</h1>
            <p className="lead">Entre l&apos;Europe, le Canada, les États-Unis et l&apos;Afrique de l&apos;Ouest, avec des voyageurs vérifiés et notés par les expéditeurs.</p>
            <form className="search" method="get" action="/">
              <AutoSubmit />
              <div className="legs">
                <span className="pt dot" aria-hidden />
                <select id="de" name="de" defaultValue={f.from} aria-label="Ville de départ">
                  <option value="">Départ : toutes les villes</option>
                  {CITY_GROUPS.map((g) => (
                    <optgroup key={g.country} label={`${g.flag} ${g.country}`}>
                      {g.cities.map((c) => (
                        <option key={c} value={c}>
                          Départ : {c}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <span className="pt" aria-hidden />
                <select id="vers" name="vers" defaultValue={f.to} aria-label="Ville d'arrivée">
                  <option value="">Arrivée : toutes les villes</option>
                  {CITY_GROUPS.map((g) => (
                    <optgroup key={g.country} label={`${g.flag} ${g.country}`}>
                      {g.cities.map((c) => (
                        <option key={c} value={c}>
                          Arrivée : {c}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="row">
                <div className="field">
                  <label htmlFor="date">À partir du (facultatif)</label>
                  <input id="date" name="date" type="date" min={todayIso()} defaultValue={f.date} />
                </div>
                <div className="field">
                  <label htmlFor="tri">Trier par</label>
                  <select id="tri" name="tri" defaultValue={f.sort ?? "date"}>
                    <option value="date">Départ le plus tôt</option>
                    <option value="prix">Prix au kilo le plus bas</option>
                    <option value="note">Mieux notés</option>
                  </select>
                </div>
              </div>
              <label className="check">
                <input type="checkbox" name="verifies" value="1" defaultChecked={f.verified} />
                <span>
                  Seulement les GP vérifiés <VerifiedBadge size={20} />
                </span>
              </label>
              <button className="btn auto" type="submit">
                Voir les trajets
              </button>
            </form>
          </div>
          <aside className="howto" aria-labelledby="howto-title">
            <h2 id="howto-title">Comment ça marche</h2>
            <ol>
              <li>
                <div>
                  <b>Choisissez un trajet</b>
                  <span>Comparez les dates, le prix au kilo et les avis des GP.</span>
                </div>
              </li>
              <li>
                <div>
                  <b>Envoyez une demande</b>
                  <span>Décrivez votre colis et discutez avec le GP. Son numéro s&apos;affiche quand il accepte.</span>
                </div>
              </li>
              <li>
                <div>
                  <b>Remise avec un code</b>
                  <span>Votre destinataire donne un code à 6 chiffres au GP : le colis est livré en toute sécurité.</span>
                </div>
              </li>
            </ol>
          </aside>
        </div>
      </section>

      {list.length ? (
        <TripRail
          title="Les prochains départs."
          subtitle={list.length > 1 ? `${list.length} trajets avec des GP de confiance.` : "1 trajet avec un GP de confiance."}
        >
          {list.map((t) => (
            <TripTile key={t.id} t={t} />
          ))}
        </TripRail>
      ) : (
        <section className="bleed shelf">
          <h2 className="pagein shelf-title">
            <b>Aucun trajet trouvé.</b> <span>Changez la ville ou la date.</span>
          </h2>
        </section>
      )}
    </>
  );
}
