import { projects } from "@/data/projects";
import { ProjectGrid } from "@/components/project/ProjectGrid";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Reveal } from "@/components/ui/Reveal";

export function ProjectsSection() {
  return <section id="projetos" className="projects-section container" aria-labelledby="projects-title">
    <Reveal><SectionTitle label="01 / Projetos selecionados" id="projects-title">Conheça meus projetos de desenvolvimento.</SectionTitle></Reveal>
    <Reveal><ProjectGrid projects={projects} /></Reveal>
  </section>;
}
