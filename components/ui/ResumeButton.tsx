import { profile } from "@/data/profile";

export function ResumeButton() {
  return <a className="button button--secondary" href={profile.resume.href} target="_blank" rel="noopener noreferrer" aria-label="Meu currículo (PDF, abre em nova aba)">{profile.resume.label}<span aria-hidden="true">↗</span></a>;
}
