"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import * as THREE from "three";
import { coreModules } from "@/data/developer-core";
import { disposeScene, glowTexture, textSprite, wire } from "@/lib/three-helpers";
import { DeveloperCore } from "./DeveloperCore";

type ModuleId = typeof coreModules[number]["id"];

const MODULES: Record<ModuleId, { dir: [number, number, number]; color: number; css: string; geometry: () => THREE.BufferGeometry }> = {
  api: { dir: [1, 1, 1], color: 0xc8ff32, css: "#c8ff32", geometry: () => new THREE.OctahedronGeometry(.6) },
  ui: { dir: [-1, -1, 1], color: 0x6be7ff, css: "#6be7ff", geometry: () => new THREE.BoxGeometry(.85, .85, .85) },
  data: { dir: [-1, 1, -1], color: 0xac98ff, css: "#ac98ff", geometry: () => new THREE.CylinderGeometry(.5, .5, .8, 6) },
  worker: { dir: [1, -1, -1], color: 0x6be7ff, css: "#6be7ff", geometry: () => new THREE.TorusGeometry(.48, .17, 8, 18) },
};
const RADIUS = 2.6;
const SNIPPETS = ["GET /api/v1", "SELECT * FROM", "async def run()", "useEffect(() =>", "POST 201", "queue.push(job)", "git commit -m", "docker compose up"];

