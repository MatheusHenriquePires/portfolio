import type { CSSProperties } from "react";
import { CodeSymbol3D } from "./CodeSymbol3D";

export function SystemModule3D({ symbol, title, detail, index, x, y }: { symbol: string; title: string; detail: string; index: number; x: number; y: number }) {
  return <div className={`system-node system-node--${index}`} style={{ "--node-x": `${x}%`, "--node-y": `${y}%` } as CSSProperties}>
    <CodeSymbol3D symbol={symbol} /><span className="node-title">{title}</span><span className="node-detail">{detail}</span><span className="node-light" />
  </div>;
}
