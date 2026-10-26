"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useState } from "react";
import type { Project } from "@/data/projects";
import { ProjectCard } from "./ProjectCard";

const has = (pattern: RegExp) => (project: Project) => [...project.tags, ...(project.technologies ?? [])].some(item => pattern.test(item));

const FILTERS: { id: string; label: string; test: (project: Project) => boolean }[] = [
  { id: "todos", label: "Todos", test: () => true },
  { id: "producao", label: "Em produção", test: project => project.status === "production" },
  { id: "python", label: "Python", test: has(/python/i) },
  { id: "java", label: "Java", test: has(/\bjava(?!script)/i) },
  { id: "node", label: "Node.js / TS", test: has(/node|typescript/i) },
  { id: "react", label: "React", test: has(/react/i) },
];

/** Destaques ocupam a linha inteira; se sobrar um card sozinho no fim, ele também se expande. */
function wideSlugs(list: Project[]) {
  const featured = list.filter(project => project.featured);
  const rest = list.filter(project => !project.featured);
  const wide = new Set(featured.map(project => project.slug));
  if (rest.length % 2 === 1) wide.add(rest[rest.length - 1].slug);
  return wide;
}

export function ProjectGrid({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState("todos");
  const filters = FILTERS.map(filter => ({ ...filter, count: projects.filter(filter.test).length })).filter(filter => filter.count > 0);
  const current = FILTERS.find(filter => filter.id === active) ?? FILTERS[0];
  const visible = [...projects.filter(current.test)].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  const wide = wideSlugs(visible);

  return <MotionConfig reducedMotion="user">
    <div className="project-filters" role="group" aria-label="Filtrar projetos por tecnologia">
      {filters.map(filter => <button key={filter.id} type="button" className="project-filter label" aria-pressed={filter.id === active} onClick={() => setActive(filter.id)}>
        {filter.label}<span>{filter.count}</span>
      </button>)}
    </div>
    <p className="sr-only" aria-live="polite">{visible.length} {visible.length === 1 ? "projeto exibido" : "projetos exibidos"}</p>
    <motion.div layout className="project-grid">
      <AnimatePresence mode="popLayout" initial={false}>
        {visible.map(project => <motion.div key={project.slug} layout className={wide.has(project.slug) ? "is-wide" : undefined}
          initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .97 }}
          transition={{ duration: .35, ease: [.22, 1, .36, 1] }}>
          <ProjectCard project={project} wide={wide.has(project.slug)} />
        </motion.div>)}
      </AnimatePresence>
    </motion.div>
  </MotionConfig>;
}
