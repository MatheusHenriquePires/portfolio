import type { ReactNode } from "react";
import { SectionLabel } from "./SectionLabel";

export function SectionTitle({ label, children, id }: { label: string; children: ReactNode; id?: string }) {
  return <div className="section-heading"><SectionLabel>{label}</SectionLabel><h2 id={id}>{children}</h2></div>;
}
