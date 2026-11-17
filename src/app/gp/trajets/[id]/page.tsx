import Link from "next/link";
import { notFound } from "next/navigation";
import { requireGp } from "@/lib/auth";
import { getTrip } from "@/lib/queries";
import { longDate } from "@/lib/format";
import { cancelTrip } from "@/app/actions";
import { TripEditForm } from "@/components/TripEditForm";
import { TripRoute } from "@/components/TripCard";
import { StatusPill } from "@/components/StatusPill";
import { SubmitButton } from "@/components/SubmitButton";
import { ShareButton } from "@/components/ShareButton";

export const metadata = { title: "Modifier mon trajet" };
export const dynamic = "force-dynamic";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ publie?: string }> }) {
  const u = await requireGp();
  const t = await getTrip(Number((await params).id) || 0);
  if (!t || (t.gpId !== u.id && u.role !== "admin")) notFound();
  const { publie } = await searchParams;
  const appUrl = process.env.APP_URL ?? "";
  const shareText = `Je voyage de ${t.fromCity} à ${t.toCity} le ${longDate(t.departureDate)}. ${t.capacityKg - t.bookedKg} kg disponibles à ${t.pricePerKg} € le kilo. Réservez ici : ${appUrl}/trajets/${t.id}`;

  return (
    <>
      {publie && (
        <div className="card">
          <h2>Trajet publié ✓</h2>
          <p>Les personnes qui ont un colis peuvent maintenant le trouver. Partagez-le à vos contacts pour recevoir des demandes plus vite.</p>
        </div>
      )}
      <article className="trip">
        <TripRoute from={t.fromCity} to={t.toCity} />
        <p>
          <StatusPill kind="trip" status={t.status} /> · départ {longDate(t.departureDate)} · {t.bookedKg} kg réservés
        </p>
        <a className="btn sun" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}>
          Partager sur WhatsApp
        </a>
        <ShareButton text={shareText} />
        <Link className="link" href={`/trajets/${t.id}`}>
          Voir la page publique du trajet
        </Link>
      </article>
      {t.status === "active" && (
        <>
          <TripEditForm
            id={t.id}
            to={t.toCity}
            date={t.departureDate}
            capacity={t.capacityKg}
            booked={t.bookedKg}
            price={t.pricePerKg}
            delay={t.deliveryDays}
            forbidden={t.forbiddenItems}
          />
          <form action={cancelTrip} className="card">
            <input type="hidden" name="id" value={t.id} />
            <h3>Annuler ce trajet</h3>
            <p className="tag">Les clients en attente ou validés seront prévenus et leurs demandes annulées.</p>
            <label className="check">
              <input type="checkbox" required />
              <span>Je confirme vouloir annuler ce trajet.</span>
            </label>
            <SubmitButton className="btn no small">Annuler le trajet</SubmitButton>
          </form>
        </>
      )}
    </>
  );
}
