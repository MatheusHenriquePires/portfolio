import { ImageResponse } from "next/og";

export const alt = "Matheus Henrique — Desenvolvedor Full Stack";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0b0d10", color: "#f4f4ef", width: "100%", height: "100%", padding: 70 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26 }}><span>MH/</span><span style={{ color: "#6be7ff" }}>DESENVOLVEDOR FULL STACK</span></div>
    <div style={{ fontSize: 70, letterSpacing: -4, maxWidth: 1000, lineHeight: 1.08, fontWeight: 700 }}>Desenvolvimento web, do frontend ao backend.</div>
    <div style={{ color: "#c8ff32", fontSize: 28 }}>Matheus Henrique / Portfólio</div>
  </div>, size);
}
