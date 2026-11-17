import { searchTrips } from "@/lib/queries";
import { CITIES } from "@/lib/constants";
import { todayIso } from "@/lib/format";
import { TripCard } from "@/components/TripCard";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { AutoSubmit } from "@/components/AutoSubmit";

export const dynamic = "force-dynamic";

type SP = { de?: string; vers?: string; date?: string; verifies?: string; tri?: string };

export default async function Home({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const city = (c?: string) => (c && (CITIES as readonly string[]).includes(c) ? c : "");
  const f = { from: city(sp.de), to: city(sp.vers), date: /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date : "", verified: sp.verifies === "1", sort: sp.tri };
  const list = await searchTrips(f);

  return (
    <>
      <form className="card" method="get" action="/">
        <AutoSubmit />
        <h1>Quel GP cherchez-vous ?</h1>
        <div className="row">
          <div className="field">
            <label htmlFor="de">Départ</label>
            <select id="de" name="de" defaultValue={f.from}>
              <option value="">Toutes les villes</option>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="vers">Arrivée</label>
            <select id="vers" name="vers" defaultValue={f.to}>
              <option value="">Toutes les villes</option>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
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
        <noscript>
          <button className="btn" type="submit">
            Chercher
          </button>
        </noscript>
      </form>

      <p className="kicker">{list.length > 1 ? `${list.length} trajets trouvés` : `${list.length} trajet trouvé`}</p>
      {list.length ? (
        list.map((t) => <TripCard key={t.id} t={t} />)
      ) : (
        <div className="card empty">Aucun trajet pour le moment. Changez la ville ou la date.</div>
      )}
    </>
  );
}
