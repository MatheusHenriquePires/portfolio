import Link from "next/link";
import { rich } from "@/components/about/AboutIntro";
import { Reveal } from "@/components/ui/Reveal";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";

/** Linha do tempo da experiência: o cargo atual pulsa e cada emprego mostra números, destaques e stack. */
export function ExperienceTimeline() {
  return <ol className="xp-timeline">
    {profile.experience.map(job => {
      const caseTitle = job.caseSlug && projects.find(project => project.slug === job.caseSlug)?.title;
      return <li key={job.company} className={`xp-item${job.current ? " is-current" : ""}`}>
        <span className="xp-item__dot" aria-hidden="true" />
        <Reveal className="xp-item__body">
          <p className="xp-item__period label">{job.period}{job.current && <span className="xp-item__now">agora</span>}</p>
          <h3>{job.company}</h3>
          <p className="xp-item__role">{job.role}{job.team && <span> · {job.team}</span>}</p>
          {job.stats && <dl className="xp-stats">
            {job.stats.map(stat => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}
          </dl>}
          <ul className="xp-highlights">{job.highlights.map(item => <li key={item}>{rich(item)}</li>)}</ul>
          {job.stack && <ul className="xp-stack" aria-label="Tecnologias usadas">{job.stack.map(tech => <li key={tech}>{tech}</li>)}</ul>}
          {(job.description || caseTitle) && <div className="xp-item__more">
            {job.description && <details><summary>Ver descrição completa</summary><p>{job.description}</p></details>}
            {caseTitle && <Link href={`/projetos/${job.caseSlug}`} className="xp-item__case">Ver o case {caseTitle} →</Link>}
          </div>}
        </Reveal>
      </li>;
    })}
  </ol>;
}
