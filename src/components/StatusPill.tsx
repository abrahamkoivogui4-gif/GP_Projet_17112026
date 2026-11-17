import { REPORT_STATUS_LABELS, STATUS_LABELS } from "@/lib/format";

export function StatusPill({ status, kind = "request" }: { status: string; kind?: "request" | "report" | "trip" }) {
  const label =
    kind === "report"
      ? REPORT_STATUS_LABELS[status]
      : kind === "trip"
        ? { active: "Actif", suspended: "Suspendu", cancelled: "Annulé" }[status]
        : STATUS_LABELS[status];
  return <span className={`pill ${status}`}>{label ?? status}</span>;
}
