import type { ReactNode } from "react";
import { CaseSection } from "./CaseSection";
import { CaseHero } from "./CaseHero";
import { ProjectScreenshots } from "./ProjectScreenshots";
import { ImpactStat } from "@/components/ui/ImpactStat";
import type { Project } from "@/data/projects";
import { SiteShell } from "@/components/layout/SiteShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Reveal } from "@/components/ui/Reveal";
import { CaseExplorer } from "./CaseExplorer";
import { CaseIndex } from "./CaseIndex";
import { Button } from "@/components/ui/Button";

const INTROS: Record<string, { brand?: string; title: ReactNode; chip: string }> = {
  "arena-replay": { brand: "Arena / Replays", title: <>Seu jogo.<br />Seus melhores momentos.</>, chip: "Captura → processamento → clipe" },
  genesis: { title: <>Do banco de questões<br />à atividade pronta.</>, chip: "Questões → seleção → PDF" },
  arboreo: { title: <>Da primeira mensagem<br />ao contrato assinado.</>, chip: "WhatsApp → funil → contrato" },
  "liga-pe-de-porco": { title: <>O placar entra.<br />A tabela se atualiza.</>, chip: "Placar → view SQL → site" },
};
const DEFAULT_INTRO = { title: <>Processos conectados.<br />Informação organizada.</>, chip: "Consulta → DataJud → processo" };

function CaseVisual({ project }: { project: Project }) {
  const intro = INTROS[project.slug] ?? DEFAULT_INTRO;
  return <CaseExplorer slug={project.slug} variant={project.visual} label={`Representação interativa do projeto ${project.title}`}
    intro={{ brand: ("brand" in intro && intro.brand) || `${project.title} / ${project.category.split(" / ")[0]}`, title: intro.title, chip: intro.chip }} />;
}

export function CaseLayout({ project, nextProject }: { project: Project; nextProject: Project }) {
  return <SiteShell theme="light"><article className="case container">
    <CaseHero project={project} />
    <Reveal><CaseVisual project={project} /></Reveal>
    <ProjectScreenshots project={project} />
    <div className="case-body">
    <CaseIndex items={[{ id: "secao-01", label: "Contexto" }, { id: "secao-02", label: "Problema" }, { id: "secao-03", label: project.contribution ? "Atuação" : "Escopo" }, { id: "secao-04", label: "Solução" }, { id: "secao-tecnico", label: "Técnico" }, { id: "secao-05", label: "Impacto" }, { id: "secao-06", label: "Como funciona" }, { id: "secao-07", label: "Stack" }, ...(project.learnings ? [{ id: "secao-08", label: "Próximos passos" }] : [])]} />
    <div className="case-content">
      <CaseSection number="01" label="Contexto"><p>{project.context}</p></CaseSection>
      <CaseSection number="02" label="Problema" title={project.problem?.title}><p>{project.problem?.body}</p></CaseSection>
      <div className="case-two-columns">
        <CaseSection number="03" label={project.contribution ? "Minha atuação" : "Escopo técnico"}><p>{project.contribution || project.summary || project.description}</p></CaseSection>
        <CaseSection number="04" label="Solução"><p>{project.solution}</p></CaseSection>
      </div>
      <section id="secao-tecnico" className="case-section" aria-labelledby="technical-details-title"><Reveal><SectionLabel>Detalhamento técnico</SectionLabel><h2 id="technical-details-title">Componentes e responsabilidades do sistema.</h2><div className="technical-grid">{project.technicalDetails.map(detail => <article className="technical-card" key={detail.title}><h3>{detail.title}</h3><p>{detail.body}</p></article>)}</div></Reveal></section>
      <CaseSection number="05" label="Impacto" title="O que a solução torna possível.">
        <div className="impact-grid">{project.impacts.map(impact => <ImpactStat key={impact.value} {...impact} prominent />)}</div>
        {project.result && <p className="impact-summary">{project.result.title}</p>}
      </CaseSection>
      <CaseSection number="06" label="Como funciona" title="Da entrada ao resultado.">
        <ol className="process-flow">{project.flow?.map((step, i) => <li key={step}><span className="label flow-number">0{i + 1}</span><span>{step}</span></li>)}</ol>
      </CaseSection>
      <CaseSection number="07" label="Stack" title="Tecnologias utilizadas.">
        <ul className="stack-list">{(project.technologies || project.tags).map(tag => <li key={tag} className="label">{tag}</li>)}</ul>
      </CaseSection>
      {project.learnings && <CaseSection number="08" label="Decisões e próximos passos"><p>{project.learnings}</p></CaseSection>}
      {project.deliveryNote && <p className="case-delivery-note">{project.deliveryNote}</p>}
    </div>
    </div>
    <aside className="next-project" aria-label="Próximo projeto"><div><SectionLabel>Próximo projeto</SectionLabel><h2>{nextProject.title}</h2></div><Button href={`/projetos/${nextProject.slug}`} arrow>Conhecer case</Button></aside>
  </article></SiteShell>;
}
