"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import type { Project } from "@/data/projects";

type Shot = NonNullable<Project["screenshots"]>[number];

export function ScreenshotGallery({ shots, label }: { shots: Shot[]; label: string }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hold, setHold] = useState(false);
  const [inView, setInView] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const swipe = useRef<number | null>(null);
  const swiped = useRef(false);
  const count = shots.length;
  const shot = shots[index];
  const pad = (value: number) => String(value).padStart(2, "0");

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => setInView(entries[0].isIntersecting), { threshold: .35 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function go(next: number, focus = false) {
    const value = (next + count) % count;
    setIndex(value);
    if (focus) tabs.current[value]?.focus();
  }

  function onTabKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") { event.preventDefault(); go(index + 1, true); }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") { event.preventDefault(); go(index - 1, true); }
  }

  function tilt(event: PointerEvent<HTMLDivElement>) {
    const element = frame.current;
    if (!element || event.pointerType !== "mouse") return;
    const rect = element.getBoundingClientRect();
    element.style.setProperty("--ry", `${((event.clientX - rect.left) / rect.width - .5) * 5}deg`);
    element.style.setProperty("--rx", `${-((event.clientY - rect.top) / rect.height - .5) * 4}deg`);
  }

  function resetTilt() {
    frame.current?.style.setProperty("--rx", "0deg");
    frame.current?.style.setProperty("--ry", "0deg");
  }

  function endSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = swipe.current;
    swipe.current = null;
    if (start === null) return;
    const distance = event.clientX - start;
    if (Math.abs(distance) > 50) {
      swiped.current = true;
      setTimeout(() => { swiped.current = false; }, 0);
      go(index + (distance < 0 ? 1 : -1));
    }
  }

  return <div ref={root} className="shots" role="group" aria-roledescription="carrossel" aria-label={label}
    onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)} onFocusCapture={() => setHold(true)} onBlurCapture={() => setHold(false)}>
    <div className="shots-stage">
      <div ref={frame} className="shots-frame" onPointerMove={tilt} onPointerLeave={resetTilt}
        onPointerDown={event => { swipe.current = event.clientX; }} onPointerUp={endSwipe} onPointerCancel={() => { swipe.current = null; }}>
        <div className="shots-bar" aria-hidden="true"><i /><i /><i /><span>{shot.title}</span></div>
        <div className="shots-screen" role="tabpanel" id="shots-panel" aria-labelledby={`shot-tab-${index}`}>
          {shots.map((item, i) => <button key={item.src} type="button" className={`shots-slide ${i === index ? "is-on" : ""}`} aria-hidden={i !== index} tabIndex={i === index ? 0 : -1} aria-label={`Ampliar captura: ${item.title}`}
            onClick={() => { if (!swiped.current) dialog.current?.showModal(); }}>
            <Image src={item.src} alt={item.alt} width={item.width} height={item.height} priority={i === 0} sizes="(max-width: 1000px) calc(100vw - 48px), 860px" />
          </button>)}
        </div>
      </div>
    </div>
    <div className="shots-side">
      <span className="label shots-count">{pad(index + 1)} / {pad(count)} · Tela do produto</span>
      <div aria-live="polite"><h3>{shot.title}</h3><p>{shot.description}</p></div>
      <div className="shots-tabs" role="tablist" aria-label="Capturas de tela" onKeyDown={onTabKey}>
        {shots.map((item, i) => <button key={item.src} ref={el => { tabs.current[i] = el; }} id={`shot-tab-${i}`} type="button" role="tab" aria-selected={i === index} aria-controls="shots-panel" tabIndex={i === index ? 0 : -1} className="shots-tab" onClick={() => go(i)}>
          <Image src={item.src} alt="" width={144} height={90} sizes="72px" />
          <span><small className="label">{pad(i + 1)}</small>{item.title}</span>
          {i === index && <span key={index} className="shots-progress" style={{ animationPlayState: playing && !hold && inView ? "running" : "paused" }} onAnimationEnd={() => go(index + 1)} aria-hidden="true" />}
        </button>)}
      </div>
      <div className="shots-controls">
        <button type="button" className="stage-button shots-nav" onClick={() => go(index - 1)} aria-label="Captura anterior">←</button>
        <button type="button" className="stage-button shots-nav" onClick={() => go(index + 1)} aria-label="Próxima captura">→</button>
        <button type="button" className="stage-button shots-play" onClick={() => setPlaying(value => !value)} aria-pressed={!playing}>{playing ? "Pausar" : "Reproduzir"}</button>
        <a className="text-link label" href={shot.src} target="_blank" rel="noopener noreferrer">Imagem completa ↗</a>
      </div>
    </div>
    <dialog ref={dialog} className="shots-dialog" aria-label={shot.title} onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
      <Image src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} sizes="96vw" />
      <button type="button" className="stage-button" onClick={() => dialog.current?.close()}>Fechar ×</button>
    </dialog>
  </div>;
}
