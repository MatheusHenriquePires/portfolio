import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function SiteShell({ children, theme = "dark" }: { children: ReactNode; theme?: "dark" | "light" }) {
  return <div className={`site-shell theme-${theme}`}><a href="#conteudo" className="skip-link">Pular para o conteúdo</a><Navbar /><main id="conteudo" tabIndex={-1}>{children}</main><Footer /></div>;
}
