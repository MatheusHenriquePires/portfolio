"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ProjectScene } from "@/components/visual/ProjectScene";
import { disposeScene, glowTexture, textSprite } from "@/lib/three-helpers";
import { arc, bump, canvasTexture, createPeople, ease, span, track, within, type Key, type V3 } from "@/lib/scene-kit";

/**
 * Cena da quadra do Arena Replay: rally → ponto → o atleta corre até o botão no canto →
 * sinal pelo cabo até o switch (Zero Delay) → agente → backend → galeria.
 * Tudo é função do tempo `t` (0..LOOP), então avançar/voltar etapas é só mover `t`.
 */

const LOOP = 18;
/** Início de cada etapa, na ordem de `systems["arena-replay"].nodes` (Câmera, Evento, Agente, Clipe/Web). */
const SEGMENTS = [0, 3, 8.6, 12, LOOP];
/** Quadro fixo de cada etapa quando o usuário prefere movimento reduzido. */
const STILLS = [1.95, 6.9, 10.8, 15.8];
const segmentAt = (t: number) => Math.max(0, SEGMENTS.findIndex((start, i) => i < SEGMENTS.length - 1 && t >= start && t < SEGMENTS[i + 1]));

const LIME = 0xc8ff32;
const CYAN = 0x6be7ff;
const VIOLET = 0xac98ff;

// ---------- roteiro ----------

const BALL: [number, number, V3, V3, number][] = [
  [0, 1.1, [-3.0, .75, -1.1], [1.0, 1.2, .55], 2.0],
  [1.1, 1.7, [1.0, 1.2, .55], [1.2, 1.9, -1.05], 1.0],
  [1.7, 2.1, [1.2, 1.9, -1.05], [-2.7, .09, 1.3], 0],
  [2.1, 2.75, [-2.7, .09, 1.3], [-3.9, .09, 1.9], .45],
  [2.75, 3.3, [-3.9, .09, 1.9], [-4.3, .09, 2.1], .12],
];
const BALL_REST: V3 = [-4.3, .09, 2.1];

const HERO: Key[] = [[0, 1.9, -1.3], [1.0, 1.9, -1.3], [1.45, 1.3, -1.1], [3.0, 1.3, -1.1], [4.2, 2.25, 0], [4.8, 2.25, 0], [6.1, 4.72, 2.52], [7.5, 4.72, 2.52], [8.7, 3.4, 1.1], [LOOP, 3.4, 1.1]];
const DEFENDER: Key[] = [[0, -3.2, 1.1], [1.85, -3.2, 1.1], [2.15, -2.85, 1.25], [LOOP, -2.85, 1.25]];
const BLOCKER: Key[] = [[0, -1.0, -.2], [1.0, -1.0, -.2], [1.4, -.38, -1.0], [LOOP, -.38, -1.0]];

const LABELS: { symbol: string; title: string; detail: string; at: V3; on: [number, number] }[] = [
  { symbol: "REC", title: "CÂMERA", detail: "grava a quadra", at: [-5.4, 3.5, -2.9], on: [0, 3] },
  { symbol: "●", title: "BOTÃO", detail: "canto da quadra", at: [5.05, 1.0, 2.85], on: [5.6, 7.3] },
  { symbol: "USB", title: "SWITCH", detail: "Zero Delay", at: [5.95, .9, 2.25], on: [7.3, 8.6] },
  { symbol: "{ }", title: "AGENTE", detail: "Python + FFmpeg", at: [6.85, 1.62, .05], on: [8.6, 12] },
  { symbol: "API", title: "BACKEND", detail: "Next.js + R2", at: [5.0, 4.5, -1.6], on: [12, 14.4] },
  { symbol: "▷", title: "GALERIA", detail: "replay publicado", at: [.8, 3.85, -3.6], on: [14.4, LOOP] },
];

const NARRATION: [number, string][] = [
  [0, "rally em andamento · a câmera grava a quadra"],
  [2.1, "ponto!"],
  [3.0, "o atleta corre para o meio da quadra…"],
  [4.8, "…e vai até o botão no canto"],
  [6.5, "botão pressionado · o sinal sai pelo cabo"],
  [7.4, "o switch Zero Delay entrega o código via USB"],
  [8.6, "o agente lê: code=288 → quadra_1"],
  [10.4, "MP4 gerado: 15 s antes + 5 s depois"],
  [11.2, "o replay entra na fila SQLite"],
  [12.0, "POST /api/replays → URL pré-assinada"],
  [13.4, "upload do MP4 direto para o Cloudflare R2"],
  [14.4, "replay publicado na galeria da arena"],
];

