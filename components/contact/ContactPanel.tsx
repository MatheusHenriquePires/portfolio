import { SocialLinks } from "@/components/layout/Footer";
import { SystemVisual } from "@/components/ui/SystemVisual";
import { site } from "@/data/site";

export function ContactPanel() {
  return <aside className="contact-card" aria-label="Contato direto"><SystemVisual variant="contact" compact interactive /><div className="contact-card-copy"><p className="label">Ou, se preferir</p><a className="contact-direct" href={site.email ? `mailto:${site.email}` : site.linkedin}>{site.email || "Vamos conversar no LinkedIn"}<span aria-hidden="true"> ↗</span></a><SocialLinks /></div></aside>;
}
