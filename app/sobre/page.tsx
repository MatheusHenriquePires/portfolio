import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/SiteShell";
import { AboutIntro } from "@/components/about/AboutIntro";
import { ExperienceTimeline } from "@/components/about/ExperienceTimeline";
import { StackMap } from "@/components/about/StackMap";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Reveal } from "@/components/ui/Reveal";
import { WorkflowTerminal } from "@/components/visual/WorkflowTerminal";
import { profile } from "@/data/profile";

export const metadata: Metadata = { title: "Sobre", description: profile.description, alternates: { canonical: "/sobre" } };

export default function AboutPage() {
  return <SiteShell><AboutIntro />
    <section className="about-workflow container" aria-labelledby="workflow-title"><Reveal>
      <SectionTitle label="02 / Processo" id="workflow-title">Como eu trabalho.</SectionTitle>
      <p className="about-stack-description">Da conversa com quem usa até o sistema no ar, cada etapa entrega algo que dá para validar antes de seguir para a próxima.</p>
    </Reveal><WorkflowTerminal /></section>
    <section className="about-stack container" aria-labelledby="stack-title"><Reveal>
      <SectionTitle label="03 / Tecnologias" id="stack-title">Minha base de trabalho.</SectionTitle>
      <p className="about-stack-description">Escolha uma tecnologia para ver onde eu a usei, ou um projeto para ver a stack dele.</p>
    </Reveal><Reveal><StackMap /></Reveal></section>
    <section className="about-experience container" aria-labelledby="experience-title"><Reveal>
      <SectionTitle label="04 / Experiência" id="experience-title">Minha trajetória profissional.</SectionTitle>
    </Reveal><ExperienceTimeline /></section>
  </SiteShell>;
}