const LOG: [number, string, string][] = [
  [0, "$ replay-agent", "#7d8794"],
  [0, "STREAM quadra_1 | buffer 1 s ●", "#6be7ff"],
  [8.6, "BUTTON | code=288 | quadra=quadra_1", "#c8ff32"],
  [9.4, "REPLAY | -15 s … +5 s", "#e8eef5"],
  [10.4, "MP4 | replay_quadra_1.mp4", "#e8eef5"],
  [11.2, "QUEUE | sqlite +1", "#ac98ff"],
  [12.4, "POST /api/replays → 201", "#6be7ff"],
  [13.4, "PUT R2 ↑ upload", "#6be7ff"],
  [14.4, "COMPLETE ✓ galeria", "#c8ff32"],
];

// ---------- peças ----------

function drawGallery(g: CanvasRenderingContext2D, fresh: boolean) {
  const W = 640, H = 400;
  g.fillStyle = "#0e1217"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#171d25"; g.fillRect(0, 0, W, 38);
  ["#ff6b6b", "#ffd36b", "#6bff95"].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(20 + i * 18, 19, 5, 0, Math.PI * 2); g.fill(); });
  g.fillStyle = "#0e1217"; g.fillRect(80, 9, 420, 20);
  g.font = "600 13px monospace"; g.fillStyle = "#8b95a3"; g.textBaseline = "middle";
  g.fillText("replaybrasil.online/arenas/arena", 92, 19);
  g.font = "700 20px sans-serif"; g.fillStyle = "#e8eef5"; g.fillText("Replays · Arena", 24, 66);
  const tileW = 186, tileH = 128;
  for (let i = 0; i < 6; i++) {
    const x = 24 + (i % 3) * (tileW + 12), y = 92 + Math.floor(i / 3) * (tileH + 30);
    if (i === 0 && !fresh) {
      g.setLineDash([6, 6]); g.strokeStyle = "#3a4452"; g.lineWidth = 2; g.strokeRect(x, y, tileW, tileH); g.setLineDash([]);
      g.font = "600 13px monospace"; g.fillStyle = "#5c6673"; g.fillText("aguardando…", x + 46, y + tileH / 2);
      continue;
    }
    const hi = i === 0;
    const grad = g.createLinearGradient(x, y, x + tileW, y + tileH);
    grad.addColorStop(0, hi ? "#24402a" : "#1a2230"); grad.addColorStop(1, hi ? "#1a2c3c" : "#141a24");
    g.fillStyle = grad; g.fillRect(x, y, tileW, tileH);
    g.strokeStyle = hi ? "#c8ff32" : "#2a3340"; g.lineWidth = hi ? 4 : 1; g.strokeRect(x, y, tileW, tileH);
    g.strokeStyle = hi ? "#c8ff3288" : "#ffffff22"; g.lineWidth = 1.5;
    g.strokeRect(x + 30, y + 30, tileW - 60, tileH - 60); g.beginPath(); g.moveTo(x + tileW / 2, y + 30); g.lineTo(x + tileW / 2, y + tileH - 30); g.stroke();
    g.fillStyle = hi ? "#c8ff32" : "#ffffff99"; g.beginPath(); g.moveTo(x + tileW / 2 - 12, y + tileH / 2 - 16); g.lineTo(x + tileW / 2 + 16, y + tileH / 2); g.lineTo(x + tileW / 2 - 12, y + tileH / 2 + 16); g.closePath(); g.fill();
    g.font = "600 13px monospace"; g.fillStyle = hi ? "#c8ff32" : "#8b95a3";
    const minute = (i * 13) % 60;
    g.fillText(hi ? "NOVO · quadra_1 · agora" : `quadra_${(i % 2) + 1} · ${18 - Math.floor(i / 2)}:${minute < 10 ? "0" : ""}${minute}`, x, y + tileH + 15);
  }
}

function drawTerminal(g: CanvasRenderingContext2D, lines: [number, string, string][]) {
  const W = 512, H = 320;
  g.fillStyle = "#07090c"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#141920"; g.fillRect(0, 0, W, 30);
  g.font = "600 14px monospace"; g.fillStyle = "#8b95a3"; g.textBaseline = "middle";
  g.fillText("replay-agent · arena", 14, 15);
  g.font = "600 17px monospace";
  lines.slice(-9).forEach(([, text, color], i) => { g.fillStyle = color; g.fillText(text, 14, 52 + i * 30); });
}

