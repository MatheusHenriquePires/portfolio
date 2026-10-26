"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ProjectScene } from "@/components/visual/ProjectScene";
import { disposeScene, glowTexture, textSprite } from "@/lib/three-helpers";
import { bump, canvasTexture, createPeople, ease, liveCanvas, span, within, wrapText, type V3 } from "@/lib/scene-kit";

/**
 * Cena da escola do Gênesis: sincronização das questões → critérios do professor →
 * prévia editável → PDF, aprovação da coordenação e impressão na gráfica.
 * Tudo é função do tempo `t` (0..LOOP); avançar/voltar etapas é só mover `t`.
 */

const LOOP = 20;
/** Início de cada etapa, na ordem de `systems.genesis.nodes` (Questões, Critérios, Geração, Documento). */
const SEGMENTS = [0, 4.5, 9, 13.5, LOOP];
const STILLS = [2.6, 7.9, 12.6, 18.4];
const segmentAt = (t: number) => Math.max(0, SEGMENTS.findIndex((start, i) => i < SEGMENTS.length - 1 && t >= start && t < SEGMENTS[i + 1]));

const LIME = 0xc8ff32;
const CYAN = 0x6be7ff;
const VIOLET = 0xac98ff;

// ---------- roteiro ----------

/** Cartões sincronizados do Gênesis: [partida, chegada]. O de índice DUPLICATE é repetido e é descartado. */
const SYNC = [0.3, 0.85, 1.4, 1.95, 2.5, 3.05].map(at => [at, at + .8] as const);
const DUPLICATE = 3;
const BASE_STACK = 3;
const SELECTED = [0, 1, 2, 3].map(i => [7.6 + i * .3, 8.3 + i * .3] as const);
const CHIPS = [{ text: "9º ano", at: 4.9 }, { text: "Matemática", at: 5.5 }, { text: "dificuldade média", at: 6.1 }];
const COPIES = 32;

const QUESTIONS = {
  q1: "Resolva a equação 2x + 6 = 14.",
  q1edit: "Resolva a equação 3x − 5 = 16 e confira o resultado.",
  q2: "Qual é a área de um quadrado de lado 7 cm?",
  q3: "Simplifique a fração 18/24.",
  q3new: "Calcule 15% de 240.",
  q4: "Um ônibus percorre 180 km em 3 h. Qual é a velocidade média?",
};

const LABELS: { symbol: string; title: string; detail: string; at: V3; on: [number, number] }[] = [
  { symbol: "[ ]", title: "GÊNESIS", detail: "banco de questões", at: [-5, 2.1, -1], on: [0, 3.6] },
  { symbol: "DB", title: "BANCO LOCAL", detail: "MySQL / MariaDB", at: [-3, 1.55, .5], on: [2.6, 8.4] },
  { symbol: "{ }", title: "PROFESSOR", detail: "critérios e prévia", at: [-.55, 1.35, 1.6], on: [4.5, 13.5] },
  { symbol: "✓", title: "COORDENAÇÃO", detail: "aprova a atividade", at: [3.2, 1.55, -1.25], on: [14.2, 16.3] },
  { symbol: "PDF", title: "GRÁFICA", detail: "registra as cópias", at: [5.8, 1.45, .9], on: [16.3, LOOP] },
];

const NARRATION: [number, string][] = [
  [0, "o Gênesis envia as questões para o banco local"],
  [2.3, "questão repetida: a sincronização ignora"],
  [3.6, "questões confirmadas no banco"],
  [4.5, "o professor escolhe série, disciplina e dificuldade"],
  [6.8, "a API filtra o banco pelos critérios"],
  [7.6, "as questões selecionadas vão para a prévia"],
  [9.0, "prévia editável da atividade"],
  [10.0, "remove uma questão…"],
  [10.8, "…e coloca outra no lugar"],
  [11.8, "edita o enunciado direto na prévia"],
  [13.5, "o ReportLab gera o PDF"],
  [14.3, "a atividade fica pendente de aprovação"],
  [15.8, "a coordenação aprova"],
  [16.3, "o PDF segue para a gráfica"],
  [17.3, "a gráfica imprime e registra as cópias"],
];

