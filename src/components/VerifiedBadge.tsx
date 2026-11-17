// Badge « GP vérifié » : rosace bleue avec coche blanche.
const SEAL = (() => {
  let p = "";
  const n = 24;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2;
    const r = i % 2 ? 10 : 11.6;
    p += `${i ? "L" : "M"}${(12 + r * Math.cos(a)).toFixed(2)} ${(12 + r * Math.sin(a)).toFixed(2)}`;
  }
  return p + "Z";
})();

export function VerifiedBadge({ size = 18 }: { size?: number }) {
  return (
    <svg className="vb" width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="GP vérifié">
      <title>GP vérifié : identité contrôlée par l&apos;équipe</title>
      <path d={SEAL} fill="var(--verified)" stroke="var(--verified)" strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M7.5 12.4l3 3 6-6.2" fill="none" stroke="#fff" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
