"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { site } from "@/data/site";

export function ContactForm() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const details = String(form.get("project") || "").trim();
    if (!name || !email || !details) { setStatus("Preencha seu nome, e-mail e uma descrição do projeto."); return; }
    const text = `Olá, Matheus! Sou ${name}.\n\n${details}\n\nMeu e-mail: ${email}`;
    if (site.email) {
      window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(`Vamos conversar? — ${name}`)}&body=${encodeURIComponent(text)}`;
      setStatus("Seu aplicativo de e-mail será aberto com a mensagem preenchida. Confirme o envio por lá.");
    } else {
      setMessage(text);
      setStatus("Mensagem pronta. Copie o texto e envie pelo LinkedIn.");
    }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(message); setStatus("Mensagem copiada. Agora você pode enviá-la pelo LinkedIn."); }
    catch { setStatus("Selecione e copie o texto da mensagem abaixo para enviar pelo LinkedIn."); }
  }

  return <form className="contact-form" onSubmit={prepare}>
    <div className="form-field"><label htmlFor="contact-name" className="label">Seu nome</label><input id="contact-name" name="name" autoComplete="name" placeholder="Como você se chama?" required maxLength={100} /></div>
    <div className="form-field"><label htmlFor="contact-email" className="label">E-mail</label><input id="contact-email" name="email" type="email" autoComplete="email" placeholder="voce@email.com" required maxLength={200} /></div>
    <div className="form-field"><label htmlFor="contact-project" className="label">Sobre o projeto</label><textarea id="contact-project" name="project" placeholder="Conte um pouco sobre o que você quer criar…" required minLength={10} maxLength={3000} rows={5} /></div>
    <p className="form-note" id="contact-help">{site.email ? "A mensagem será aberta no seu aplicativo de e-mail para você enviar." : "Prepare sua mensagem aqui e envie pelo LinkedIn."}</p>
    <button type="submit" className="button contact-submit" aria-describedby="contact-help">{site.email ? "Continuar por e-mail" : "Preparar mensagem"}<span aria-hidden="true">↗</span></button>
    <p className="form-status" role="status" aria-live="polite">{status}</p>
    {message && <div className="prepared-message"><label className="label" htmlFor="prepared-text">Sua mensagem</label><textarea id="prepared-text" readOnly value={message} rows={6} /><div className="flex flex-wrap gap-3"><button type="button" className="button button--secondary" onClick={copy}>Copiar mensagem</button><a className="button button--primary" href={site.linkedin} target="_blank" rel="noopener noreferrer">Abrir LinkedIn ↗</a></div></div>}
  </form>;
}
