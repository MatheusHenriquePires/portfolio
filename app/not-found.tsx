import { SiteShell } from "@/components/layout/SiteShell";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";

export default function NotFound() {
  return <SiteShell><section className="page-intro container not-found"><SectionLabel>404 / Fora de órbita</SectionLabel><h1>Essa página não<br />está por aqui.</h1><p>Mas o próximo projeto pode estar a um clique.</p><Button href="/projetos" arrow>Explorar projetos</Button></section></SiteShell>;
}
