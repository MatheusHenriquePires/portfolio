/**
 * Movimento próprio de cada universo da foto. Cada efeito desenha o quadro inteiro
 * (imagem + camada animada) a partir do tempo `t` e do intervalo `dt`, em segundos.
 * O efeito é escolhido pelo id do arquivo (ex.: 04-matrix.jpg → "matrix").
 */

export type Paint = (ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, t: number, dt: number) => void;

const rand = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/** Desenha a imagem ampliada em `scale` (≥ 1, sempre cobrindo o quadro) e deslocada. */
function zoomed(ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, scale: number, ox = 0, oy = 0) {
  const size = img.width, w = size * scale, max = (w - size) / 2;
  const x = Math.max(-max * 2, Math.min(0, -max + ox)), y = Math.max(-max * 2, Math.min(0, -max + oy));
  ctx.drawImage(img, x, y, w, w);
}

/** Foto real e universos sem efeito: respiração lenta. */
const breathe: Paint = (ctx, img, t) => zoomed(ctx, img, 1.012 + .012 * Math.sin(t * .5));

/** Blocos: câmera passeando devagar e cubinhos subindo pelas laterais. */
function blocks(size: number): Paint {
  const spawn = (anywhere: boolean) => ({
    x: Math.random() < .5 ? Math.random() * size * .26 : size * (.74 + Math.random() * .26),
    y: anywhere ? Math.random() * size : size + Math.random() * size * .1,
    s: size * (.012 + Math.random() * .016),
    v: size * (.035 + Math.random() * .05),
    color: pick(["#7ccf3a", "#5aa02c", "#f4f4f4", "#9c6b3c"]),
  });
  const cubes = Array.from({ length: 16 }, () => spawn(true));
  return (ctx, img, t, dt) => {
    zoomed(ctx, img, 1.05 + .015 * Math.sin(t * .35), Math.sin(t * .22) * size * .018, Math.cos(t * .3) * size * .008);
    for (const [i, cube] of cubes.entries()) {
      cube.y -= cube.v * dt;
      if (cube.y < -cube.s) cubes[i] = spawn(false);
      const fade = Math.min(1, (size - cube.y) / (size * .25), cube.y / (size * .2));
      ctx.globalAlpha = .75 * Math.max(0, fade);
      ctx.fillStyle = cube.color;
      ctx.fillRect(cube.x, cube.y, cube.s, cube.s);
      ctx.fillStyle = "#0000004d";
      ctx.fillRect(cube.x, cube.y + cube.s * .7, cube.s, cube.s * .3);
    }
    ctx.globalAlpha = 1;
  };
}

