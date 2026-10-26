import Link from "next/link";
import { site } from "@/data/site";

export function SocialLinks() {
  return <div className="social-links label">
    {site.linkedin && <a href={site.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>}
    {site.github && <a href={site.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}
  </div>;
}

export function Footer() {
  return <footer className="site-footer container">
    <Link href="/contato" className="footer-cta">Contato profissional e oportunidades.<span aria-hidden="true">↗</span></Link>
    <div className="footer-row"><Link className="label footer-domain" href="/contato">{site.domain}</Link><SocialLinks /></div>
    <div className="footer-meta label"><span>{site.location}</span><span>© {new Date().getFullYear()}</span></div>
  </footer>;
}
