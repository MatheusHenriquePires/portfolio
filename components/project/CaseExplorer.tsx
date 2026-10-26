"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { CourtScene } from "@/components/visual/CourtScene";
import { GenesisScene } from "@/components/visual/GenesisScene";
import { ProjectScene } from "@/components/visual/ProjectScene";
import { stages, systems, type VisualVariant } from "@/data/visuals";

type Intro = { brand: string; title: ReactNode; chip: string };

export function CaseExplorer({ slug, label, variant, intro }: { slug: string; label: string; variant: VisualVariant; intro: Intro }) {
  const [stage, setStage] = useState<number | null>(null);
  const [sub, setSub] = useState(0);
  const nodes = systems[variant].nodes;
  const data = stages[variant];
  const current = stage !== null ? data?.[stage] : undefined;
  const last = nodes.length - 1;

  useEffect(() => {
    if (stage === null || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setSub(value => value + 1), 2200);
    return () => clearInterval(id);
  }, [stage]);

  function go(index: number | null) {
    setStage(index);
    setSub(0);
  }

  return <figure className={`case-visual case-visual--${slug}`} aria-label={label}
    onKeyDown={(event: KeyboardEvent) => { if (event.key === "Escape") go(null); }}>
    {stage !== null && current ? <div className="case-stage" aria-live="polite">
      <span className="label case-stage-count">Etapa {stage + 1} de {nodes.length}</span>
      <h3>{nodes[stage].title}</h3>
      <p>{current.text}</p>
      <div className="case-stage-io">
        <span><small className="label">Entrada</small>{current.input}</span>
        <span aria-hidden="true">→</span>
        <span><small className="label">Saída</small>{current.output}</span>
      </div>
      <ol className="case-stage-steps">{current.steps.map((step, index) => <li key={step} className={index === sub % current.steps.length ? "is-on" : undefined}><span className="label">{index + 1}</span>{step}</li>)}</ol>
      <div className="case-stage-controls">
        <button type="button" className="stage-button" onClick={() => go(stage - 1)} disabled={stage === 0}>← Anterior</button>
        <button type="button" className="stage-button stage-button--primary" onClick={() => go(stage === last ? 0 : stage + 1)}>{stage === last ? "Recomeçar ↺" : "Avançar →"}</button>
        <button type="button" className="stage-button stage-button--quiet" onClick={() => go(null)}>Fechar ×</button>
      </div>
    </div> : <div className="case-preview">
      <span className="label preview-brand">{intro.brand}</span>
      <p className="preview-title">{intro.title}</p>
      <span className="preview-chip label">{intro.chip}</span>
      {data && <button type="button" className="stage-button stage-button--primary case-start" onClick={() => go(0)}>Ver como funciona ▸</button>}
    </div>}
    <div className="case-system">{variant === "arena-replay" && stage !== null
      ? <CourtScene stage={stage} onStage={go} />
      : variant === "genesis" && stage !== null
        ? <GenesisScene stage={stage} onStage={go} />
        : <ProjectScene variant={variant} interactive stage={stage} onStage={go} />}</div>
    <figcaption className="label">{data ? "Clique em uma etapa para ver como funciona" : "Representação conceitual do fluxo"}</figcaption>
  </figure>;
}
