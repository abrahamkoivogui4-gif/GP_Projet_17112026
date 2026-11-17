export function Stars({ value }: { value: number }) {
  const k = Math.round(value);
  return (
    <span className="st" aria-label={`${value} sur 5`}>
      {"★".repeat(k)}
      <span className="off">{"★".repeat(5 - k)}</span>
    </span>
  );
}