export function CourtScene3D({ stage, onStage }: { stage: number; onStage?: (index: number | null) => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLElement | null)[]>([]);
  const readout = useRef<HTMLElement>(null);
  const timeRef = useRef(SEGMENTS[stage] ?? 0);
  const stageRef = useRef(stage);
  const onStageRef = useRef(onStage);
  const wake = useRef<() => void>(() => {});
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => { onStageRef.current = onStage; }, [onStage]);
  useEffect(() => {
    stageRef.current = stage;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) timeRef.current = STILLS[stage] ?? 0;
    else if (segmentAt(timeRef.current) !== stage) timeRef.current = SEGMENTS[stage] ?? 0;
    wake.current();
  }, [stage]);

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    root.prepend(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, .1, 80);
    const glow = glowTexture();
    scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x1a1530, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(3, 9, 7);
    scene.add(sun);

    const basic = (color: number, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity });
    const solid = (color: number, roughness = .7) => new THREE.MeshStandardMaterial({ color, roughness, metalness: .05 });
    const box = (w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      return mesh;
    };
    const halo = (color: number, scale: number, opacity = 0) => {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
      sprite.scale.setScalar(scale);
      scene.add(sprite);
      return sprite;
    };

    // ---------- quadra ----------
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), solid(0x10151c, .95));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(.8, 0, .2);
    scene.add(floor);
    const court = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), solid(0x1d3550, .85));
    court.rotation.x = -Math.PI / 2;
    court.position.y = .002;
    scene.add(court);
    const linePoints = [[-4.5, -2.25, 4.5, -2.25], [4.5, -2.25, 4.5, 2.25], [4.5, 2.25, -4.5, 2.25], [-4.5, 2.25, -4.5, -2.25], [0, -2.25, 0, 2.25], [-1.5, -2.25, -1.5, 2.25], [1.5, -2.25, 1.5, 2.25]]
      .flatMap(([x1, z1, x2, z2]) => [x1, .005, z1, x2, .005, z2]);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePoints, 3));
    scene.add(new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({ color: 0xe8f0ff, transparent: true, opacity: .75 })));

    const postMaterial = solid(0xd8dee8, .4);
    for (const z of [-2.55, 2.55]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 1.25, 10), postMaterial);
      post.position.set(0, .625, z);
      scene.add(post);
    }
    const net = new THREE.Mesh(new THREE.PlaneGeometry(5.1, .45, 34, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: .32 }));
    net.rotation.y = Math.PI / 2;
    net.position.set(0, .98, 0);
    scene.add(net);
    box(.02, .045, 5.1, basic(0xffffff), 0, 1.2, 0);

    // ---------- câmera de segurança ----------
    box(.06, 3, .06, solid(0x2a313b), -5.4, 1.5, -3.05);
    const cctv = new THREE.Group();
    cctv.position.set(-5.4, 3.0, -2.9);
    cctv.add(new THREE.Mesh(new THREE.BoxGeometry(.18, .16, .38), solid(0xe5e9ef, .5)));
    scene.add(cctv);
    cctv.lookAt(0, 0, 0);
    const recDot = halo(0xff4d4d, .35, .9);
    recDot.position.set(-5.4, 3.16, -2.9);
    const frustum = new THREE.BufferGeometry();
    frustum.setAttribute("position", new THREE.Float32BufferAttribute([[-4.5, -2.25], [4.5, -2.25], [4.5, 2.25], [-4.5, 2.25]].flatMap(([x, z]) => [-5.4, 2.95, -2.85, x, .01, z]), 3));
    const frustumLines = new THREE.LineSegments(frustum, new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: .12 }));
    scene.add(frustumLines);

    // ---------- botão, switch, agente ----------
    box(.05, .55, .05, solid(0x2a313b), 5.05, .275, 2.85);
    box(.2, .14, .2, solid(0x1b2129), 5.05, .6, 2.85);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, .05, 20), new THREE.MeshStandardMaterial({ color: LIME, emissive: LIME, emissiveIntensity: .25 }));
    cap.position.set(5.05, .695, 2.85);
    scene.add(cap);
    const capGlow = halo(LIME, .9);
    capGlow.position.set(5.05, .72, 2.85);

    box(.55, .42, .45, solid(0x1a212b), 5.95, .21, 2.25);
    box(.5, .09, .3, solid(0x2b3542, .5), 5.95, .465, 2.25);
    const leds = [0, 1, 2, 3].map(i => {
      const led = new THREE.Mesh(new THREE.SphereGeometry(.018, 8, 6), basic(0x334033));
      led.position.set(5.79 + i * .1, .47, 2.405);
      scene.add(led);
      return led;
    });
    const switchGlow = halo(LIME, 1.1);
    switchGlow.position.set(5.95, .5, 2.3);

    const tableMaterial = solid(0x262e39);
    box(1.0, .05, 1.3, tableMaterial, 6.6, .55, .3);
    for (const [x, z] of [[6.15, -.3], [7.05, -.3], [6.15, .9], [7.05, .9]]) box(.04, .53, .04, tableMaterial, x, .265, z);
    box(.22, .45, .4, solid(0x1b2129), 7.0, .8, .75);
    const towerLed = halo(CYAN, .25, .8);
    towerLed.position.set(7.0, .95, .96);
    let logCount = -1;
    const terminalCanvas = document.createElement("canvas");
    terminalCanvas.width = 512;
    terminalCanvas.height = 320;
    const terminalTexture = new THREE.CanvasTexture(terminalCanvas);
    terminalTexture.colorSpace = THREE.SRGBColorSpace;
    const monitor = new THREE.Group();
    monitor.position.set(6.78, 1.0, .1);
    monitor.rotation.y = -.62;
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.0, .64, .04), solid(0x0c0f13, .4));
    bezel.position.z = -.025;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(.94, .58), new THREE.MeshBasicMaterial({ map: terminalTexture, toneMapped: false }));
    const stand = new THREE.Mesh(new THREE.BoxGeometry(.06, .2, .06), solid(0x0c0f13));
    stand.position.set(0, -.4, -.04);
    monitor.add(bezel, screen, stand);
    scene.add(monitor);

    // fila SQLite e arquivo MP4
    const queueMaterial = new THREE.MeshBasicMaterial({ color: VIOLET, transparent: true, opacity: .35 });
    for (const y of [.6, .66]) box(.26, .05, .34, queueMaterial, 6.85, y, -.2);
    const queueTag = textSprite("fila", "#ac98ff", 192, .8);
    queueTag.scale.multiplyScalar(.45);
    queueTag.position.set(6.85, .82, -.2);
    scene.add(queueTag);
    const file = new THREE.Group();
    const fileGeometry = new THREE.BoxGeometry(.24, .32, .03);
    const fileFill = new THREE.Mesh(fileGeometry, new THREE.MeshBasicMaterial({ color: LIME, transparent: true, opacity: .3 }));
    const fileEdges = new THREE.LineSegments(new THREE.EdgesGeometry(fileGeometry), new THREE.LineBasicMaterial({ color: LIME }));
    const fileTag = textSprite("MP4", "#c8ff32", 128, 1);
    fileTag.scale.multiplyScalar(.5);
    fileTag.position.y = .3;
    file.add(fileFill, fileEdges, fileTag);
    scene.add(file);

    // ---------- backend (nuvem) e galeria ----------
    const cloud = new THREE.Group();
    cloud.position.set(5.0, 3.8, -1.6);
    const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0x2c2d52, emissive: VIOLET, emissiveIntensity: .25, transparent: true, opacity: .85, roughness: .4 });
    for (const [x, y, z, r] of [[-.45, -.05, 0, .32], [0, .12, 0, .42], [.45, -.02, .05, .34], [.15, -.15, .2, .3], [-.15, -.12, -.2, .3]]) {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), cloudMaterial);
      puff.position.set(x, y, z);
      cloud.add(puff);
    }
    scene.add(cloud);
    const cloudGlow = halo(VIOLET, 2.6, .25);
    cloudGlow.position.copy(cloud.position);
    const cloudRing = new THREE.Mesh(new THREE.TorusGeometry(.7, .012, 6, 48), new THREE.MeshBasicMaterial({ color: LIME, transparent: true, opacity: 0 }));
    cloudRing.position.copy(cloud.position);
    scene.add(cloudRing);

    const galleryCanvas = (fresh: boolean) => canvasTexture(640, 400, g => drawGallery(g, fresh));
    const galleryBefore = galleryCanvas(false);
    const galleryAfter = galleryCanvas(true);
    const gallery = new THREE.Group();
    gallery.position.set(.8, 2.75, -3.6);
    gallery.rotation.y = .12;
    const galleryScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.24, 1.4), new THREE.MeshBasicMaterial({ map: galleryBefore, toneMapped: false }));
    const galleryFrame = new THREE.Mesh(new THREE.BoxGeometry(2.34, 1.5, .04), solid(0x0c0f13, .4));
    galleryFrame.position.z = -.03;
    gallery.add(galleryFrame, galleryScreen);
    const tileGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: LIME, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    tileGlow.position.set(-.65, .07, .05);
    gallery.add(tileGlow);
    scene.add(gallery);

    // ---------- cabos e pacotes ----------
    const cable = (points: V3[], color: number, radius = .014) => {
      const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, "centripetal");
      const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .22 });
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 96, radius, 6), material));
      return { curve, material };
    };
    const rtsp = cable([[-5.4, 2.9, -3.0], [-5.4, .6, -3.15], [-5.3, .03, -3.6], [0, .03, -3.75], [6.8, .03, -3.6], [7.0, .03, -.2], [6.85, .3, .15], [6.5, .58, .65]], CYAN, .01);
    const toSwitch = cable([[5.05, .5, 2.86], [5.06, .05, 2.9], [5.4, .03, 2.95], [5.75, .03, 2.7], [5.8, .2, 2.5], [5.82, .44, 2.42]], LIME);
    const toAgent = cable([[6.15, .47, 2.12], [6.55, .2, 1.7], [6.95, .35, 1.25], [7.0, .62, .96]], LIME);
    const toCloud = cable([[6.85, .9, -.2], [6.6, 2.3, -.7], [5.7, 3.3, -1.3], [5.1, 3.55, -1.5]], VIOLET, .012);
    const toGallery = cable([[4.6, 3.85, -1.75], [3.6, 4.25, -2.6], [2.3, 3.7, -3.3], [1.4, 3.2, -3.5]], VIOLET, .012);

    const packet = (color: number, caption?: string) => {
      const sprite = halo(color, .55);
      const tag = caption ? textSprite(caption, `#${color.toString(16).padStart(6, "0")}`, 384, 0) : null;
      if (tag) { tag.scale.multiplyScalar(.55); scene.add(tag); }
      return { sprite, tag };
    };
    const pkSignal = packet(LIME, "sinal");
    const pkCode = packet(LIME, "code=288");
    const pkPost = packet(LIME, "POST /api/replays");
    const pkUrl = packet(CYAN, "URL pré-assinada");
    const pkReplay = packet(LIME, "replay");
    const runPacket = (pk: ReturnType<typeof packet>, path: ReturnType<typeof cable>, t: number, a: number, b: number, reverse = false) => {
      const on = within(t, a, b);
      const s = ease(span(t, a, b));
      const fade = Math.min(1, span(t, a, a + .12) * 3, (1 - span(t, b - .12, b)) * 3);
      if (on) path.curve.getPoint(reverse ? 1 - s : s, pk.sprite.position);
      pk.sprite.material.opacity = on ? fade : 0;
      if (pk.tag) {
        pk.tag.position.copy(pk.sprite.position).y += .3;
        pk.tag.material.opacity = on ? fade * .95 : 0;
      }
      return on ? 1 : 0;
    };

    const rtspCount = 10;
    const rtspPositions = new Float32Array(rtspCount * 3);
    const rtspGeometry = new THREE.BufferGeometry();
    rtspGeometry.setAttribute("position", new THREE.BufferAttribute(rtspPositions, 3));
    const rtspPackets = new THREE.Points(rtspGeometry, new THREE.PointsMaterial({ size: .22, map: glow, color: CYAN, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    rtspPackets.frustumCulled = false;
    scene.add(rtspPackets);

    // ---------- bola e textos ----------
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.085, 16, 12), new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffe58a, emissiveIntensity: .35, roughness: .5 }));
    scene.add(ball);
    const shadowGeometry = new THREE.CircleGeometry(.22, 20);
    const shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .35, depthWrite: false });
    const ballShadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    ballShadow.rotation.x = -Math.PI / 2;
    ballShadow.scale.setScalar(.45);
    scene.add(ballShadow);
    const point = textSprite("PONTO!", "#c8ff32", 384, 0);
    scene.add(point);

    // ---------- bonequinhos ----------
    const { makePlayer, pose } = createPeople(scene, solid, shadowGeometry, shadowMaterial);

    const TEAM_A = 0x4fc9e6, TEAM_B = 0x8f7cf5;
    const passer = makePlayer(TEAM_A), defender = makePlayer(TEAM_A), blocker = makePlayer(TEAM_A);
    const setter = makePlayer(TEAM_B), back = makePlayer(TEAM_B), hero = makePlayer(LIME);
    const heroRing = new THREE.Mesh(new THREE.RingGeometry(.27, .32, 32), new THREE.MeshBasicMaterial({ color: LIME, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    heroRing.rotation.x = -Math.PI / 2;
    scene.add(heroRing);

    function animatePlayers(t: number, k: number) {
      const bob = (i: number) => .012 * Math.sin(t * 4 + i);
      const celebrate = within(t, 2.2, 3.0) ? 1 : 0;
      pose(passer, { x: -3.15, z: -1.15, yaw: Math.PI / 2, y: bob(0), arm0: t < .35 ? -1.25 : undefined, arm1: t < .35 ? -1.25 : undefined }, k);

      const d = track(DEFENDER, t);
      const dive = ease(span(t, 1.85, 2.1)) * (1 - span(t, 2.9, 3.5));
      pose(defender, { x: d.x, z: d.z, yaw: Math.PI / 2 - .3, y: bob(1), run: d.vx ? 1 : 0, phase: t * 15, lean: dive * .9, arm0: dive > .1 ? -1.3 : undefined, arm1: dive > .1 ? -1.3 : undefined }, k);

      const b = track(BLOCKER, t);
      const block = bump(t, 1.5, 2.05);
      pose(blocker, { x: b.x, z: b.z, yaw: b.vx ? Math.atan2(b.vx, b.vz) : Math.PI / 2, y: block * .42 + bob(2), run: b.vx ? 1 : 0, phase: t * 15, armsUp: block > 0 ? 1 : 0 }, k);

      pose(setter, { x: 1.05, z: .62, yaw: -Math.PI / 2 - .4, y: bob(3) + celebrate * .08 * Math.abs(Math.sin(t * 9)), armsUp: within(t, .8, 1.25) ? .85 : celebrate }, k);
      pose(back, { x: 3.3, z: -.6, yaw: -Math.PI / 2, y: bob(4) + celebrate * .08 * Math.abs(Math.sin(t * 9 + 1)), armsUp: celebrate }, k);

      const h = track(HERO, t);
      const moving = h.vx !== 0 || h.vz !== 0;
      const yaw = moving ? Math.atan2(h.vx, h.vz) : t < 2.15 ? -Math.PI / 2 : t < 6.1 ? 0 : t < 7.5 ? Math.PI / 4 : -1.1;
      const jump = bump(t, 1.45, 2.05);
      const hops = within(t, 2.25, 2.95) ? .1 * Math.abs(Math.sin((t - 2.25) * Math.PI / .35)) : within(t, 4.2, 4.8) ? .1 * Math.abs(Math.sin((t - 4.2) * Math.PI / .3)) : 0;
      const spike = within(t, 1.4, 2.05) ? -2.9 + 2.0 * ease(span(t, 1.62, 1.8)) : undefined;
      const reach = bump(t, 6.15, 7.1);
      pose(hero, {
        x: h.x, z: h.z, yaw,
        y: jump * .55 + hops + (moving ? .03 * Math.abs(Math.sin(t * 15)) : bob(5)),
        run: moving ? 1 : 0, phase: t * 15,
        armsUp: within(t, 2.2, 3.0) || within(t, 4.2, 4.8) ? 1 : 0,
        arm0: jump > 0 ? -2.4 : undefined,
        arm1: spike ?? (reach > 0 ? -1.55 * reach : undefined),
      }, k);
      heroRing.position.set(h.x, .006, h.z);
      (heroRing.material as THREE.MeshBasicMaterial).opacity = span(t, 2.1, 2.6) * (.55 + .25 * Math.sin(t * 6));
      return h;
    }

    function ballAt(out: THREE.Vector3, t: number) {
      const segment = BALL.find(([a, b]) => t >= a && t < b);
      if (!segment) return out.set(...BALL_REST);
      const [a, b, from, to, lift] = segment;
      return arc(out, from, to, (t - a) / (b - a), lift);
    }

    // ---------- câmera, labels e leitura ----------
    const size = { w: 1, h: 1 };
    const tmp = new THREE.Vector3();
    const desiredPos = new THREE.Vector3();
    const desiredLook = new THREE.Vector3();
    const look = new THREE.Vector3(0, 0, 0);
    let visible = true;
    let raf = 0;
    let last = performance.now();
    let awakeUntil = 0;
    let lastNarration = -1;
    let lastSegment = segmentAt(timeRef.current);
    let snap = true;
    let fresh = false;

    function shot(t: number, heroX: number, heroZ: number) {
      if (t < 3) { desiredLook.set(1.0, .9, -.5); desiredPos.set(1.0, 7.6, 12.0); }
      else if (t < 6.1) { desiredLook.set(heroX, .5, heroZ); desiredPos.set(heroX - .8, 3.8, heroZ + 6.2); }
      else if (t < 8.6) { desiredLook.set(5.45, .55, 2.5); desiredPos.set(3.0, 2.7, 6.8); }
      else if (t < 12) { desiredLook.set(6.5, 1.1, .2); desiredPos.set(5.0, 2.1, 2.9); }
      else if (t < 14.4) { desiredLook.set(5.6, 2.2, -.6); desiredPos.set(2.4, 3.2, 6.4); }
      else if (t < 16.6) { desiredLook.set(1.0, 2.8, -3.5); desiredPos.set(.9, 3.1, 2.4); }
      else { desiredLook.set(1.0, .9, -.5); desiredPos.set(1.0, 7.6, 12.0); }
      const stretch = Math.max(1, 1.35 / camera.aspect);
      desiredPos.sub(desiredLook).multiplyScalar(stretch).add(desiredLook);
    }

    function resize() {
      const rect = root!.getBoundingClientRect();
      size.w = Math.max(rect.width, 1);
      size.h = Math.max(rect.height, 1);
      renderer.setSize(size.w, size.h, false);
      camera.aspect = size.w / size.h;
      camera.updateProjectionMatrix();
    }

    function frame(now: number) {
      raf = 0;
      if (!visible) return;
      const dt = Math.max(0, Math.min((now - last) / 1000, .05));
      last = now;
      const motion = reducedQuery.matches ? 0 : 1;
      if (motion && !pausedRef.current) {
        timeRef.current += dt;
        if (timeRef.current >= LOOP) timeRef.current -= LOOP;
      }
      const t = timeRef.current;
      const k = snap || !motion ? 1 : 1 - Math.exp(-6 * dt);

      const segment = segmentAt(t);
      if (segment !== lastSegment) {
        lastSegment = segment;
        if (motion && segment !== stageRef.current) { stageRef.current = segment; onStageRef.current?.(segment); }
      }

      const h = animatePlayers(t, k);

      ballAt(ball.position, t);
      ballShadow.position.set(ball.position.x, .004, ball.position.z);
      const pop = span(t, 2.1, 2.35);
      point.visible = within(t, 2.1, 3.4);
      point.position.set(-2.7, 1.25 + pop * .25, 1.3);
      point.scale.set(2.56 * (.6 + .4 * ease(pop)), .425 * (.6 + .4 * ease(pop)), 1);
      point.material.opacity = (1 - span(t, 3.0, 3.4)) * .95;

      // câmera gravando
      recDot.material.opacity = Math.sin(t * 6) > 0 ? .95 : .25;
      (frustumLines.material as THREE.LineBasicMaterial).opacity = segment === 0 ? .2 : .07;
      for (let i = 0; i < rtspCount; i++) {
        rtsp.curve.getPoint((t * .08 + i / rtspCount) % 1, tmp);
        rtspPositions.set([tmp.x, tmp.y, tmp.z], i * 3);
      }
      rtspGeometry.attributes.position.needsUpdate = true;
      (rtspPackets.material as THREE.PointsMaterial).opacity = segment === 0 ? .9 : .3;
      rtsp.material.opacity = segment === 0 ? .4 : .15;

      // botão → switch → agente
      const press = bump(t, 6.45, 7.0);
      cap.position.y = .695 - .022 * press;
      (cap.material as THREE.MeshStandardMaterial).emissiveIntensity = .25 + 1.6 * press + (within(t, 6.45, 8.6) ? .4 : 0);
      capGlow.material.opacity = press * .9 + (within(t, 6.45, 8.6) ? .15 : 0);
      toSwitch.material.opacity = .22 + .6 * runPacket(pkSignal, toSwitch, t, 6.55, 7.45);
      const blinking = within(t, 7.35, 8.7);
      leds.forEach((led, i) => (led.material as THREE.MeshBasicMaterial).color.setHex(blinking && i % 2 === Math.floor(t * 8) % 2 ? LIME : i === 0 ? 0x3d7a3d : 0x334033));
      switchGlow.material.opacity = blinking ? .35 + .25 * Math.sin(t * 20) : 0;
      toAgent.material.opacity = .22 + .6 * runPacket(pkCode, toAgent, t, 7.65, 8.6);
      towerLed.material.opacity = within(t, 8.6, 12) && Math.sin(t * 22) > 0 ? 1 : .5;

      const count = LOG.filter(([at]) => at <= t).length;
      if (count !== logCount) {
        logCount = count;
        drawTerminal(terminalCanvas.getContext("2d")!, LOG.slice(0, count));
        terminalTexture.needsUpdate = true;
      }

      // arquivo MP4: nasce sobre o monitor, vai para a fila, sobe para a nuvem
      file.visible = within(t, 10.4, 14.55);
      if (file.visible) {
        if (t < 11.2) file.position.set(6.05, 1.25, .45);
        else if (t < 13.4) { const s = ease(span(t, 11.2, 11.7)); file.position.set(6.05 + .8 * s, 1.25 - .2 * s, .45 - .65 * s); }
        else toCloud.curve.getPoint(ease(span(t, 13.4, 14.4)), file.position);
        file.scale.setScalar(t < 11.2 ? ease(span(t, 10.4, 10.7)) : t < 13.4 ? 1 - .35 * ease(span(t, 11.2, 11.7)) : .65 * (1 - span(t, 14.3, 14.55)));
        file.rotation.y = -.6 + Math.sin(t * 2) * .35;
        fileTag.material.opacity = t < 11.4 || t > 13.4 ? 1 : .4;
      }

      // backend e galeria
      const posting = runPacket(pkPost, toCloud, t, 12.0, 12.75);
      const presigned = runPacket(pkUrl, toCloud, t, 12.8, 13.35, true);
      toCloud.material.opacity = .22 + .5 * Math.max(posting, presigned, within(t, 13.4, 14.4) ? 1 : 0);
      const hit = Math.max(bump(t, 12.7, 13.3), bump(t, 14.35, 15.0));
      cloudGlow.material.opacity = .22 + .5 * hit + (within(t, 12, 14.4) ? .15 : 0);
      cloud.rotation.y = t * .25;
      cloud.position.y = 3.8 + Math.sin(t * 1.4) * .05;
      const ringT = within(t, 12.7, 13.4) ? span(t, 12.7, 13.4) : within(t, 14.35, 15.05) ? span(t, 14.35, 15.05) : -1;
      cloudRing.visible = ringT >= 0;
      cloudRing.scale.setScalar(.8 + Math.max(ringT, 0) * 1.4);
      (cloudRing.material as THREE.MeshBasicMaterial).opacity = (1 - Math.max(ringT, 0)) * .7;
      cloudRing.lookAt(camera.position);
      toGallery.material.opacity = .22 + .6 * runPacket(pkReplay, toGallery, t, 14.4, 15.2);
      const arrived = t >= 15.15;
      if (arrived !== fresh) {
        fresh = arrived;
        (galleryScreen.material as THREE.MeshBasicMaterial).map = arrived ? galleryAfter : galleryBefore;
        (galleryScreen.material as THREE.MeshBasicMaterial).needsUpdate = true;
      }
      const tilePulse = span(t, 15.15, 16.2);
      tileGlow.material.opacity = arrived ? (1 - tilePulse) * .9 + .2 : 0;
      tileGlow.scale.setScalar(.7 + tilePulse * .9);

      // câmera
      shot(t, h.x, h.z);
      const kc = snap || !motion ? 1 : 1 - Math.exp(-2.4 * dt);
      camera.position.lerp(desiredPos, kc);
      look.lerp(desiredLook, kc);
      camera.lookAt(look);
      snap = false;

      // narração
      let narration = 0;
      NARRATION.forEach(([at], i) => { if (t >= at) narration = i; });
      if (narration !== lastNarration && readout.current) {
        lastNarration = narration;
        readout.current.textContent = `● ${NARRATION[narration][1]}`;
      }

      renderer.render(scene, camera);
      LABELS.forEach((item, index) => {
        const label = labels.current[index];
        if (!label) return;
        tmp.set(...item.at).project(camera);
        const active = within(t, ...item.on);
        label.classList.toggle("is-active", active);
        label.style.transform = `translate3d(${(tmp.x * .5 + .5) * size.w}px, ${(-tmp.y * .5 + .5) * size.h}px, 0) translate(-50%, -100%)`;
        label.style.opacity = tmp.z > 1 ? "0" : active ? "1" : ".4";
      });

      if ((motion && !pausedRef.current) || now < awakeUntil) raf = requestAnimationFrame(frame);
    }

    function start() {
      awakeUntil = performance.now() + 400;
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    wake.current = () => { snap = reducedQuery.matches; start(); };
    reducedQuery.addEventListener("change", start);
    const resizeObserver = new ResizeObserver(() => { resize(); start(); });
    resizeObserver.observe(root);
    const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) start(); }, { rootMargin: "120px" });
    visibility.observe(root);
    resize();
    start();

    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
      visible = false;
      wake.current = () => {};
      resizeObserver.disconnect();
      visibility.disconnect();
      reducedQuery.removeEventListener("change", start);
      disposeScene(scene);
      galleryBefore.dispose();
      galleryAfter.dispose();
      terminalTexture.dispose();
      glow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  if (failed) return <ProjectScene variant="arena-replay" interactive stage={stage} onStage={onStage} />;

  return <div ref={rootRef} className="pscene court-scene">
    {LABELS.map((item, index) => <span key={item.title} ref={el => { labels.current[index] = el; }} className="pscene-label court-label" aria-hidden="true">
      <b>{item.symbol}</b><i>{item.title}</i><small>{item.detail}</small>
    </span>)}
    <div className="pscene-readout" aria-hidden="true"><span>› ponto → botão → switch → agente → backend → galeria</span><strong ref={readout}>● rally em andamento · a câmera grava a quadra</strong></div>
    <button type="button" className="scene-pause" aria-pressed={paused} aria-label={paused ? "Continuar animação" : "Pausar animação"}
      onClick={() => { pausedRef.current = !pausedRef.current; setPaused(pausedRef.current); wake.current(); }}>
      <span aria-hidden="true">{paused ? "▶" : "❚❚"}</span>{paused ? "Continuar" : "Pausar"}
    </button>
  </div>;
}
