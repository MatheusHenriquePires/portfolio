"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ImpactStat } from "@/components/ui/ImpactStat";
import { SystemVisual } from "@/components/ui/SystemVisual";
import { ProjectScene } from "@/components/visual/ProjectScene";
import type { Project } from "@/data/projects";

// A cena WebGL só existe enquanto o card está em foco: um contexto por vez em vez de um por card.
const UNMOUNT_DELAY = 700;

export function ProjectCard({ project, wide = false }: { project: Project; wide?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [live, setLive] = useState(false);
  const [scene, setScene] = useState(false);
  const [inView, setInView] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // No desktop, o card em destaque mantém a cena 3D enquanto visível; os demais mostram a arquitetura estática.
  const alwaysLive = !!project.featured && wide;

  useEffect(() => {
    // No toque não há hover: o destaque fica com a arquitetura estática, sem WebGL.
    if (!alwaysLive || !ref.current || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "120px" });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [alwaysLive]);

  useEffect(() => () => clearTimeout(timer.current), []);

  function activate() {
    setLive(true);
    clearTimeout(timer.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setScene(true);
  }

  function deactivate() {
    setLive(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setScene(false), UNMOUNT_DELAY);
  }

  const showScene = alwaysLive ? inView : scene;
  const impacts = wide ? project.impacts : project.impacts.slice(0, 1);
  const flow = project.flow ?? [];

  return <article ref={ref} className={`project-card project-card--${project.visual}${wide ? " project-card--wide" : ""}${live ? " is-live" : ""}`}
    onPointerEnter={event => { if (event.pointerType === "mouse") activate(); }}
    onPointerLeave={event => { if (event.pointerType === "mouse") deactivate(); }}
    onFocus={activate} onBlur={deactivate}>
    <Link href={`/projetos/${project.slug}`} className="project-card-link" aria-label={`Ver projeto ${project.title}`}>
      <div className="project-card-top label">
        <span>{project.number} / {project.category}</span>
        <span className="project-card-meta">
          {project.status === "production" && <span className="project-status"><i aria-hidden="true" />Em produção</span>}
          <span className="project-arrow" aria-hidden="true">↗</span>
        </span>
      </div>
      <div className="project-art">
        <SystemVisual variant={project.visual} compact />
        {showScene && <div className="project-art-live"><ProjectScene variant={project.visual} compact /></div>}
      </div>
      {flow.length > 0 && <ol className="project-flow label" aria-label={`Fluxo do ${project.title}`} style={{ "--n": flow.length } as CSSProperties}>
        {flow.map((step, index) => <li key={step} style={{ "--i": index } as CSSProperties}>{step}</li>)}
      </ol>}
      <div className="project-card-copy">
        <h3>{project.title}</h3><p>{project.description}</p>
        <div className={`project-impact${impacts.length === 1 ? " project-impact--single" : ""}`}>{impacts.map(impact => <ImpactStat key={impact.value} {...impact} />)}</div>
        <span className="project-tags label">{project.tags.join(" • ")}</span>
        <span className="case-link label">Ver case <span aria-hidden="true">→</span></span>
      </div>
    </Link>
  </article>;
}
