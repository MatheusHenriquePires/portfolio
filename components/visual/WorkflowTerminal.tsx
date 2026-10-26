"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { profile } from "@/data/profile";

/**
 * Terminal da página Sobre. Sozinho, ele digita o processo de trabalho em loop
 * (o estado é função do tempo `t`). Quando a pessoa digita um comando ou clica
 * numa etapa, a animação para e o terminal passa a responder aos comandos.
 */

type Kind = "cmd" | "ok" | "fail" | "info" | "text" | "error";
type Line = { kind: Kind; text: string; step: number };

const SCRIPT: Line[] = [
  { kind: "cmd", text: "analisar --com quem-usa", step: 0 },
  { kind: "ok", text: "rotina mapeada · o que ainda é feito à mão", step: 0 },
  { kind: "cmd", text: "levantar requisitos", step: 1 },
  { kind: "ok", text: "requisitos priorizados com quem usa", step: 1 },
  { kind: "cmd", text: "modelar dados arquitetura", step: 2 },
  { kind: "ok", text: "entidades, regras e API definidas", step: 2 },
  { kind: "cmd", text: "desenvolver interface api regras", step: 3 },
  { kind: "info", text: "python · java · node · mysql", step: 3 },
  { kind: "cmd", text: "testar", step: 4 },
  { kind: "fail", text: "permissões → corrigido", step: 4 },
  { kind: "ok", text: "todos os testes passando", step: 4 },
  { kind: "cmd", text: "publicar", step: 5 },
  { kind: "ok", text: "no ar · acompanhando o uso", step: 5 },
  { kind: "cmd", text: "feedback --reiniciar-ciclo", step: 5 },
];
const STEPS = ["Análise", "Levantamento", "Modelagem", "Desenvolvimento", "Testes", "Entrega"];

const CHAR_MS = 45;
const AFTER_CMD_MS = 450;
const AFTER_OUTPUT_MS = 350;
const HOLD_MS = 3200;

const TIMELINE = (() => {
  let at = 400;
  return SCRIPT.map(line => {
    const start = at;
    const end = line.kind === "cmd" ? start + line.text.length * CHAR_MS : start;
    at = end + (line.kind === "cmd" ? AFTER_CMD_MS : AFTER_OUTPUT_MS);
    return { start, end };
  });
})();
const TOTAL = TIMELINE[TIMELINE.length - 1].end + HOLD_MS;
const FINAL = TOTAL - HOLD_MS;

function frameAt(t: number) {
  const lines: { line: Line; shown: string; typing: boolean }[] = [];
  SCRIPT.forEach((line, i) => {
    const { start, end } = TIMELINE[i];
    if (t < start) return;
    const typing = line.kind === "cmd" && t < end;
    const chars = line.kind === "cmd" ? Math.min(line.text.length, Math.floor((t - start) / CHAR_MS)) : line.text.length;
    lines.push({ line, shown: line.text.slice(0, chars), typing });
  });
  const step = lines.length ? lines[lines.length - 1].line.step : 0;
  return { lines, step, done: t >= FINAL };
}

/** Comando e saída de cada etapa, tirados do roteiro. */
const stepLines = (step: number) => SCRIPT.filter(line => line.step === step && !line.text.startsWith("feedback"));
const STEP_COMMANDS: Record<string, number> = { analisar: 0, levantar: 1, modelar: 2, desenvolver: 3, testar: 4, publicar: 5 };

const out = (kind: Kind, text: string): Line => ({ kind, text, step: -1 });

function run(input: string): Line[] | "clear" | "replay" {
  const [name] = input.trim().toLowerCase().split(/\s+/);
  if (!name) return [];
  if (name in STEP_COMMANDS) return stepLines(STEP_COMMANDS[name]).filter(line => line.kind !== "cmd");
  switch (name) {
    case "help":
    case "ajuda":
      return [
        out("text", "comandos disponíveis:"),
        out("info", "analisar · levantar · modelar · desenvolver · testar · publicar"),
        out("info", "whoami · stack · contato · processo · clear"),
      ];
    case "whoami":
      return [out("ok", profile.name.toLowerCase().replace(" ", ".")), out("text", `${profile.role.toLowerCase()} · ${profile.location.replace(" • ", ", ")}`)];
    case "stack":
      return [out("info", "python · java · node.js · react · typescript"), out("info", "mysql · postgresql · fastapi · spring boot")];
    case "contato":
      return [out("ok", profile.email), out("text", profile.linkedin.replace("https://www.", ""))];
    case "processo":
    case "feedback":
      return "replay";
    case "clear":
    case "limpar":
      return "clear";
    default:
      return [out("error", `comando não encontrado: ${name}`), out("text", "digite help para ver os comandos")];
  }
}

const MARK: Record<Kind, string> = { cmd: "$", ok: "✓", fail: "✗", info: "›", text: " ", error: "!" };

