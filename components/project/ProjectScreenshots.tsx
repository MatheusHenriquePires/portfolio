import type { Project } from "@/data/projects";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScreenshotGallery } from "./ScreenshotGallery";

export function ProjectScreenshots({ project }: { project: Project }) {
  if (!project.screenshots?.length) return null;
  return <section className="project-screenshots" aria-labelledby="screenshots-title">
    <Reveal><SectionLabel>Interface / Aplicação desenvolvida</SectionLabel><h2 id="screenshots-title">O sistema na prática.</h2>
      {project.slug === "genesis" && <p className="screenshot-intro">Capturas do Gênesis, identificado como QSetup nesta versão da interface.</p>}
    </Reveal>
    <Reveal><ScreenshotGallery shots={project.screenshots} label={`Capturas de tela do ${project.title}`} /></Reveal>
  </section>;
}
