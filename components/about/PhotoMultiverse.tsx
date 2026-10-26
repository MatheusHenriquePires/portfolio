"use client";

import { useEffect, useRef, useState } from "react";
import { createPaint, type Paint } from "@/components/about/universe-effects";

/**
 * A foto passa por "universos" (imagens geradas a partir dela, em /public/perfil/universos)
 * e termina na foto real. Cada universo tem um movimento próprio (universe-effects.ts)
 * e a troca é um dissolve em blocos de pixels. Com movimento reduzido, tudo fica parado.
 */

export type Universe = { id: string; label: string; src: string };

const HOLD_MS = 2300;
const HOLD_REAL_MS = 5200;
const FADE_MS = 620;
/** Recorte quadrado de imagens verticais: ponto vertical do centro (0 = topo). */
const FOCUS_Y = .22;

function square(img: HTMLImageElement, size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - side) / 2;
  const sy = (img.naturalHeight - side) * FOCUS_Y;
  c.getContext("2d")!.drawImage(img, sx, sy, side, side, 0, 0, size, size);
  return c;
}

const load = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image();
  img.decoding = "async";
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

export function PhotoMultiverse({ universes }: { universes: Universe[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLCanvasElement>(null);
  const showRef = useRef<(index: number) => void>(() => {});
  const pausedRef = useRef(false);
  const last = universes.length - 1;
  const [index, setIndex] = useState(last);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const many = universes.length > 1;

  useEffect(() => {
    const wrap = wrapRef.current, view = viewRef.current;
    if (!wrap || !view) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = view.getContext("2d")!;
    // durante o dissolve, o universo de destino é desenhado aqui e copiado bloco a bloco
    const buffer = document.createElement("canvas");
    const bctx = buffer.getContext("2d")!;
    let frames: HTMLCanvasElement[] = [];
    let paints: Paint[] = [];
    let current = universes.length - 1;
    let fade: { from: number; order: number[]; t0: number } | null = null;
    let timer = 0, raf = 0, last = 0, visible = false, started = false, cancelled = false;

    const render = (now: number) => {
      const t = now / 1000, dt = last ? Math.min(.05, Math.max(0, t - last)) : 0;
      last = t;
      if (!fade) { paints[current](ctx, frames[current], t, dt); return; }
      paints[fade.from](ctx, frames[fade.from], t, dt);
      paints[current](bctx, frames[current], t, dt);
      const grid = 16, cell = view.width / grid;
      const p = Math.max(0, Math.min(1, (now - fade.t0) / FADE_MS));
      for (let n = 0, count = Math.floor(fade.order.length * p); n < count; n++) {
        const k = fade.order[n], x = (k % grid) * cell, y = Math.floor(k / grid) * cell;
        ctx.drawImage(buffer, x, y, cell + 1, cell + 1, x, y, cell + 1, cell + 1);
      }
      if (p >= 1) fade = null;
    };
    const loop = (now: number) => { render(now); raf = requestAnimationFrame(loop); };
    const animate = () => {
      cancelAnimationFrame(raf);
      if (!started) return;
      if (reduced) ctx.drawImage(frames[current], 0, 0);
      else if (visible) { last = 0; raf = requestAnimationFrame(loop); }
    };

    const show = (next: number) => {
      if (!frames[next]) return;
      fade = reduced ? null : { from: current, order: Array.from({ length: 256 }, (_, i) => i).sort(() => Math.random() - .5), t0: performance.now() };
      current = next;
      setIndex(next);
      if (reduced) ctx.drawImage(frames[next], 0, 0);
    };

    const schedule = () => {
      window.clearTimeout(timer);
      if (reduced || pausedRef.current || !visible || !started || frames.length < 2) return;
      const hold = current === frames.length - 1 ? HOLD_REAL_MS : HOLD_MS;
      timer = window.setTimeout(() => { show((current + 1) % frames.length); schedule(); }, hold);
    };
    showRef.current = next => { if (next !== current) show(next); schedule(); };

    Promise.all(universes.map(universe => load(universe.src))).then(images => {
      if (cancelled) return;
      const size = Math.min(1000, Math.round(wrap.clientWidth * Math.min(window.devicePixelRatio || 1, 2)));
      view.width = view.height = buffer.width = buffer.height = size;
      frames = images.map(img => square(img, size));
      paints = universes.map(universe => createPaint(universe.id, size));
      setReady(true);
      // primeira aparição: começa no primeiro universo e atravessa todos até a foto real
      current = reduced ? frames.length - 1 : 0;
      setIndex(current);
      ctx.drawImage(frames[current], 0, 0);
      started = true;
      animate();
      schedule();
    }).catch(() => {});

    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) { animate(); schedule(); } else { window.clearTimeout(timer); cancelAnimationFrame(raf); }
    }, { threshold: .1 });
    observer.observe(wrap);
    return () => { cancelled = true; window.clearTimeout(timer); cancelAnimationFrame(raf); observer.disconnect(); };
  }, [universes]);

  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    showRef.current(index);
  };

  const choose = (i: number) => {
    pausedRef.current = true;
    setPaused(true);
    showRef.current(i);
  };

  return <div ref={wrapRef} className={`photo-multiverse${ready ? " is-ready" : ""}`}>
    <canvas ref={viewRef} className="photo-multiverse__canvas" role="img" aria-label={`Foto de Matheus Henrique${many ? `, versão ${universes[index].label}` : ""}`} />
    {many && <>
      <div className="photo-multiverse__bar">
        <span className="photo-multiverse__count label" aria-hidden="true">universo {String(index + 1).padStart(2, "0")}/{String(universes.length).padStart(2, "0")} · {universes[index].label}</span>
        <button type="button" className="scene-pause scene-pause--inline" aria-pressed={paused} aria-label={paused ? "Continuar troca de versões" : "Pausar troca de versões"} onClick={togglePause}>
          <span aria-hidden="true">{paused ? "▶" : "❚❚"}</span>{paused ? "Continuar" : "Pausar"}
        </button>
      </div>
      <div className="photo-multiverse__chips" role="group" aria-label="Escolher versão da foto">
        {universes.map((universe, i) => <button key={universe.id} type="button" aria-pressed={i === index} onClick={() => choose(i)}>{universe.label}</button>)}
      </div>
    </>}
  </div>;
}
