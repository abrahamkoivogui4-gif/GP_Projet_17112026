/** Négociation du prix d'une demande. */
type R = { status: string; pricePerKg: number; offerPricePerKg: number | null; offerBy: "client" | "gp" | null };

/** Prix au kilo qui compte en ce moment : la dernière proposition tant que la demande est en attente, sinon le prix convenu. */
export function currentPrice(r: R) {
  return r.status === "pending" && r.offerPricePerKg ? r.offerPricePerKg : r.pricePerKg;
}

/** Y a-t-il une proposition de prix en cours, et de qui ? */
export function pendingOffer(r: R) {
  return r.status === "pending" && r.offerPricePerKg && r.offerBy ? { price: r.offerPricePerKg, by: r.offerBy } : null;
}
