import Link from "next/link";
import type { Project } from "@/data/projects";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

export function CaseHero({ project }: { project: Project }) {
  return <header className="case-hero"><Reveal>
      <Link href="/projetos" className="back-link label">← Todos os projetos</Link>
      <SectionLabel>Case {project.number} • {project.category}</SectionLabel>
      <h1>{project.title}</h1>
      <p className="case-summary">{project.summary || project.description}</p>
      <dl className="case-meta">
        <div><dt className="label">{project.role ? "Papel" : "Área"}</dt><dd>{project.role || project.category}</dd></div>
        {project.year && <div><dt className="label">Ano</dt><dd>{project.year}</dd></div>}
        <div><dt className="label">{project.focus ? "Foco" : "Categoria"}</dt><dd>{project.focus || project.tags[0]}</dd></div>
      </dl>
      {project.website && <a href={project.website} className="text-link label" target="_blank" rel="noopener noreferrer">Ver o sistema no ar ↗</a>}
      {project.repository && <a href={project.repository} className="text-link label" target="_blank" rel="noopener noreferrer">Explorar o repositório ↗</a>}
    </Reveal></header>;
}
