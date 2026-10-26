"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { stages, systems, type VisualVariant } from "@/data/visuals";
import { SystemVisual } from "@/components/ui/SystemVisual";
import { disposeScene, glowTexture, textSprite, wire } from "@/lib/three-helpers";

const COLORS = [0x6be7ff, 0xc8ff32, 0xac98ff, 0xc8ff32];
const POINTS: [number, number, number][] = [[-3.1, .9, -.4], [-1.05, -.75, .8], [1.05, .9, -.2], [3.1, -.6, .6]];
const GEOMETRIES: Record<string, (() => THREE.BufferGeometry)[]> = {
  "arena-replay": [() => new THREE.CylinderGeometry(.4, .4, .75, 14), () => new THREE.SphereGeometry(.45, 12, 8), () => new THREE.OctahedronGeometry(.55), () => new THREE.ConeGeometry(.5, .85, 3)],
  genesis: [() => new THREE.CylinderGeometry(.5, .5, .8, 8), () => new THREE.DodecahedronGeometry(.5), () => new THREE.TorusGeometry(.4, .15, 8, 16), () => new THREE.BoxGeometry(.8, 1.05, .12)],
  arboreo: [() => new THREE.SphereGeometry(.45, 12, 8), () => new THREE.ConeGeometry(.5, .85, 4), () => new THREE.BoxGeometry(.75, .75, .75), () => new THREE.BoxGeometry(.8, 1.05, .12)],
  liga: [() => new THREE.OctahedronGeometry(.55), () => new THREE.IcosahedronGeometry(.5), () => new THREE.CylinderGeometry(.5, .5, .8, 8), () => new THREE.TorusGeometry(.4, .15, 8, 16)],
  jusradar: [() => new THREE.OctahedronGeometry(.55), () => new THREE.TorusKnotGeometry(.32, .1, 48, 6), () => new THREE.CylinderGeometry(.5, .5, .8, 6), () => new THREE.IcosahedronGeometry(.5)],
};

type Props = { variant: VisualVariant; interactive?: boolean; compact?: boolean; stage?: number | null; onStage?: (index: number | null) => void };

