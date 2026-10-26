import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/SiteShell";
import { ContactPanel } from "@/components/contact/ContactPanel";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Reveal } from "@/components/ui/Reveal";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = { title: "Contato", description: "Entre em contato com Matheus Henrique para conversar sobre desenvolvimento full stack, aplicações web, APIs e integrações.", alternates: { canonical: "/contato" } };

export default function ContactPage() {
  return <SiteShell theme="light"><section className="contact-intro page-intro container"><Reveal>
    <SectionLabel>Contato / Oportunidades profissionais</SectionLabel>
    <h1>Vamos conversar sobre<br />seu projeto</h1>
    <p>Estou disponível para conversar. Envie uma descrição da vaga ou do projeto, as tecnologias envolvidas e as responsabilidades previstas. Meu currículo e meus repositórios apresentam mais detalhes sobre minha experiência.</p>
  </Reveal></section>
    <div className="contact-grid container"><ContactForm /><Reveal><ContactPanel /></Reveal></div>
  </SiteShell>;
}
