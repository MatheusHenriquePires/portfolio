import { SectionTitle } from "@/components/ui/SectionTitle";
import { Reveal } from "@/components/ui/Reveal";

const capabilities = [
  { title: "Backend e APIs", body: "Implementação de regras de negócio, endpoints REST e autenticação JWT com Java e Spring Boot. No JusRadar, essa atuação inclui consulta ao DataJud e monitoramento agendado de processos." },
  { title: "Aplicações completas", body: "Desenvolvimento integral do Gênesis com Python, FastAPI e MySQL: interface, autenticação, questões, PDFs e aprovação. Desenvolvimento do Arena Replay com Python, FFmpeg, Next.js, PostgreSQL e Cloudflare R2, e do Arbóreo CRM com React, Supabase e WhatsApp, ambos em produção." },
  { title: "Trabalho em equipe", body: "Liderança do backend do JusRadar em uma equipe de cinco pessoas. Experiência acadêmica com definição de arquitetura, code review e CI/CD usando GitHub Actions e Docker." },
];

export function Capabilities() {
  return <section className="capabilities container section-space" aria-labelledby="capabilities-title">
    <Reveal><SectionTitle label="02 / Competências" id="capabilities-title">Experiência aplicada ao desenvolvimento de software.</SectionTitle></Reveal>
    <div className="capability-grid">{capabilities.map((item, i) => <Reveal key={item.title} delay={i * 0.06}><article className="info-card"><span className="label info-number">0{i + 1}</span><h3>{item.title}</h3><p>{item.body}</p></article></Reveal>)}</div>
  </section>;
}
