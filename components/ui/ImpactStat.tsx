export function ImpactStat({ value, label, prominent = false }: { value: string; label: string; prominent?: boolean }) {
  return <div className={prominent ? "impact-card" : undefined}><strong>{value}</strong>{prominent ? <p>{label}</p> : <span>{label}</span>}</div>;
}
