"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navigation, site } from "@/data/site";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) { setOpen(false); toggle.current?.focus(); }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  return <header className="site-header container">
    <Link href="/" className="wordmark" aria-label={`${site.name} — início`} onClick={() => setOpen(false)}>{site.brand}</Link>
    <span className="nav-rule" aria-hidden="true" />
    <button ref={toggle} type="button" className="menu-toggle label" aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(!open)}>{open ? "Fechar −" : "Menu +"}</button>
    <nav id="primary-navigation" aria-label="Navegação principal" className={`nav-links ${open ? "is-open" : ""}`} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== toggle.current) setOpen(false); }}>
      {navigation.map(link => <Link key={link.href} href={link.href} className="nav-link label" aria-current={pathname === link.href || pathname.startsWith(`${link.href}/`) ? "page" : undefined} onClick={() => setOpen(false)}>{link.label}</Link>)}
      <Link href="/contato" className="availability label" onClick={() => setOpen(false)}><span className="status-dot" />Disponível para projetos</Link>
    </nav>
  </header>;
}