export function ProjectScene3D({ variant, interactive = false, compact = false, stage = null, onStage }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLElement | null)[]>([]);
  const readout = useRef<HTMLElement>(null);
  const focusRef = useRef<number | null>(stage);
  const onStageRef = useRef(onStage);
  const wake = useRef<() => void>(() => {});
  const [failed, setFailed] = useState(false);
  const system = systems[variant];
  const stageData = stages[variant];
  const clickable = interactive && !!stageData;

  useEffect(() => { onStageRef.current = onStage; }, [onStage]);
  useEffect(() => { focusRef.current = stage; wake.current(); }, [stage]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      queueMicrotask(() => setFailed(true));
      return;
    }
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    root.prepend(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, .1, 60);
    const world = new THREE.Group();
    scene.add(world);
    const glow = glowTexture();

    const grid = new THREE.GridHelper(14, 28, 0x6be7ff, 0x6be7ff);
    grid.position.y = -2.3;
    for (const material of [grid.material].flat()) { material.transparent = true; material.opacity = .12; material.depthWrite = false; }
    world.add(grid);
    world.position.y = compact ? .5 : .2;

    const curve = new THREE.CatmullRomCurve3(POINTS.map(point => new THREE.Vector3(...point)), false, "catmullrom", .5);
    world.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 120, .018, 6), new THREE.MeshBasicMaterial({ color: 0x6be7ff, transparent: true, opacity: .4 })));

    const geometries = GEOMETRIES[variant] ?? GEOMETRIES["arena-replay"];
    const nodes = system.nodes.map((_, index) => {
      const color = COLORS[index % COLORS.length];
      const geometry = geometries[index % geometries.length]();
      const group = new THREE.Group();
      const body = new THREE.Group();
      const fill = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .1 }));
      const edges = wire(geometry, color, .95);
      body.add(edges, fill);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color, transparent: true, opacity: .3, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.scale.setScalar(2.6);
      group.add(body, halo);
      group.position.copy(curve.getPoint(index / (system.nodes.length - 1)));
      world.add(group);
      return { t: index / (system.nodes.length - 1), group, body, fill, halo, edges, act: 0, fade: 1, sel: 0 };
    });

    const packetCount = 6;
    const packetPositions = new Float32Array(packetCount * 3);
    const packetGeometry = new THREE.BufferGeometry();
    packetGeometry.setAttribute("position", new THREE.BufferAttribute(packetPositions, 3));
    const packets = new THREE.Points(packetGeometry, new THREE.PointsMaterial({ size: .42, map: glow, color: 0xc8ff32, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    packets.frustumCulled = false;
    world.add(packets);

    // demonstração da etapa em foco: entrada → transformação → saída
    const demo = new THREE.Group();
    demo.visible = false;
    world.add(demo);
    const tokenCount = 5;
    const makeTokens = (color: number, sizeValue: number) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(tokenCount * 3), 3));
      const points = new THREE.Points(geometry, new THREE.PointsMaterial({ size: sizeValue, map: glow, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      points.frustumCulled = false;
      demo.add(points);
      return points;
    };
    const inTokens = makeTokens(0x6be7ff, .34);
    const outTokens = makeTokens(0xc8ff32, .46);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.95, .012, 6, 64), new THREE.MeshBasicMaterial({ color: 0xc8ff32, transparent: true, opacity: 0 }));
    demo.add(ring);
    const captions = (stageData ?? []).map(item => {
      const input = textSprite(`▸ ${item.input}`, "#6be7ff", 384, 0);
      const output = textSprite(`${item.output} ▸`, "#c8ff32", 384, 0);
      input.position.set(-2.1, 1.05, 0);
      output.position.set(2.1, 1.05, 0);
      input.visible = output.visible = false;
      demo.add(input, output);
      return { input, output };
    });

    const dust = new Float32Array(160 * 3);
    for (let i = 0; i < 160; i++) dust.set([(Math.random() - .5) * 11, (Math.random() - .5) * 6, (Math.random() - .5) * 6], i * 3);
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dust, 3));
    world.add(new THREE.Points(dustGeometry, new THREE.PointsMaterial({ size: .07, map: glow, color: 0x6be7ff, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending })));

    const size = { w: 1, h: 1 };
    const pointer = { x: 0, y: 0, hot: 0, hotTarget: 0 };
    const tmp = new THREE.Vector3();
    let visible = true;
    let raf = 0;
    let last = performance.now();
    let time = 0;
    let lastActive = -1;
    let awakeUntil = 0;
    let demoAlpha = 0;
    const look = new THREE.Vector3();
    const target = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const baseZ = () => Math.max(8, 11.4 / camera.aspect);

    function resize() {
      const rect = root!.getBoundingClientRect();
      size.w = Math.max(rect.width, 1);
      size.h = Math.max(rect.height, 1);
      renderer.setSize(size.w, size.h, false);
      camera.aspect = size.w / size.h;
      if (focusRef.current === null) camera.position.set(0, .6, baseZ());
      camera.updateProjectionMatrix();
    }

    function frame(now: number) {
      raf = 0;
      if (!visible) return;
      const dt = Math.min((now - last) / 1000, .05);
      last = now;
      const motion = reducedQuery.matches ? 0 : 1;
      pointer.hot += (pointer.hotTarget - pointer.hot) * (1 - Math.exp(-5 * dt));
      time += dt * motion * (1 + pointer.hot * 1.4);
      const focus = focusRef.current;
      const k = 1 - Math.exp(-4 * dt);

      const sway = focus === null ? 1 : 0;
      world.rotation.y += ((Math.sin(time * .35) * .16 + pointer.x * .4) * motion * sway - world.rotation.y) * (1 - Math.exp(-3 * dt));
      world.rotation.x += ((focus === null ? .16 + pointer.y * .22 * motion : .05) - world.rotation.x) * (1 - Math.exp(-3 * dt));

      if (focus !== null && nodes[focus]) {
        nodes[focus].group.getWorldPosition(target);
        look.lerp(target, k);
        camera.position.x += (target.x - camera.position.x) * k;
        camera.position.y += (target.y + .35 - camera.position.y) * k;
        camera.position.z += (Math.max(6, 10.4 / camera.aspect) - camera.position.z) * k;
      } else {
        look.lerp(target.set(0, 0, 0), k);
        camera.position.x += (0 - camera.position.x) * k;
        camera.position.y += (.6 - camera.position.y) * k;
        camera.position.z += (baseZ() - camera.position.z) * k;
      }
      camera.lookAt(look);

      demoAlpha += ((focus !== null ? 1 : 0) - demoAlpha) * k;
      demo.visible = demoAlpha > .02;
      packets.visible = focus === null && motion > 0;

      const positions = packetGeometry.attributes.position as THREE.BufferAttribute;
      const ts: number[] = [];
      for (let i = 0; i < packetCount; i++) {
        const t = motion ? (time * .09 + i / packetCount) % 1 : -1;
        ts.push(t);
        if (t >= 0) curve.getPoint(t, tmp); else tmp.set(0, -50, 0);
        positions.setXYZ(i, tmp.x, tmp.y, tmp.z);
      }
      positions.needsUpdate = true;

      let best = -1;
      let bestAct = .45;
      nodes.forEach((node, index) => {
        const focused = focus === index;
        const targetAct = focus !== null ? (focused ? .55 + .45 * Math.abs(Math.sin(time * 2.2)) : 0) : motion ? Math.max(...ts.map(t => Math.exp(-(((t - node.t) / .045) ** 2)))) : .25;
        node.act += (targetAct - node.act) * (1 - Math.exp(-9 * dt));
        node.sel += ((focused ? 1 : 0) - node.sel) * k;
        node.fade += ((focus !== null && !focused ? .2 : 1) - node.fade) * k;
        node.group.scale.setScalar((1 + .38 * node.act) * (1 + .55 * node.sel));
        node.body.rotation.y += dt * (.5 + node.act * 2 + node.sel * 1.5) * motion;
        node.body.rotation.x += dt * .22 * motion;
        node.halo.material.opacity = (.22 + .6 * node.act) * node.fade;
        node.fill.material.opacity = (.07 + .3 * node.act) * node.fade;
        node.edges.material.opacity = .95 * node.fade;
        if (node.act > bestAct) { best = index; bestAct = node.act; }
      });

      if (focus !== null && nodes[focus]) {
        demo.position.copy(nodes[focus].group.position);
        const place = (points: THREE.Points, from: number, spread: number, wave: number) => {
          const attribute = points.geometry.attributes.position as THREE.BufferAttribute;
          for (let i = 0; i < tokenCount; i++) {
            const phase = motion ? (time * .5 + i / tokenCount) % 1 : (i + .5) / tokenCount;
            attribute.setXYZ(i, from + phase * spread, Math.sin(phase * 6.28 + i * 1.7) * wave, Math.cos(phase * 6.28 + i) * wave * .8);
          }
          attribute.needsUpdate = true;
          (points.material as THREE.PointsMaterial).opacity = demoAlpha;
        };
        place(inTokens, -3.2, 2.5, .12);
        place(outTokens, .8, 2.6, .3);
        const pulse = motion ? (time * .8) % 1 : .5;
        ring.scale.setScalar(.8 + pulse * 1.1);
        (ring.material as THREE.MeshBasicMaterial).opacity = (1 - pulse) * .6 * demoAlpha;
        captions.forEach((caption, index) => {
          const shown = index === focus;
          caption.input.visible = caption.output.visible = shown;
          if (shown) { (caption.input.material as THREE.SpriteMaterial).opacity = demoAlpha * .95; (caption.output.material as THREE.SpriteMaterial).opacity = demoAlpha * .95; }
        });
      }

      const activeIndex = focus !== null ? focus : best;
      if (activeIndex !== lastActive && (activeIndex >= 0 || !motion)) {
        lastActive = activeIndex;
        labels.current.forEach((label, index) => label?.classList.toggle("is-active", index === activeIndex));
        if (readout.current && activeIndex >= 0) readout.current.textContent = `● ${system.nodes[activeIndex].title} — ${system.nodes[activeIndex].detail}`;
      }

      renderer.render(scene, camera);
      scene.updateMatrixWorld();
      nodes.forEach((node, index) => {
        const label = labels.current[index];
        if (!label) return;
        node.group.getWorldPosition(tmp);
        const depth = tmp.z;
        tmp.project(camera);
        label.style.transform = `translate3d(${(tmp.x * .5 + .5) * size.w}px, ${(-tmp.y * .5 + .5) * size.h}px, 0) translate(-50%, ${(compact ? 30 : 38) + node.sel * 62}px)`;
        label.style.opacity = String(Math.max(.72, Math.min(1, .85 + depth * .08)) * node.fade);
      });
      if (motion || now < awakeUntil) raf = requestAnimationFrame(frame);
    }

    function start() {
      awakeUntil = performance.now() + 1600;
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    const card = root.closest<HTMLElement>(".project-card, .case-visual") ?? root;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !interactive) return;
      const rect = root.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - .5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - .5) * 2;
      start();
    };
    const onEnter = () => { pointer.hotTarget = 1; start(); };
    const onLeave = () => { pointer.hotTarget = 0; pointer.x = pointer.y = 0; start(); };
    wake.current = start;
    const hit = (event: PointerEvent | MouseEvent) => {
      const rect = root.getBoundingClientRect();
      ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(nodes.map(node => node.fill));
      return hits.length ? nodes.findIndex(node => node.fill === hits[0].object) : -1;
    };
    const onClick = (event: MouseEvent) => { const index = hit(event); if (index >= 0) onStageRef.current?.(index); };
    const onHover = (event: PointerEvent) => { if (event.pointerType === "mouse") root.style.cursor = hit(event) >= 0 ? "pointer" : ""; };
    if (clickable) { root.addEventListener("click", onClick); root.addEventListener("pointermove", onHover); }
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerenter", onEnter);
    card.addEventListener("pointerleave", onLeave);
    reducedQuery.addEventListener("change", start);

    const resizeObserver = new ResizeObserver(() => { resize(); raf = 0; start(); });
    resizeObserver.observe(root);
    const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) start(); }, { rootMargin: "120px" });
    visibility.observe(root);
    resize();
    start();

    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
      visible = false;
      resizeObserver.disconnect();
      visibility.disconnect();
      root.removeEventListener("click", onClick);
      root.removeEventListener("pointermove", onHover);
      wake.current = () => {};
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerenter", onEnter);
      card.removeEventListener("pointerleave", onLeave);
      reducedQuery.removeEventListener("change", start);
      disposeScene(scene);
      glow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [variant, interactive, compact, system, stageData, clickable]);

  if (failed) return <SystemVisual variant={variant} compact={compact} interactive={interactive} />;

  return <div ref={rootRef} className={`pscene ${compact ? "pscene--compact" : ""}`} aria-hidden={clickable ? undefined : "true"}>
    {system.nodes.map((node, index) => {
      const content = <><b>{node.symbol}</b><i>{node.title}</i>{!compact && <small>{node.detail}</small>}</>;
      return clickable
        ? <button key={node.title} type="button" ref={el => { labels.current[index] = el; }} className="pscene-label pscene-label--button" aria-pressed={stage === index} aria-label={`Ver como funciona: ${node.title}`} onClick={() => onStageRef.current?.(index)}>{content}</button>
        : <span key={node.title} ref={el => { labels.current[index] = el; }} className="pscene-label">{content}</span>;
    })}
    <div className="pscene-readout" aria-hidden="true"><span>› {system.command}</span><strong ref={readout}>● {system.nodes[0].title} — {system.nodes[0].detail}</strong></div>
  </div>;
}
