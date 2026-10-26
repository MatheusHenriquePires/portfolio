"use client";

import { motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { MotionValue } from "framer-motion";
import { coreModules } from "@/data/developer-core";

export function DeveloperCore() {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; rotation: number; moved: boolean } | null>(null);
  const base = useRef(0);
  const suppressClick = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [terminal, setTerminal] = useState(false);
  const reduced = useReducedMotion();
  const visible = useInView(ref, { margin: "60px" });
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateY = useSpring(x, { stiffness: 55, damping: 24 });
  const rotateX = useSpring(y, { stiffness: 55, damping: 24 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const spread = useTransform(scrollYProgress, [0, 1], [0, 9]);
  const active = selected || hovered;
  const activeModule = coreModules.find(item => item.id === active);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function move(event: PointerEvent<HTMLDivElement>) {
    if (reduced) return;
    if (drag.current) {
      const distance = event.clientX - drag.current.x;
      if (Math.abs(distance) > 6) { drag.current.moved = true; event.currentTarget.setPointerCapture(event.pointerId); }
      base.current = Math.max(-30, Math.min(30, drag.current.rotation + distance * .12));
      x.set(base.current);
    } else if (event.pointerType === "mouse") {
      const bounds = event.currentTarget.getBoundingClientRect();
      x.set(Math.max(-30, Math.min(30, base.current + ((event.clientX - bounds.left) / bounds.width - .5) * 12)));
      y.set(-((event.clientY - bounds.top) / bounds.height - .5) * 10);
    }
  }

  function openTerminal() {
    setSelected(null);
    setHovered(null);
    setTerminal(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setTerminal(false), 4500);
  }

  return <div ref={ref} className="developer-core hero-system" data-moving={visible && !reduced} role="group" aria-label="Developer Core: arquitetura interativa"
    onPointerMove={move}
    onPointerDown={event => {
      if (event.button !== 0 || reduced) return;
      drag.current = { x: event.clientX, rotation: base.current, moved: false };
    }}
    onPointerUp={event => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      if (drag.current?.moved) { suppressClick.current = true; setTimeout(() => { suppressClick.current = false; }, 0); }
      drag.current = null;
    }}
    onPointerCancel={() => { drag.current = null; }}
    onPointerLeave={() => { if (!drag.current) { base.current = 0; x.set(0); y.set(0); setHovered(null); } }}
    onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}
    onClick={event => { if (!(event.target as Element).closest("button")) { setSelected(null); setHovered(null); setTerminal(false); } }}
    onKeyDown={event => { if (event.key === "Escape") { setSelected(null); setHovered(null); setTerminal(false); } }}>
    <div className="core-ambient" aria-hidden="true" />
    <motion.div className="core-space" style={{ rotateX: reduced ? 0 : rotateX, rotateY: reduced ? 0 : rotateY }}>
      <div className="core-sculpture">
        <svg viewBox="0 0 100 100" className="core-lines" aria-hidden="true">
          {coreModules.map(item => <CoreConnection key={item.id} item={item} spread={spread} reduced={!!reduced} active={active} />)}
        </svg>
        {coreModules.map(item => <CoreModule key={item.id} item={item} spread={spread} reduced={!!reduced} active={active} selected={selected}
          onHover={setHovered} onSelect={() => { setTerminal(false); setSelected(selected === item.id ? null : item.id); setHovered(null); }} />)}
        <button type="button" className="core-center" onClick={openTerminal} aria-label="Inicializar terminal do Developer Core" aria-expanded={terminal} aria-controls="core-terminal"><span aria-hidden="true">{"{ }"}</span><small>CORE</small></button>
      </div>
    </motion.div>
    <div className="core-detail" id="core-detail" aria-live="polite">
      {activeModule && !terminal ? <><strong>{activeModule.label}</strong><p>{activeModule.description}</p><span>{activeModule.stack}</span>{selected && <button type="button" onClick={() => { setSelected(null); setHovered(null); }} aria-label="Fechar detalhes do módulo">Fechar ×</button>}</> : !terminal && <><strong>Developer Core</strong><p>Explore os módulos de uma aplicação.</p><span>Selecione um símbolo · Arraste para girar</span></>}
    </div>
    {terminal && <div className="core-terminal" id="core-terminal" role="status"><span>› initializing developer core...</span><span>✓ UI connected</span><span>✓ API connected</span><span>✓ Worker running</span><span>✓ Database connected</span><strong>system ready_</strong><button type="button" onClick={() => setTerminal(false)} aria-label="Fechar terminal">×</button></div>}
    <button className="core-reset" type="button" onClick={() => { setSelected(null); setHovered(null); setTerminal(false); base.current = 0; x.set(0); y.set(0); }}>Restaurar objeto</button>
  </div>;
}

type CoreModuleProps = {
  item: typeof coreModules[number]; spread: MotionValue<number>; reduced: boolean;
  active: string | null; selected: string | null; onHover: (id: string | null) => void; onSelect: () => void;
};

function CoreModule({ item, spread, reduced, active, selected, onHover, onSelect }: CoreModuleProps) {
  const left = useTransform(spread, value => `${item.x + (item.x - 50) / 30 * value}%`);
  const top = useTransform(spread, value => `${item.y + (item.y - 49) / 30 * value}%`);
  const focused = active === item.id;
  return <motion.button type="button" className={`core-module core-module--${item.id}`} style={{ x: "-50%", y: "-50%", left: reduced ? `${item.x}%` : left, top: reduced ? `${item.y}%` : top }}
    animate={{ opacity: active && !focused ? .45 : 1 }}
    transition={{ duration: reduced ? 0 : .3 }} onPointerEnter={event => { if (event.pointerType === "mouse") onHover(item.id); }} onPointerLeave={() => onHover(null)}
    onFocus={() => onHover(item.id)} onBlur={() => onHover(null)} onClick={onSelect} aria-label={`Explorar ${item.label}`} aria-expanded={selected === item.id} aria-controls="core-detail">
    <motion.span className="core-symbol" aria-hidden="true" animate={{ scale: focused ? selected === item.id ? 1.3 : 1.12 : 1, z: reduced ? 0 : focused ? 60 : 30 }} transition={{ duration: reduced ? 0 : .3 }}>{item.symbol}</motion.span><span className="core-module-label">{item.label}</span>
  </motion.button>;
}

function CoreConnection({ item, spread, reduced, active }: Pick<CoreModuleProps, "item" | "spread" | "reduced" | "active">) {
  const x2 = useTransform(spread, value => item.x + (item.x - 50) / 30 * value);
  const y2 = useTransform(spread, value => item.y + (item.y - 49) / 30 * value);
  return <motion.g animate={{ opacity: active && active !== item.id ? .3 : 1 }}>
    <motion.line x1="50" y1="49" x2={reduced ? item.x : x2} y2={reduced ? item.y : y2} className={`core-line ${active === item.id ? "is-active" : ""}`} />
    <motion.line x1="50" y1="49" x2={reduced ? item.x : x2} y2={reduced ? item.y : y2} className="core-request" />
  </motion.g>;
}

