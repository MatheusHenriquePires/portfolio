import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { IdentityCard } from "@/components/about/IdentityCard";
import type { Universe } from "@/components/about/PhotoMultiverse";
import { Reveal } from "@/components/ui/Reveal";
import { ResumeButton } from "@/components/ui/ResumeButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { profile } from "@/data/profile";

/** `**trecho**` vira <strong>. */
export function rich(text: string): ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
}

/** A foto entra sozinha quando existir public/perfil/matheus.(jpg|jpeg|png|webp). */
const findPhoto = () => ["jpg", "jpeg", "png", "webp"].map(ext => `/perfil/matheus.${ext}`).find(file => existsSync(join(process.cwd(), "public", file)));

const LABELS: Record<string, string> = { blocos: "Blocos", "16-bit": "16-bit", hq: "Quadrinhos", "animacao-3d": "Animação 3D", anime: "Anime", massinha: "Massinha" };

/** Universos da foto: arquivos `NN-nome.ext` em public/perfil/universos, em ordem; a foto real fecha o ciclo. */
function findUniverses(photo?: string): Universe[] {
  if (!photo) return [];
  const dir = join(process.cwd(), "public", "perfil", "universos");
  const files = existsSync(dir) ? readdirSync(dir).filter(file => /^\d+-[\w-]+\.(jpe?g|png|webp)$/i.test(file)).sort() : [];
  const generated = files.map(file => {
    const id = file.replace(/^\d+-/, "").replace(/\.\w+$/, "").toLowerCase();
    return { id, label: LABELS[id] ?? id.replace(/-/g, " ").replace(/^./, c => c.toUpperCase()), src: `/perfil/universos/${file}` };
  });
  return [...generated, { id: "real", label: "Real", src: photo }];
}

const initials = (course: string) => course.split(" ").filter(word => word.length > 2).map(word => word[0]).join("").toUpperCase();

export function AboutIntro() {
  const universes = findUniverses(findPhoto());
  return <section className="about-intro container" aria-labelledby="about-title">
    <Reveal className="about-intro__side">
      <SectionLabel>01 / Sobre mim</SectionLabel>
      <h1 id="about-title">{profile.aboutHeadline.lead} <em>{profile.aboutHeadline.accent}</em></h1>
      <p className="about-intro__lead">{profile.aboutLead}</p>
      <p className="about-intro__sign label"><span aria-hidden="true" />{profile.name} / Teresina, PI</p>
      <IdentityCard universes={universes} />
    </Reveal>
    <Reveal className="about-intro__body" delay={.08}>
      {profile.aboutParagraphs.map(paragraph => <p key={paragraph.slice(0, 24)}>{rich(paragraph)}</p>)}
      <ul className="about-intro__education" aria-label="Formação">
        {profile.education.map(item => {
          const [degree, state] = item.status.split(" — ");
          return <li key={item.course}>
            <span className="about-intro__badge" aria-hidden="true">{initials(item.course)}</span>
            <div>
              <h2>{item.course}</h2>
              <p>{[degree, item.institution].filter(Boolean).join(" · ")}</p>
              {state && <p className="about-intro__state">{state.charAt(0).toUpperCase() + state.slice(1)}</p>}
            </div>
          </li>;
        })}
      </ul>
      <div className="about-intro__footer"><ResumeButton /><span className="label">{profile.location}</span></div>
    </Reveal>
  </section>;
}