const MONITOR: [number, string[]][] = [
  [0, ["Gênesis · professor", "", "Nova atividade"]],
  [4.9, ["Gênesis · professor", "", "Série: 9º ano"]],
  [5.5, ["Gênesis · professor", "", "Série: 9º ano", "Disciplina: Matemática"]],
  [6.1, ["Gênesis · professor", "", "Série: 9º ano", "Disciplina: Matemática", "Dificuldade: média", "Quantidade: 4"]],
  [7.6, ["Gênesis · professor", "", "4 questões encontradas", "→ abrindo prévia…"]],
  [9.0, ["Gênesis · prévia", "", "editando atividade…"]],
  [13.5, ["Gênesis · PDF", "", "gerando PDF…", "status: pendente"]],
  [15.8, ["Gênesis · PDF", "", "status: aprovada ✓"]],
  [17.3, ["Gênesis · PDF", "", "status: impressa ✓", `cópias: ${COPIES}`]],
];

// ---------- desenho dos canvases ----------

function drawCard(g: CanvasRenderingContext2D, accent: string) {
  g.fillStyle = "#e9eef5"; g.fillRect(0, 0, 128, 90);
  g.fillStyle = accent; g.fillRect(0, 0, 128, 14);
  g.fillStyle = "#1b2433"; g.font = "700 18px sans-serif"; g.fillText("Q", 10, 40);
  g.fillStyle = "#9aa6b6";
  for (let i = 0; i < 4; i++) g.fillRect(34, 26 + i * 14, i === 3 ? 50 : 82, 5);
}

function drawSheetBase(g: CanvasRenderingContext2D) {
  g.fillStyle = "#f3f5f9"; g.fillRect(0, 0, 512, 664);
  g.fillStyle = "#1b2433"; g.font = "700 22px sans-serif"; g.fillText("Atividade · Matemática", 28, 44);
  g.fillStyle = "#5c6878"; g.font = "500 15px sans-serif"; g.fillText("9º ano · Nome: ______________________", 28, 72);
  g.fillStyle = "#c8ff32"; g.fillRect(28, 86, 456, 4);
}

function drawBlock(g: CanvasRenderingContext2D, number: number, text: string, opts: { highlight?: string; cursor?: boolean } = {}) {
  g.clearRect(0, 0, 456, 128);
  g.fillStyle = "#f3f5f9"; g.fillRect(0, 0, 456, 128);
  if (opts.highlight) {
    g.fillStyle = `${opts.highlight}22`; g.fillRect(0, 0, 456, 128);
    g.strokeStyle = opts.highlight; g.lineWidth = 4; g.strokeRect(2, 2, 452, 124);
  }
  g.textBaseline = "alphabetic";
  g.fillStyle = "#1b2433"; g.font = "700 18px sans-serif"; g.fillText(`${number}.`, 10, 30);
  g.font = "500 17px sans-serif";
  const lines = wrapText(g, text, 400).slice(0, 2);
  lines.forEach((line, i) => g.fillText(line, 38, 30 + i * 24));
  if (opts.cursor) {
    const row = Math.max(0, lines.length - 1);
    g.fillStyle = "#3b6cff"; g.fillRect(38 + g.measureText(lines[row] ?? "").width + 2, 14 + row * 24, 2, 20);
  }
  g.fillStyle = "#5c6878"; g.font = "500 14px sans-serif";
  ["a) ____", "b) ____", "c) ____", "d) ____"].forEach((alt, i) => g.fillText(alt, 38 + i * 100, 104));
}

function drawMonitor(g: CanvasRenderingContext2D, lines: string[]) {
  g.fillStyle = "#0b0f14"; g.fillRect(0, 0, 512, 320);
  g.fillStyle = "#141a22"; g.fillRect(0, 0, 512, 34);
  g.font = "600 18px monospace"; g.textBaseline = "middle";
  lines.forEach((line, i) => {
    g.fillStyle = i === 0 ? "#8b95a3" : line.includes("✓") ? "#c8ff32" : "#e8eef5";
    g.fillText(line, 16, i === 0 ? 17 : 40 + i * 34);
  });
}

function drawCounter(g: CanvasRenderingContext2D, value: number) {
  g.clearRect(0, 0, 320, 96);
  g.fillStyle = "#c8ff32"; g.font = "700 40px monospace"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(`${value} cópias`, 160, 48);
}