/** 16-bit: estrelas piscando em degraus, uma estrela cadente de vez em quando e linhas de CRT. */
function pixels(size: number): Paint {
  const unit = Math.max(2, Math.round(size / 170));
  const stars = Array.from({ length: 22 }, (_, i) => ({
    x: Math.round((rand(i) < .5 ? rand(i + 50) * .27 : .73 + rand(i + 50) * .27) * size / unit) * unit,
    y: Math.round(rand(i + 100) * size * .55 / unit) * unit,
    phase: rand(i + 200) * 6, speed: 1.5 + rand(i + 300) * 2,
  }));
  return (ctx, img, t) => {
    ctx.drawImage(img, 0, 0);
    for (const star of stars) {
      const level = Math.floor((Math.sin(t * star.speed + star.phase) + 1) * 1.5); // 0..3, em degraus
      if (!level) continue;
      ctx.fillStyle = level === 3 ? "#fff6c8" : level === 2 ? "#9fc4ff" : "#4f7dff";
      ctx.fillRect(star.x, star.y, unit, unit);
      if (level === 3) {
        ctx.fillRect(star.x - unit, star.y, unit, unit); ctx.fillRect(star.x + unit, star.y, unit, unit);
        ctx.fillRect(star.x, star.y - unit, unit, unit); ctx.fillRect(star.x, star.y + unit, unit, unit);
      }
    }
    const shoot = (t % 5.5) / .9; // estrela cadente nos primeiros 0,9 s de cada 5,5 s
    if (shoot < 1) {
      const sx = size * (.98 - shoot * .5), sy = size * (.06 + shoot * .2);
      for (let k = 0; k < 7; k++) {
        ctx.globalAlpha = 1 - k / 7;
        ctx.fillStyle = "#fff6c8";
        ctx.fillRect(Math.round((sx + k * unit * 2) / unit) * unit, Math.round((sy - k * unit * .8) / unit) * unit, unit, unit);
      }
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = "#00000024";
    for (let y = 0; y < size; y += unit * 2) ctx.fillRect(0, y, size, Math.max(1, unit / 2));
    const bar = ((t * .12) % 1.3 - .15) * size;
    const glow = ctx.createLinearGradient(0, bar - size * .06, 0, bar + size * .06);
    glow.addColorStop(0, "#ffffff00"); glow.addColorStop(.5, "#ffffff10"); glow.addColorStop(1, "#ffffff00");
    ctx.fillStyle = glow;
    ctx.fillRect(0, bar - size * .06, size, size * .12);
  };
}

/** Quadrinhos: traço "tremendo" como desenho animado à mão e um impacto (POW) periódico. */
function comic(size: number): Paint {
  return (ctx, img, t) => {
    const frame = Math.floor(t * 8);
    const hit = (t % 3.2) / .45; // impacto nos primeiros 0,45 s de cada 3,2 s
    const punch = hit < 1 ? Math.sin(hit * Math.PI) : 0;
    const shake = size * (.004 + punch * .01);
    zoomed(ctx, img, 1.03 + punch * .035, (rand(frame) - .5) * shake * 2, (rand(frame + 9) - .5) * shake * 2);
    if (punch > 0) {
      ctx.globalAlpha = punch * .22;
      ctx.fillStyle = "#fff4c2";
      ctx.fillRect(0, 0, size, size);
      ctx.globalAlpha = punch * .5;
      ctx.strokeStyle = "#11111180";
      ctx.lineWidth = Math.max(1, size / 400);
      ctx.beginPath();
      for (let k = 0; k < 28; k++) {
        const a = (k / 28) * Math.PI * 2 + rand(k + frame) * .1;
        ctx.moveTo(size / 2 + Math.cos(a) * size * .58, size / 2 + Math.sin(a) * size * .58);
        ctx.lineTo(size / 2 + Math.cos(a) * size * .8, size / 2 + Math.sin(a) * size * .8);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };
}

/** Código: colunas de caracteres subindo e descendo pela tela, mais ralas sobre o rosto. */
function code(size: number): Paint {
  const font = Math.round(size / 34);
  const GLYPHS = "アイウエオカキクケコサシスセソタチツテト0123456789{}[]<>/=;$#+*".split("");
  const columns = Math.ceil(size / font);
  const spawn = (i: number, anywhere: boolean) => {
    const center = Math.abs(i / columns - .5) < .2;
    const dir = Math.random() < .5 ? 1 : -1;
    const len = 6 + Math.floor(Math.random() * 14);
    const start = dir > 0 ? -Math.random() * size * .6 : size + Math.random() * size * .6;
    return {
      x: i * font + font / 2, dir, len,
      y: anywhere ? Math.random() * size : start,
      speed: size * (.12 + Math.random() * .3),
      alpha: center ? .35 : .9,
      on: Math.random() < (center ? .3 : .7),
      glyphs: Array.from({ length: len }, () => pick(GLYPHS)),
    };
  };
  const streams = Array.from({ length: columns }, (_, i) => spawn(i, true));
  return (ctx, img, _t, dt) => {
    ctx.drawImage(img, 0, 0);
    ctx.font = `600 ${font}px ui-monospace, "Cascadia Mono", Consolas, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalCompositeOperation = "lighter";
    for (const [i, s] of streams.entries()) {
      s.y += s.speed * dt * s.dir;
      const tail = s.len * font;
      if ((s.dir > 0 && s.y - tail > size) || (s.dir < 0 && s.y + tail < 0)) { streams[i] = spawn(i, false); continue; }
      if (!s.on) continue;
      for (let k = 0; k < s.len; k++) {
        const y = s.y - k * font * s.dir;
        if (y < -font || y > size + font) continue;
        if (Math.random() < .015) s.glyphs[k] = pick(GLYPHS);
        ctx.globalAlpha = s.alpha * (k === 0 ? 1 : (1 - k / s.len) * .75);
        ctx.fillStyle = k === 0 ? "#eaffea" : "#3dff5a";
        ctx.fillText(s.glyphs[k], s.x, y);
      }
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  };
}

const EFFECTS: Record<string, (size: number) => Paint> = { blocos: blocks, "16-bit": pixels, hq: comic, matrix: code };

export const createPaint = (id: string, size: number): Paint => EFFECTS[id]?.(size) ?? breathe;