export function WorkflowTerminal({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const linesRef = useRef<HTMLOListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const replayRef = useRef<() => void>(() => {});
  const stopRef = useRef<() => void>(() => {});
  const toggleRef = useRef<() => void>(() => {});
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const history = useRef<string[]>([]);
  const cursor = useRef(-1);
  const [t, setT] = useState(FINAL);
  const [log, setLog] = useState<Line[] | null>(null);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let manual = false;
    let timer = 0;
    let origin = 0;
    let now = 0;
    const stop = () => { window.clearInterval(timer); timer = 0; };
    const play = (fromStart = true) => {
      if (manual || pausedRef.current || reduced.matches || !visible || timer) return;
      origin = performance.now() - (fromStart ? 0 : now);
      if (fromStart) setT(0);
      timer = window.setInterval(() => { now = (performance.now() - origin) % TOTAL; setT(now); }, 40);
    };
    stopRef.current = () => { manual = true; stop(); };
    replayRef.current = () => { manual = false; pausedRef.current = false; setPaused(false); stop(); if (reduced.matches) setT(FINAL); else play(); };
    toggleRef.current = () => {
      pausedRef.current = !pausedRef.current;
      setPaused(pausedRef.current);
      if (pausedRef.current) stop(); else play(false);
    };
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) play(); else stop();
    }, { rootMargin: "80px" });
    observer.observe(node);
    const onChange = () => { stop(); if (reduced.matches) setT(FINAL); else play(); };
    reduced.addEventListener("change", onChange);
    return () => { stop(); observer.disconnect(); reduced.removeEventListener("change", onChange); };
  }, []);

  useEffect(() => {
    const list = linesRef.current;
    if (list && log) list.scrollTop = list.scrollHeight;
  }, [log]);

  /** Entra no modo interativo mantendo o que já está na tela. */
  const takeOver = () => {
    if (log) return log;
    stopRef.current();
    const base = frameAt(t).lines.filter(({ typing }) => !typing).map(({ line }) => line);
    setLog(base);
    return base;
  };

  const execute = (command: string) => {
    const base = takeOver();
    const result = run(command);
    if (result === "replay") { setLog(null); setActiveStep(null); replayRef.current(); return; }
    if (result === "clear") { setLog([]); setActiveStep(null); return; }
    const [name] = command.trim().toLowerCase().split(/\s+/);
    if (name in STEP_COMMANDS) setActiveStep(STEP_COMMANDS[name]);
    setLog([...base, { kind: "cmd", text: command.trim(), step: -1 }, ...result]);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!value.trim()) return;
    history.current = [value.trim(), ...history.current].slice(0, 20);
    cursor.current = -1;
    execute(value);
    setValue("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const next = Math.max(-1, Math.min(history.current.length - 1, cursor.current + (event.key === "ArrowUp" ? 1 : -1)));
    cursor.current = next;
    setValue(next < 0 ? "" : history.current[next]);
  };

  const runStep = (step: number) => {
    execute(stepLines(step)[0].text);
    inputRef.current?.focus({ preventScroll: true });
  };

  const auto = frameAt(t);
  const lines = log ? log.map(line => ({ line, shown: line.text, typing: false })) : auto.lines;
  const step = log ? activeStep : auto.done ? null : auto.step;
  const allDone = !log && auto.done;

  return <figure ref={ref} className={`workflow-terminal ${className}`} aria-label={`Como eu trabalho: ${STEPS.join(", ")}, com o feedback de quem usa reiniciando o ciclo.`}>
    <div className="workflow-terminal__window" onClick={() => inputRef.current?.focus({ preventScroll: true })}>
      <div className="terminal-bar"><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
        {!log && <button type="button" className="scene-pause scene-pause--inline" aria-pressed={paused} aria-label={paused ? "Continuar animação" : "Pausar animação"}
          onClick={event => { event.stopPropagation(); toggleRef.current(); }}>
          <span aria-hidden="true">{paused ? "▶" : "❚❚"}</span>{paused ? "Continuar" : "Pausar"}
        </button>}
        <small aria-hidden="true">_terminal · como eu trabalho</small>
      </div>
      <ol ref={linesRef} className="workflow-terminal__lines" aria-live={log ? "polite" : "off"} aria-label="Saída do terminal">
        {lines.map(({ line, shown, typing }, i) => <li key={i} className={`is-${line.kind}`}>
          <span className="workflow-terminal__mark" aria-hidden="true">{MARK[line.kind]}</span>
          <span>{shown}{typing && <span className="workflow-terminal__cursor" aria-hidden="true" />}</span>
        </li>)}
      </ol>
      <form className="workflow-terminal__prompt" onSubmit={onSubmit}>
        <label htmlFor="workflow-terminal-input" className="workflow-terminal__mark">$</label>
        <input id="workflow-terminal-input" ref={inputRef} value={value} autoComplete="off" autoCapitalize="none" spellCheck={false} enterKeyHint="send"
          placeholder="digite help ou clique numa etapa" aria-label="Digite um comando no terminal, por exemplo help"
          onChange={event => setValue(event.target.value)} onFocus={() => takeOver()} onKeyDown={onKeyDown} />
      </form>
      <ol className="workflow-terminal__steps" aria-label="Etapas do processo">
        {STEPS.map((name, i) => <li key={name}>
          <button type="button" onClick={event => { event.stopPropagation(); runStep(i); }}
            className={i === step ? "is-active" : allDone || (step !== null && i < step) ? "is-done" : undefined}
            aria-pressed={i === step} aria-label={`Executar a etapa ${name}`}>
            <b>0{i + 1}</b><span>{name}</span>
          </button>
        </li>)}
      </ol>
    </div>
    <figcaption className="label">Terminal interativo · digite help</figcaption>
  </figure>;
}