export function GenesisScene3D({ stage, onStage }: { stage: number; onStage?: (index: number | null) => void }) {
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
    const desk = (x: number, z: number, w = 1.2, d = .7) => {
      const material = solid(0x2a3340);
      box(w, .05, d, material, x, .55, z);
      for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(.04, .53, .04, material, x + dx * (w / 2 - .06), .265, z + dz * (d / 2 - .06));
    };

    // ---------- piso e áreas ----------
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), solid(0x10151c, .95));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    const zone = (x: number, z: number, w: number, d: number, color: number) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .07 }));
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, .003, z);
      scene.add(mesh);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, d)), new THREE.LineBasicMaterial({ color, transparent: true, opacity: .35 }));
      edges.rotation.x = -Math.PI / 2;
      edges.position.set(x, .005, z);
      scene.add(edges);
    };
    zone(-4, -.2, 3.4, 3.2, CYAN);
    zone(0, 1.0, 2.8, 2.6, CYAN);
    zone(3.2, -.8, 2.4, 2.2, VIOLET);
    zone(6.0, 1.0, 2.4, 2.4, LIME);

    // ---------- servidor Gênesis e banco local ----------
    box(.7, 1.7, .6, solid(0x1a212b), -5, .85, -1);
    const serverLeds = Array.from({ length: 8 }, (_, i) => {
      const led = new THREE.Mesh(new THREE.BoxGeometry(.5, .03, .01), new THREE.MeshBasicMaterial({ color: 0x2b3542 }));
      led.position.set(-5, .35 + i * .16, -.695);
      scene.add(led);
      return led;
    });
    for (const y of [.12, .34, .56]) {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .18, 32), solid(0x1d2a3a, .5));
      disc.position.set(-3, y, .5);
      scene.add(disc);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.45, .01, 6, 48), new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: .6 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(-3, y + .09, .5);
      scene.add(ring);
    }
    const scanRing = new THREE.Mesh(new THREE.TorusGeometry(.6, .015, 6, 48), new THREE.MeshBasicMaterial({ color: LIME, transparent: true, opacity: 0 }));
    scanRing.rotation.x = Math.PI / 2;
    scanRing.position.set(-3, 1, .5);
    scene.add(scanRing);

    const cardGeometry = new THREE.PlaneGeometry(.34, .24);
    const cardTexture = canvasTexture(128, 90, g => drawCard(g, "#6be7ff"));
    const dupTexture = canvasTexture(128, 90, g => drawCard(g, "#ffa24d"));
    const pickTexture = canvasTexture(128, 90, g => drawCard(g, "#c8ff32"));
    const cardMaterial = (map: THREE.Texture) => new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide, transparent: true, toneMapped: false });
    const stack = Array.from({ length: BASE_STACK + SYNC.length - 1 }, (_, i) => {
      const card = new THREE.Mesh(cardGeometry, cardMaterial(cardTexture));
      card.rotation.x = -Math.PI / 2;
      card.rotation.z = (i % 3 - 1) * .12;
      card.position.set(-3, .66 + i * .03, .5);
      scene.add(card);
      return card;
    });
    const flying = SYNC.map((_, i) => {
      const card = new THREE.Mesh(cardGeometry, cardMaterial(i === DUPLICATE ? dupTexture : cardTexture));
      scene.add(card);
      return card;
    });
    const dupTag = textSprite("duplicada · ignorada", "#ffa24d", 512, 0);
    dupTag.scale.multiplyScalar(.5);
    dupTag.position.set(-3, 1.4, .5);
    scene.add(dupTag);
    const picks = SELECTED.map(() => {
      const card = new THREE.Mesh(cardGeometry, cardMaterial(pickTexture));
      scene.add(card);
      return card;
    });

    // ---------- mesa do professor ----------
    desk(0, .85);
    const monitorCanvas = liveCanvas(512, 320);
    const monitor = new THREE.Group();
    monitor.position.set(.15, 1.0, .7);
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(.9, .58, .04), solid(0x0c0f13, .4));
    bezel.position.z = -.025;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(.84, .52), new THREE.MeshBasicMaterial({ map: monitorCanvas.texture, toneMapped: false }));
    const stand = new THREE.Mesh(new THREE.BoxGeometry(.06, .2, .06), solid(0x0c0f13));
    stand.position.set(0, -.38, -.04);
    monitor.add(bezel, screen, stand);
    scene.add(monitor);
    let monitorState = -1;

    const chips = CHIPS.map((chip, i) => {
      const sprite = textSprite(chip.text, "#6be7ff", 384, 0);
      sprite.scale.multiplyScalar(.55);
      sprite.position.set(-1.05 + i * .85, 1.95 + (i % 2) * .14, 1.15);
      scene.add(sprite);
      const dot = halo(CYAN, .5);
      dot.position.copy(sprite.position);
      return { sprite, dot, at: chip.at };
    });

    // folha da prévia
    const sheet = new THREE.Group();
    const sheetBaseTexture = canvasTexture(512, 664, drawSheetBase);
    const sheetBase = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.2), new THREE.MeshBasicMaterial({ map: sheetBaseTexture, toneMapped: false }));
    const sheetGlow = new THREE.Mesh(new THREE.PlaneGeometry(3, 3.4), new THREE.MeshBasicMaterial({ map: glow, color: CYAN, transparent: true, opacity: .25, depthWrite: false, blending: THREE.AdditiveBlending }));
    sheetGlow.position.z = -.03;
    sheet.add(sheetGlow, sheetBase);
    const SLOTS = [.55, .1, -.35, -.8];
    const makeBlock = (slot: number) => {
      const canvas = liveCanvas(456, 128);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.52, .427), new THREE.MeshBasicMaterial({ map: canvas.texture, transparent: true, toneMapped: false }));
      mesh.position.set(0, SLOTS[slot], .01);
      sheet.add(mesh);
      return { mesh, canvas, key: "" };
    };
    const blocks = [makeBlock(0), makeBlock(1), makeBlock(2), makeBlock(3), makeBlock(2)];
    const paintBlock = (block: (typeof blocks)[number], key: string, paint: (g: CanvasRenderingContext2D) => void) => {
      if (block.key === key) return;
      block.key = key;
      block.canvas.draw(paint);
    };
    scene.add(sheet);

    // ---------- PDF, coordenação e gráfica ----------
    const pdf = new THREE.Group();
    const pdfGeometry = new THREE.BoxGeometry(.3, .4, .03);
    pdf.add(new THREE.Mesh(pdfGeometry, new THREE.MeshBasicMaterial({ color: 0xf3f5f9 })));
    pdf.add(new THREE.LineSegments(new THREE.EdgesGeometry(pdfGeometry), new THREE.LineBasicMaterial({ color: VIOLET })));
    const pdfTag = textSprite("PDF", "#ac98ff", 128, 1);
    pdfTag.scale.multiplyScalar(.5);
    pdfTag.position.y = .32;
    pdf.add(pdfTag);
    const approved = textSprite("APROVADA", "#c8ff32", 384, 0);
    approved.position.set(0, .02, .05);
    pdf.add(approved);
    scene.add(pdf);

    desk(3.2, -.6, 1.1, .6);
    const stamp = new THREE.Group();
    const stampBase = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .04, 16), solid(0x6a3fd0, .5));
    const stampHandle = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .12, 10), solid(0x2a2f3a));
    stampHandle.position.y = .08;
    stamp.add(stampBase, stampHandle);
    scene.add(stamp);
    const stampRing = new THREE.Mesh(new THREE.TorusGeometry(.4, .012, 6, 48), new THREE.MeshBasicMaterial({ color: LIME, transparent: true, opacity: 0 }));
    stampRing.rotation.x = Math.PI / 2;
    stampRing.position.set(3.2, .6, -.55);
    scene.add(stampRing);

    box(.85, .4, .6, solid(0x1a212b), 5.8, .2, .9);
    box(.8, .32, .56, solid(0xd8dee8, .5), 5.8, .56, .9);
    box(.6, .02, .3, solid(0x2a313b), 5.8, .62, 1.3);
    const printLed = halo(LIME, .3, .4);
    printLed.position.set(6.1, .66, 1.19);
    const sheetGeometry = new THREE.PlaneGeometry(.28, .36);
    const printed = Array.from({ length: 8 }, () => {
      const paper = new THREE.Mesh(sheetGeometry, new THREE.MeshStandardMaterial({ color: 0xf3f5f9, side: THREE.DoubleSide }));
      paper.rotation.x = -Math.PI / 2;
      scene.add(paper);
      return paper;
    });
    const counter = liveCanvas(320, 96);
    const counterSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: counter.texture, transparent: true, opacity: 0, depthWrite: false }));
    counterSprite.scale.set(1.2, .36, 1);
    counterSprite.position.set(5.8, 1.15, .9);
    scene.add(counterSprite);
    let counterValue = -1;

    // ---------- conexões ----------
    const link = (points: V3[], color: number) => {
      const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, "centripetal");
      const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .18 });
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 80, .01, 6), material));
      return { curve, material };
    };
    const cSync = link([[-5, 1.75, -1], [-4.1, 2.4, -.4], [-3, 1.05, .5]], CYAN);
    const cSelect = link([[-3, 1.05, .5], [-1.6, 2.0, 1.0], [.15, 1.25, .75]], LIME);
    const cApprove = link([[.15, 1.0, .85], [1.7, 1.9, .3], [3.2, .8, -.55]], VIOLET);
    const cPrint = link([[3.2, .8, -.55], [4.6, 1.8, .2], [5.8, .8, .9]], LIME);

    // ---------- pessoas ----------
    const shadowGeometry = new THREE.CircleGeometry(.22, 20);
    const shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .35, depthWrite: false });
    const { makePlayer, pose } = createPeople(scene, solid, shadowGeometry, shadowMaterial);
    const teacher = makePlayer(0x4fc9e6);
    const coordinator = makePlayer(0x8f7cf5);
    const printerWorker = makePlayer(LIME);

    function animatePeople(t: number, k: number) {
      const bob = (i: number) => .01 * Math.sin(t * 3 + i);
      const tap = Math.max(...CHIPS.map(chip => bump(t, chip.at, chip.at + .4)));
      const typing = within(t, 9.9, 13.3);
      pose(teacher, {
        x: -.45, z: 1.6, yaw: within(t, 13.9, 16.5) ? Math.PI * .7 : Math.PI, y: bob(0),
        arm0: typing ? -1.25 + .15 * Math.sin(t * 22) : undefined,
        arm1: tap > 0 ? -2.2 * tap : typing ? -1.25 + .15 * Math.sin(t * 22 + 1.5) : undefined,
      }, k);
      const lift = ease(span(t, 15.3, 15.7)) * (1 - ease(span(t, 15.75, 15.85)));
      pose(coordinator, { x: 3.2, z: -1.2, yaw: 0, y: bob(1), arm1: within(t, 15.2, 16.2) ? -1.0 - 1.2 * lift : undefined, armsUp: within(t, 15.9, 16.3) ? .6 : 0 }, k);
      const collect = bump(t, 19.1, 19.8);
      pose(printerWorker, { x: 6.6, z: 1.55, yaw: -Math.PI / 2 - .5, y: bob(2), arm0: collect > 0 ? -1.3 * collect : undefined, arm1: collect > 0 ? -1.3 * collect : undefined }, k);
      stamp.position.set(3.38, .62 + .4 * lift, -.5);
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

    function shot(t: number) {
      if (t < .8 || t >= 19.4) { desiredLook.set(.4, .8, 0); desiredPos.set(.4, 6.6, 10.6); }
      else if (t < 4.5) { desiredLook.set(-3.9, .9, -.1); desiredPos.set(-2.4, 3.1, 5.4); }
      else if (t < 9) { desiredLook.set(-1.4, 1.1, .8); desiredPos.set(-.8, 3.0, 6.0); }
      else if (t < 13.5) { desiredLook.set(.15, 1.95, .6); desiredPos.set(.35, 2.4, 4.7); }
      else if (t < 16.3) { desiredLook.set(1.8, 1.0, .1); desiredPos.set(1.4, 3.0, 5.6); }
      else { desiredLook.set(5.4, .85, .7); desiredPos.set(4.2, 2.5, 4.6); }
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

      animatePeople(t, k);

      // 1. sincronização: cartões voam do Gênesis ao banco; o repetido é descartado
      let landed = 0;
      SYNC.forEach(([a, b], i) => {
        const card = flying[i];
        const duplicate = i === DUPLICATE;
        const material = card.material as THREE.MeshBasicMaterial;
        const flyingNow = within(t, a, b);
        const bouncing = duplicate && within(t, b, b + .7);
        card.visible = flyingNow || bouncing;
        if (flyingNow) {
          const s = span(t, a, b);
          cSync.curve.getPoint(ease(s), card.position);
          card.rotation.set(-Math.PI / 2 + Math.sin(s * Math.PI) * .9, s * 2, 0);
          material.opacity = 1;
        } else if (bouncing) {
          const u = span(t, b, b + .7);
          card.position.set(-3 + u * .5, 1.05 + Math.sin(u * Math.PI) * .35, .5 + u * .3);
          card.rotation.z = u * 3;
          material.opacity = 1 - u;
        }
        if (t >= b && !duplicate) landed++;
      });
      stack.forEach((card, i) => { card.visible = i < BASE_STACK + landed; });
      dupTag.material.opacity = bump(t, SYNC[DUPLICATE][1], SYNC[DUPLICATE][1] + 1.2);
      cSync.material.opacity = within(t, .2, 4) ? .45 : .15;
      serverLeds.forEach((led, i) => (led.material as THREE.MeshBasicMaterial).color.setHex(within(t, .2, 3.9) && (Math.floor(t * 10) + i) % 3 === 0 ? CYAN : 0x2b3542));

      // 2. critérios e seleção
      chips.forEach(chip => {
        const on = span(t, chip.at, chip.at + .3) * (1 - span(t, 8.8, 9.2));
        chip.sprite.material.opacity = on;
        chip.dot.material.opacity = on * .35 + bump(t, chip.at, chip.at + .5) * .6;
      });
      scanRing.position.y = 1.05 - span(t, 6.8, 7.6);
      (scanRing.material as THREE.MeshBasicMaterial).opacity = within(t, 6.8, 7.7) ? .9 : 0;
      SELECTED.forEach(([a, b], i) => {
        const card = picks[i];
        card.visible = within(t, a, b);
        if (card.visible) {
          const s = span(t, a, b);
          cSelect.curve.getPoint(ease(s), card.position);
          card.rotation.set(-Math.PI / 2 + s * 1.4, 0, 0);
        }
      });
      cSelect.material.opacity = within(t, 7.5, 9.3) ? .5 : .15;

      // 3. prévia editável
      const appear = ease(span(t, 9.0, 9.5));
      const leave = ease(span(t, 13.5, 14.2));
      sheet.visible = within(t, 9.0, 14.2);
      if (sheet.visible) {
        sheet.scale.setScalar(Math.max(.001, appear * (1 - leave * .9)));
        sheet.position.set(.2 - leave * .05, 2.25 - leave * 1.2, .6 + leave * .25);
        const removed = span(t, 10.0, 10.7);
        const entering = span(t, 10.8, 11.5);
        blocks[2].mesh.visible = removed < 1;
        blocks[2].mesh.position.x = ease(removed) * 2.0;
        (blocks[2].mesh.material as THREE.MeshBasicMaterial).opacity = 1 - removed;
        blocks[4].mesh.visible = t >= 10.8;
        blocks[4].mesh.position.x = -2.0 * (1 - ease(entering));
        (blocks[4].mesh.material as THREE.MeshBasicMaterial).opacity = entering;
        const editing = within(t, 11.8, 13.4);
        const text = t < 11.8 ? QUESTIONS.q1 : QUESTIONS.q1edit.slice(0, Math.round(span(t, 11.9, 13.1) * QUESTIONS.q1edit.length));
        const caret = editing && Math.floor(t * 4) % 2 === 0;
        paintBlock(blocks[0], `${text}|${caret}|${editing}`, g => drawBlock(g, 1, text, { cursor: caret, highlight: editing ? "#3b6cff" : undefined }));
        paintBlock(blocks[1], "q2", g => drawBlock(g, 2, QUESTIONS.q2));
        const marked = within(t, 9.8, 10.7);
        paintBlock(blocks[2], `q3|${marked}`, g => drawBlock(g, 3, QUESTIONS.q3, { highlight: marked ? "#ff6b6b" : undefined }));
        paintBlock(blocks[3], "q4", g => drawBlock(g, 4, QUESTIONS.q4));
        const fresh = within(t, 10.8, 11.8);
        paintBlock(blocks[4], `q3new|${fresh}`, g => drawBlock(g, 3, QUESTIONS.q3new, { highlight: fresh ? "#7fb800" : undefined }));
        (sheetGlow.material as THREE.MeshBasicMaterial).opacity = .25 * (1 - leave);
      }

      // 4. PDF → coordenação → gráfica
      pdf.visible = within(t, 13.9, 17.4);
      if (pdf.visible) {
        if (t < 14.3) pdf.position.set(.15, 1.05, .9);
        else if (t < 15.3) cApprove.curve.getPoint(ease(span(t, 14.3, 15.3)), pdf.position);
        else if (t < 16.3) pdf.position.set(3.2, .82, -.55);
        else cPrint.curve.getPoint(ease(span(t, 16.3, 17.3)), pdf.position);
        pdf.scale.setScalar(Math.max(.001, t < 14.3 ? ease(span(t, 13.9, 14.2)) : 1 - span(t, 17.1, 17.4)));
        pdf.rotation.y = t < 15.3 ? Math.sin(t * 2) * .3 : 0;
        const stampPop = 1.6 - .6 * ease(span(t, 15.85, 16.05));
        approved.material.opacity = t >= 15.85 ? 1 : 0;
        approved.scale.set(1.4 * stampPop, .23 * stampPop, 1);
      }
      cApprove.material.opacity = within(t, 14.2, 15.4) ? .5 : .15;
      cPrint.material.opacity = within(t, 16.2, 17.4) ? .5 : .15;
      const ringT = span(t, 15.85, 16.5);
      stampRing.visible = within(t, 15.85, 16.5);
      stampRing.scale.setScalar(.5 + ringT * 1.6);
      (stampRing.material as THREE.MeshBasicMaterial).opacity = (1 - ringT) * .8;

      printLed.material.opacity = within(t, 17.3, 19.4) && Math.sin(t * 20) > 0 ? 1 : .35;
      printed.forEach((paper, i) => {
        const a = 17.5 + i * .22;
        paper.visible = t >= a;
        paper.position.set(5.8 + (i % 2 ? .015 : -.015), .64 + i * .008, .95 + ease(span(t, a, a + .3)) * .35);
      });
      const copies = Math.round(COPIES * span(t, 17.4, 19.3));
      counterSprite.material.opacity = within(t, 17.3, LOOP) ? 1 - span(t, 19.6, 20) : 0;
      if (copies !== counterValue) { counterValue = copies; counter.draw(g => drawCounter(g, copies)); }

      // monitor do professor
      let state = 0;
      MONITOR.forEach(([at], i) => { if (t >= at) state = i; });
      if (state !== monitorState) { monitorState = state; monitorCanvas.draw(g => drawMonitor(g, MONITOR[state][1])); }

      // câmera
      shot(t);
      const kc = snap || !motion ? 1 : 1 - Math.exp(-2.4 * dt);
      camera.position.lerp(desiredPos, kc);
      look.lerp(desiredLook, kc);
      camera.lookAt(look);
      snap = false;

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
      glow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  if (failed) return <ProjectScene variant="genesis" interactive stage={stage} onStage={onStage} />;

  return <div ref={rootRef} className="pscene court-scene">
    {LABELS.map((item, index) => <span key={item.title} ref={el => { labels.current[index] = el; }} className="pscene-label court-label" aria-hidden="true">
      <b>{item.symbol}</b><i>{item.title}</i><small>{item.detail}</small>
    </span>)}
    <div className="pscene-readout" aria-hidden="true"><span>› questões → critérios → prévia → PDF → aprovação → gráfica</span><strong ref={readout}>● o Gênesis envia as questões para o banco local</strong></div>
    <button type="button" className="scene-pause" aria-pressed={paused} aria-label={paused ? "Continuar animação" : "Pausar animação"}
      onClick={() => { pausedRef.current = !pausedRef.current; setPaused(pausedRef.current); wake.current(); }}>
      <span aria-hidden="true">{paused ? "▶" : "❚❚"}</span>{paused ? "Continuar" : "Pausar"}
    </button>
  </div>;
}
