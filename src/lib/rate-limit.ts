// Limite de tentatives en mémoire (suffisant pour une seule instance du serveur).
// Pour plusieurs instances, remplacer par Redis.
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
    return true;
  }
  h.count++;
  return h.count <= max;
}
