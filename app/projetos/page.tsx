import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/SiteShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Reveal } from "@/components/ui/Reveal";
import { ProjectGrid } from "@/components/project/ProjectGrid";
import { projects } from "@/data/projects";

export const metadata: Metadata = {
  title: "Projetos",
  description: "Projetos de desenvolvimento de Matheus Henrique: Arena Replay, Gênesis, Arbóreo CRM, JusRadar e Liga Pé de Porco. Conheça minha atuação, as funcionalidades, os fluxos e as tecnologias de cada um.",
  alternates: { canonical: "/projetos" },
};

export default function ProjectsPage() {
  return <SiteShell><section className="page-intro container"><Reveal>
    <SectionLabel>Portfólio / Projetos selecionados</SectionLabel>
    <h1>Projetos e<br />implementações técnicas.</h1>
    <p>Conheça o contexto, o funcionamento e os componentes técnicos do Arena Replay, Gênesis, Arbóreo CRM, JusRadar e Liga Pé de Porco. Cada estudo de caso apresenta o problema abordado, o escopo da solução e minha atuação no desenvolvimento.</p>
  </Reveal></section>
    <section className="container projects-list" aria-label="Cases de projetos"><Reveal><ProjectGrid projects={projects} /></Reveal></section>
  </SiteShell>;
}
