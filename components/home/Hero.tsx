import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { DeveloperScene } from "@/components/visual/DeveloperScene";
import { Reveal } from "@/components/ui/Reveal";
import { ResumeButton } from "@/components/ui/ResumeButton";
import { profile } from "@/data/profile";

export function Hero() {
  return <section className="hero container" aria-labelledby="hero-title">
    <Reveal className="hero-copy">
      <SectionLabel>{profile.name} / {profile.role}</SectionLabel>
      <h1 id="hero-title">Desenvolvimento full stack com foco em <span>backend e aplicações web.</span></h1>
      <p className="hero-description">{profile.summary}</p>
      <div className="hero-actions flex flex-wrap gap-3"><Button href="#projetos" arrow>Ver projetos</Button><ResumeButton /><Button href="/sobre" variant="secondary">Sobre mim</Button></div>
    </Reveal>
    <DeveloperScene />
  </section>;
}
