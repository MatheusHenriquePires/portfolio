import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects } from "@/data/projects";
import { CaseLayout } from "@/components/project/CaseLayout";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return projects.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find(p => p.slug === slug);
  if (!project) return { title: "Projeto não encontrado" };
  return { title: project.title, description: project.summary || project.description, alternates: { canonical: `/projetos/${slug}` }, openGraph: { title: `${project.title} — Matheus Henrique`, description: project.summary || project.description } };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const index = projects.findIndex(p => p.slug === slug);
  if (index === -1) notFound();
  return <CaseLayout project={projects[index]} nextProject={projects[(index + 1) % projects.length]} />;
}
