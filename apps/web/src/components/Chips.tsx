export function StatusChip({ status }: { status: string }) {
  const slug = status.toLowerCase().replace(/\s+/g, "-");
  return <span className={`chip chip-status-${slug}`}>{status}</span>;
}

export function SeverityChip({ severity }: { severity: string | null | undefined }) {
  if (!severity) return <span className="muted">—</span>;
  return (
    <span className={`chip chip-sev-${severity.toLowerCase()}`}>{severity}</span>
  );
}
