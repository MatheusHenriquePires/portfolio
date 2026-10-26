import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

export function CaseSection({ number, label, title, children }: { number: string; label: string; title?: string; children: ReactNode }) {
  return <section id={`secao-${number}`} className="case-section" aria-labelledby={`case-section-${number}`}><Reveal>
    <SectionLabel>{number} / {label}</SectionLabel>
    <h2 id={`case-section-${number}`}>{title || label}</h2>
    {children}
  </Reveal></section>;
}

