import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

export function AboutTeaser() {
  return <section className="about-teaser container" aria-labelledby="about-teaser-title"><Reveal>
    <h2 id="about-teaser-title">Experiência profissional e projetos desenvolvidos em equipe.</h2>
    <p>Minha trajetória inclui desenvolvimento de ERP, APIs, automações e análise de dados. Na página Sobre, apresento minhas responsabilidades em cada experiência, as tecnologias utilizadas e minha formação acadêmica.</p>
    <Link href="/sobre" className="text-link label">Conhecer minha trajetória <span aria-hidden="true">↗</span></Link>
  </Reveal></section>;
}
