import "server-only";
import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { requests, reviews, trips, users } from "@/db/schema";
import { todayIso } from "./format";

/** Note moyenne et nombre d'avis d'un GP */
const ratingSub = db
  .select({
    gpId: reviews.gpId,
    avg: sql<number>`round(avg(${reviews.stars})::numeric, 1)::float`.as("avg"),
    count: sql<number>`count(*)::int`.as("count"),
  })
  .from(reviews)
  .groupBy(reviews.gpId)
  .as("rating");

/** Kilos déjà réservés (demandes validées ou livrées) par trajet */
const bookedSub = db
  .select({
    tripId: requests.tripId,
    kg: sql<number>`coalesce(sum(${requests.weightKg}), 0)::int`.as("kg"),
  })
  .from(requests)
  .where(inArray(requests.status, ["accepted", "delivered"]))
  .groupBy(requests.tripId)
  .as("booked");

const tripFields = {
  id: trips.id,
  gpId: trips.gpId,
  fromCity: trips.fromCity,
  toCity: trips.toCity,
  departureDate: trips.departureDate,
  capacityKg: trips.capacityKg,
  pricePerKg: trips.pricePerKg,
  deliveryDays: trips.deliveryDays,
  forbiddenItems: trips.forbiddenItems,
  status: trips.status,
  gpName: users.name,
  gpPhone: users.phone,
  gpVerified: sql<boolean>`${users.verification} = 'verified'`,
  rating: sql<number>`coalesce(${ratingSub.avg}, 0)`,
  reviewCount: sql<number>`coalesce(${ratingSub.count}, 0)`,
  bookedKg: sql<number>`coalesce(${bookedSub.kg}, 0)`,
};


function baseTripQuery() {
  return db
    .select(tripFields)
    .from(trips)
    .innerJoin(users, eq(users.id, trips.gpId))
    .leftJoin(ratingSub, eq(ratingSub.gpId, trips.gpId))
    .leftJoin(bookedSub, eq(bookedSub.tripId, trips.id));
}

export async function searchTrips(f: { from?: string; to?: string; date?: string; verified?: boolean; sort?: string }) {
  const conds = [
    eq(trips.status, "active"),
    eq(users.suspended, false),
    gte(trips.departureDate, f.date && f.date > todayIso() ? f.date : todayIso()),
  ];
  if (f.from) conds.push(eq(trips.fromCity, f.from));
  if (f.to) conds.push(eq(trips.toCity, f.to));
  if (f.verified) conds.push(eq(users.verification, "verified"));
  const order =
    f.sort === "prix"
      ? [asc(trips.pricePerKg), asc(trips.departureDate)]
      : f.sort === "note"
        ? [desc(sql`coalesce(${ratingSub.avg}, 0)`), asc(trips.departureDate)]
        : [asc(trips.departureDate), asc(trips.pricePerKg)];
  return baseTripQuery()
    .where(and(...conds))
    .orderBy(...order)
    .limit(100);
}

export async function getTrip(id: number) {
  const rows = await baseTripQuery().where(eq(trips.id, id)).limit(1);
  return rows[0] ?? null;
}

export type TripView = NonNullable<Awaited<ReturnType<typeof getTrip>>>;

export async function getGpTrips(gpId: number) {
  return baseTripQuery().where(eq(trips.gpId, gpId)).orderBy(desc(trips.departureDate));
}

export async function getGpReviews(gpId: number, limit = 20) {
  return db
    .select({ stars: reviews.stars, comment: reviews.comment, createdAt: reviews.createdAt, clientName: users.name })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.clientId))
    .where(eq(reviews.gpId, gpId))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
}
