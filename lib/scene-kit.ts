import * as THREE from "three";

/** Utilitários compartilhados pelas cenas narrativas (quadra do Arena Replay, escola do Gênesis). */

export type V3 = [number, number, number];
/** Quadro-chave de deslocamento: tempo, x, z. */
export type Key = [number, number, number];

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const ease = (v: number) => v * v * (3 - 2 * v);
export const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const within = (t: number, a: number, b: number) => t >= a && t < b;
export const bump = (t: number, a: number, b: number) => (within(t, a, b) ? Math.sin(Math.PI * span(t, a, b)) : 0);

export function arc(out: THREE.Vector3, a: V3, b: V3, s: number, lift: number) {
  return out.set(a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s + 4 * lift * s * (1 - s), a[2] + (b[2] - a[2]) * s);
}

export function track(keys: Key[], t: number) {
  let i = 0;
  while (i < keys.length - 2 && t >= keys[i + 1][0]) i++;
  const [t0, x0, z0] = keys[i];
  const [t1, x1, z1] = keys[i + 1];
  const s = clamp01((t - t0) / (t1 - t0));
  const moving = s > 0 && s < 1 && (x0 !== x1 || z0 !== z1);
  return { x: x0 + (x1 - x0) * s, z: z0 + (z1 - z0) * s, vx: moving ? (x1 - x0) / (t1 - t0) : 0, vz: moving ? (z1 - z0) / (t1 - t0) : 0 };
}

export function lerpAngle(a: number, b: number, k: number) {
  const d = ((((b - a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  return a + d * k;
}

export function canvasTexture(width: number, height: number, draw: (g: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d")!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Canvas que pode ser redesenhado a cada mudança de estado. */
export function liveCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const g = canvas.getContext("2d")!;
  return { texture, draw: (paint: (g: CanvasRenderingContext2D) => void) => { paint(g); texture.needsUpdate = true; } };
}

/** Quebra um texto em linhas que cabem em `width` pixels. */
export function wrapText(g: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (g.measureText(next).width > width && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export type Player = { root: THREE.Group; body: THREE.Group; arms: THREE.Group[]; legs: THREE.Group[]; shadow: THREE.Mesh; yaw: number };
export type Pose = { x: number; z: number; yaw: number; y?: number; run?: number; phase?: number; armsUp?: number; arm0?: number; arm1?: number; lean?: number };

/** Bonequinhos low-poly: `makePlayer(cor)` cria um, `pose` posiciona a cada quadro. */
export function createPeople(scene: THREE.Scene, solid: (color: number, roughness?: number) => THREE.Material, shadowGeometry: THREE.BufferGeometry, shadowMaterial: THREE.Material) {
  const skin = solid(0xe2b48c, .8);
  const shorts = solid(0x1b2030, .8);
  const legGeometry = new THREE.CapsuleGeometry(.055, .3, 3, 8);
  const armGeometry = new THREE.CapsuleGeometry(.042, .26, 3, 8);
  const torsoGeometry = new THREE.CapsuleGeometry(.12, .18, 4, 10);
  const headGeometry = new THREE.SphereGeometry(.095, 14, 10);
  const makePlayer = (jersey: number): Player => {
    const root = new THREE.Group();
    const body = new THREE.Group();
    root.add(body);
    const torso = new THREE.Mesh(torsoGeometry, solid(jersey, .6));
    torso.position.y = .6;
    const head = new THREE.Mesh(headGeometry, skin);
    head.position.y = .9;
    body.add(torso, head);
    const limb = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, drop: number) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, 0);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = -drop;
      pivot.add(mesh);
      body.add(pivot);
      return pivot;
    };
    const legs = [limb(legGeometry, shorts, .07, .42, .2), limb(legGeometry, shorts, -.07, .42, .2)];
    const arms = [limb(armGeometry, skin, .17, .74, .17), limb(armGeometry, skin, -.17, .74, .17)];
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    scene.add(root, shadow);
    return { root, body, arms, legs, shadow, yaw: 0 };
  };
  const pose = (p: Player, o: Pose, k: number) => {
    const y = o.y ?? 0, run = o.run ?? 0, phase = o.phase ?? 0, up = o.armsUp ?? 0;
    p.root.position.set(o.x, 0, o.z);
    p.yaw = k >= 1 ? o.yaw : lerpAngle(p.yaw, o.yaw, k);
    p.root.rotation.y = p.yaw;
    p.body.position.y = y;
    p.body.rotation.x = o.lean ?? 0;
    const swing = Math.sin(phase) * .9 * run;
    const tuck = y > .05 ? -.5 : 0;
    p.legs[0].rotation.x = swing + tuck;
    p.legs[1].rotation.x = -swing + tuck * .6;
    p.arms[0].rotation.x = o.arm0 ?? -swing * .8;
    p.arms[1].rotation.x = o.arm1 ?? swing * .8;
    p.arms[0].rotation.z = .12 + up * 2.5;
    p.arms[1].rotation.z = -.12 - up * 2.5;
    p.shadow.position.set(o.x, .004, o.z);
    p.shadow.scale.setScalar(1 - Math.min(y, .6) * .7);
  };
  return { makePlayer, pose };
}