export function DeveloperCore3D() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const labels = useRef<Record<string, HTMLButtonElement | null>>({});
  const coreButton = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ x: number; y: number; time: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const input = useRef({ yaw: -.5, pitch: .3, vyaw: 0, vpitch: 0, px: 0, py: 0, dragging: false, reduced: false });
  const live = useRef<{ hovered: string | null; selected: string | null; terminal: boolean }>({ hovered: null, selected: null, terminal: false });
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [terminal, setTerminal] = useState(false);
  const [failed, setFailed] = useState(false);
  const activeModule = coreModules.find(item => item.id === (selected || hovered));

  useEffect(() => { live.current = { hovered, selected, terminal }; }, [hovered, selected, terminal]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      queueMicrotask(() => setFailed(true));
      return;
    }
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    input.current.reduced = reducedQuery.matches;
    const onReduced = () => { input.current.reduced = reducedQuery.matches; };
    reducedQuery.addEventListener("change", onReduced);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    stage.prepend(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0b0d10, 8, 17);
    const camera = new THREE.PerspectiveCamera(40, 1, .1, 50);
    camera.position.set(0, 0, 8.4);
    const root = new THREE.Group();
    scene.add(root);
    const glow = glowTexture();

    // núcleo
    const core = new THREE.Group();
    const coreWire = wire(new THREE.IcosahedronGeometry(1, 1), 0x6be7ff, .85);
    const coreInner = new THREE.Mesh(new THREE.IcosahedronGeometry(.62, 0), new THREE.MeshBasicMaterial({ color: 0xc8ff32, transparent: true, opacity: .28 }));
    const coreHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xc8ff32, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending }));
    coreHalo.scale.setScalar(4);
    const rings = [0, 1].map(index => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.55 + index * .22, .008, 6, 120), new THREE.MeshBasicMaterial({ color: index ? 0x7b61ff : 0x6be7ff, transparent: true, opacity: .6 }));
      ring.rotation.set(Math.PI / 2 + index * .6, index * .8, 0);
      return ring;
    });
    core.add(coreWire, coreInner, coreHalo, ...rings);
    root.add(core);

    // módulos, conexões e pacotes
    const ids = coreModules.map(item => item.id) as ModuleId[];
    const nodes = ids.map(id => {
      const spec = MODULES[id];
      const base = new THREE.Vector3(...spec.dir).normalize().multiplyScalar(RADIUS);
      const group = new THREE.Group();
      const geometry = spec.geometry();
      const body = new THREE.Group();
      const edges = wire(geometry, spec.color, 1);
      const fill = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: .1 }));
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: spec.color, transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.scale.setScalar(2.2);
      body.add(edges, fill);
      group.add(body, halo);
      group.position.copy(base);
      const linkGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), base.clone()]);
      const link = new THREE.Line(linkGeometry, new THREE.LineBasicMaterial({ color: spec.color, transparent: true, opacity: .3 }));
      root.add(group, link);
      const mats: [THREE.Material & { opacity: number }, number][] = [[edges.material as THREE.LineBasicMaterial, 1], [fill.material, .1], [halo.material, .45], [link.material, .3]];
      return { id, base, group, body, link, mats, scale: 1, fade: 1, focus: new THREE.Quaternion().setFromUnitVectors(base.clone().normalize(), new THREE.Vector3(0, 0, 1)) };
    });

    const packetCount = nodes.length * 3;
    const packetPositions = new Float32Array(packetCount * 3);
    const packetColors = new Float32Array(packetCount * 3);
    for (let i = 0; i < packetCount; i++) new THREE.Color(MODULES[nodes[i % nodes.length].id].color).toArray(packetColors, i * 3);
    const packetGeometry = new THREE.BufferGeometry();
    packetGeometry.setAttribute("position", new THREE.BufferAttribute(packetPositions, 3));
    packetGeometry.setAttribute("color", new THREE.BufferAttribute(packetColors, 3));
    const packets = new THREE.Points(packetGeometry, new THREE.PointsMaterial({ size: .32, map: glow, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    packets.frustumCulled = false;
    root.add(packets);

    // campo de partículas e trechos de código
    const field = new THREE.Group();
    scene.add(field);
    const count = 520;
    const fieldPositions = new Float32Array(count * 3);
    const fieldColors = new Float32Array(count * 3);
    const palette = [new THREE.Color(0x6be7ff), new THREE.Color(0xc8ff32), new THREE.Color(0x7b61ff)];
    for (let i = 0; i < count; i++) {
      const r = 3.8 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      fieldPositions.set([r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi) * .8, r * Math.sin(phi) * Math.sin(theta)], i * 3);
      palette[i % 3].toArray(fieldColors, i * 3);
    }
    const fieldGeometry = new THREE.BufferGeometry();
    fieldGeometry.setAttribute("position", new THREE.BufferAttribute(fieldPositions, 3));
    fieldGeometry.setAttribute("color", new THREE.BufferAttribute(fieldColors, 3));
    field.add(new THREE.Points(fieldGeometry, new THREE.PointsMaterial({ size: .09, map: glow, vertexColors: true, transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending })));
    const snippets = SNIPPETS.map((text, index) => {
      const sprite = textSprite(text, ["#6be7ff", "#c8ff32", "#ac98ff"][index % 3]);
      field.add(sprite);
      return { sprite, angle: (index / SNIPPETS.length) * Math.PI * 2, radius: 4.2 + (index % 3) * .7, y: ((index * 37) % 9 - 4) * .55, speed: .05 + (index % 4) * .012 };
    });

    // loop
    const size = { w: 1, h: 1 };
    const tmp = new THREE.Vector3();
    const euler = new THREE.Euler(0, 0, 0, "YXZ");
    const userQ = new THREE.Quaternion();
    let visible = true;
    let raf = 0;
    let last = performance.now();
    let time = 0;

    function resize() {
      const rect = stage!.getBoundingClientRect();
      size.w = Math.max(rect.width, 1);
      size.h = Math.max(rect.height, 1);
      renderer.setSize(size.w, size.h, false);
      camera.aspect = size.w / size.h;
      camera.updateProjectionMatrix();
    }

    function place(el: HTMLElement | null, point: THREE.Vector3, dim: number) {
      if (!el) return;
      const depth = point.z;
      point.project(camera);
      el.style.transform = `translate3d(${(point.x * .5 + .5) * size.w}px, ${(-point.y * .5 + .5) * size.h}px, 0) translate(-50%, -50%)`;
      el.style.opacity = String(Math.max(.35, Math.min(1, .65 + depth * .12)) * dim);
      el.style.zIndex = String(Math.round(depth * 10) + 50);
    }

    function frame(now: number) {
      raf = 0;
      if (!visible) return;
      const dt = Math.min((now - last) / 1000, .05);
      last = now;
      const st = live.current;
      const inp = input.current;
      const motion = inp.reduced ? 0 : 1;
      const active = st.selected || st.hovered;
      time += dt * motion;

      const rect = rootRef.current?.getBoundingClientRect();
      const progress = rect ? Math.max(0, Math.min(1, -rect.top / Math.max(rect.height, 1))) : 0;
      const spread = 1 + progress * .35;

      if (!inp.dragging) {
        if (!motion) { inp.vyaw = inp.vpitch = 0; }
        else if (!active && !st.terminal) inp.yaw += .14 * dt;
        inp.yaw += inp.vyaw * dt;
        inp.pitch += inp.vpitch * dt;
        const decay = Math.exp(-3 * dt);
        inp.vyaw *= decay;
        inp.vpitch *= decay;
      }
      inp.pitch = Math.max(-.9, Math.min(.9, inp.pitch));
      userQ.setFromEuler(euler.set(inp.pitch, inp.yaw, 0));
      const focus = nodes.find(node => node.id === st.selected);
      root.quaternion.slerp(focus ? focus.focus : userQ, 1 - Math.exp(-(inp.dragging ? 35 : focus ? 5 : 8) * dt));

      camera.position.x += (inp.px * .5 - camera.position.x) * (1 - Math.exp(-3 * dt));
      camera.position.y += (-inp.py * .3 - camera.position.y) * (1 - Math.exp(-3 * dt));
      camera.position.z += ((focus ? 6.3 : 8.4) - camera.position.z) * (1 - Math.exp(-4 * dt));
      camera.lookAt(0, 0, 0);

      const pulse = st.terminal ? .14 * Math.sin(time * 9) : .06 * Math.sin(time * 2);
      coreInner.scale.setScalar(1 + pulse);
      (coreHalo.material as THREE.SpriteMaterial).opacity = .55 + (st.terminal ? .3 * Math.sin(time * 9) : .1 * Math.sin(time * 2));
      coreWire.rotation.y += dt * .25 * motion;
      coreWire.rotation.x += dt * .12 * motion;
      rings[0].rotation.z += dt * .3 * motion;
      rings[1].rotation.z -= dt * .2 * motion;

      for (const node of nodes) {
        node.group.position.copy(node.base).multiplyScalar(spread);
        const targetScale = st.selected === node.id ? 1.4 : st.hovered === node.id ? 1.18 : 1;
        const targetFade = active && active !== node.id ? .3 : 1;
        const k = 1 - Math.exp(-8 * dt);
        node.scale += (targetScale - node.scale) * k;
        node.fade += (targetFade - node.fade) * k;
        node.group.scale.setScalar(node.scale);
        node.body.rotation.y += dt * .6 * motion;
        node.body.rotation.x += dt * .25 * motion;
        node.link.scale.setScalar(spread);
        for (const [material, base] of node.mats) material.opacity = (active === node.id && material === node.link.material ? .95 : base) * node.fade;
      }

      packets.visible = motion > 0;
      if (motion) {
        for (let i = 0; i < packetCount; i++) {
          const node = nodes[i % nodes.length];
          const phase = (time * .32 + i * .21) % 1;
          const p = phase < .5 ? phase * 2 : 2 - phase * 2;
          const eased = p * p * (3 - 2 * p) * spread;
          packetPositions[i * 3] = node.base.x * eased;
          packetPositions[i * 3 + 1] = node.base.y * eased;
          packetPositions[i * 3 + 2] = node.base.z * eased;
        }
        packetGeometry.attributes.position.needsUpdate = true;
      }

      field.rotation.y = inp.yaw * .3 + time * .02;
      for (const item of snippets) {
        const a = item.angle + time * item.speed;
        item.sprite.position.set(Math.cos(a) * item.radius, item.y, Math.sin(a) * item.radius);
      }

      renderer.render(scene, camera);
      scene.updateMatrixWorld();
      for (const node of nodes) place(labels.current[node.id], node.group.getWorldPosition(tmp), node.fade);
      place(coreButton.current, tmp.set(0, 0, 0).applyMatrix4(root.matrixWorld), 1);
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    const resizeObserver = new ResizeObserver(() => { resize(); if (!raf) { raf = requestAnimationFrame(frame); } });
    resizeObserver.observe(stage);
    const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) start(); }, { rootMargin: "60px" });
    visibility.observe(stage);
    resize();
    start();

    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
      visible = false;
      resizeObserver.disconnect();
      visibility.disconnect();
      reducedQuery.removeEventListener("change", onReduced);
      disposeScene(scene);
      glow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  function move(event: PointerEvent<HTMLDivElement>) {
    const inp = input.current;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.pointerType === "mouse") {
      inp.px = ((event.clientX - bounds.left) / bounds.width - .5) * 2;
      inp.py = ((event.clientY - bounds.top) / bounds.height - .5) * 2;
    }
    const d = drag.current;
    if (!d || inp.reduced) return;
    const dx = event.clientX - d.x;
    const dy = event.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    if (!d.moved) {
      d.moved = true;
      inp.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      if (live.current.selected) setSelected(null);
    }
    const now = performance.now();
    const elapsed = Math.max((now - d.time) / 1000, .008);
    inp.yaw += dx * .008;
    inp.vyaw = Math.max(-4, Math.min(4, (dx * .008) / elapsed));
    if (event.pointerType === "mouse") {
      inp.pitch += dy * .006;
      inp.vpitch = Math.max(-3, Math.min(3, (dy * .006) / elapsed));
    }
    d.x = event.clientX;
    d.y = event.clientY;
    d.time = now;
  }

  function release(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (drag.current?.moved) { suppressClick.current = true; setTimeout(() => { suppressClick.current = false; }, 0); }
    drag.current = null;
    input.current.dragging = false;
  }

  function reset() {
    setSelected(null); setHovered(null); setTerminal(false);
    Object.assign(input.current, { yaw: -.5, pitch: .3, vyaw: 0, vpitch: 0 });
  }

  function openTerminal() {
    setSelected(null); setHovered(null); setTerminal(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setTerminal(false), 4500);
  }

  if (failed) return <DeveloperCore />;

  return <div ref={rootRef} className="developer-core hero-system" role="group" aria-label="Developer Core: arquitetura interativa em 3D"
    onPointerMove={move}
    onPointerDown={event => { if (event.button === 0) drag.current = { x: event.clientX, y: event.clientY, time: performance.now(), moved: false }; }}
    onPointerUp={release}
    onPointerCancel={event => { drag.current = null; input.current.dragging = false; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
    onPointerLeave={() => { input.current.px = 0; input.current.py = 0; if (!drag.current) setHovered(null); }}
    onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}
    onClick={event => { if (!(event.target as Element).closest("button")) { setSelected(null); setHovered(null); setTerminal(false); } }}
    onKeyDown={event => { if (event.key === "Escape") { setSelected(null); setHovered(null); setTerminal(false); } }}>
    <div className="core-ambient" aria-hidden="true" />
    <div ref={stageRef} className="core3d-stage">
      {coreModules.map(item => <button key={item.id} type="button" ref={el => { labels.current[item.id] = el; }} className="core3d-label" style={{ "--tone": MODULES[item.id].css } as CSSProperties}
        onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(item.id); }} onPointerLeave={() => setHovered(null)}
        onFocus={() => setHovered(item.id)} onBlur={() => setHovered(null)}
        onClick={() => { setTerminal(false); setSelected(selected === item.id ? null : item.id); setHovered(null); }}
        aria-label={`Explorar ${item.label}`} aria-expanded={selected === item.id} aria-controls="core-detail">
        <b aria-hidden="true">{item.symbol}</b><small>{item.label}</small>
      </button>)}
      <button type="button" ref={coreButton} className="core3d-label core3d-core" onClick={openTerminal} aria-label="Inicializar terminal do Developer Core" aria-expanded={terminal} aria-controls="core-terminal"><b aria-hidden="true">{"{ }"}</b><small>CORE</small></button>
    </div>
    <div className="core-detail" id="core-detail" aria-live="polite">
      {activeModule && !terminal ? <><strong>{activeModule.label}</strong><p>{activeModule.description}</p><span>{activeModule.stack}</span>{selected && <button type="button" onClick={() => { setSelected(null); setHovered(null); }} aria-label="Fechar detalhes do módulo">Fechar ×</button>}</> : !terminal && <><strong>Developer Core</strong><p>Explore os módulos de uma aplicação.</p><span>Selecione um módulo · Arraste para girar</span></>}
    </div>
    {terminal && <div className="core-terminal" id="core-terminal" role="status"><span>› initializing developer core...</span><span>✓ UI connected</span><span>✓ API connected</span><span>✓ Worker running</span><span>✓ Database connected</span><strong>system ready_</strong><button type="button" onClick={() => setTerminal(false)} aria-label="Fechar terminal">×</button></div>}
    <button className="core-reset" type="button" onClick={reset}>Restaurar objeto</button>
  </div>;
}
