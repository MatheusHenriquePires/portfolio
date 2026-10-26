import { PhotoMultiverse, type Universe } from "@/components/about/PhotoMultiverse";
import type { CSSProperties } from "react";

/** Monograma "MH" em pixel art (5×7 por letra), montado célula a célula por CSS. */
const LETTERS = {
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
};
const ROWS = LETTERS.M.map((row, i) => `${row}0${LETTERS.H[i]}`);
const COLS = ROWS[0].length;

const WHOAMI: [string, string][] = [
  ["função", "desenvolvedor full stack"],
  ["local", "Teresina, PI"],
  ["stack", "python · java · node · react · sql"],
];

/** Com fotos, mostra a foto passando pelos universos; sem elas, o monograma em pixel art. */
export function IdentityCard({ universes = [] }: { universes?: Universe[] }) {
  const photo = universes.length > 0;
  return <figure className={`identity-card${photo ? " identity-card--photo" : ""}`} aria-label="Cartão de identidade de Matheus Henrique: desenvolvedor full stack em Teresina, PI.">
    <div className="identity-card__head label" aria-hidden="true"><span>■ Identidade digital</span><span>MH / 01</span></div>
    <div className="identity-card__frame">
      {photo
        ? <PhotoMultiverse universes={universes} />
        : <div aria-hidden="true" className="identity-card__grid" style={{ "--cols": COLS } as CSSProperties}>
          {ROWS.flatMap((row, r) => [...row].map((cell, c) => <span key={`${r}-${c}`}
            className={cell === "1" ? (c < 5 ? "is-on is-m" : "is-on is-h") : undefined}
            style={{ "--d": `${(r + c) * 45}ms` } as CSSProperties} />))}
        </div>}
      <i aria-hidden="true" className="identity-card__spark" style={{ "--x": "12%", "--y": "18%" } as CSSProperties} />
      <i aria-hidden="true" className="identity-card__spark" style={{ "--x": "86%", "--y": "26%" } as CSSProperties} />
      <i aria-hidden="true" className="identity-card__spark" style={{ "--x": "9%", "--y": "78%" } as CSSProperties} />
      <i aria-hidden="true" className="identity-card__spark" style={{ "--x": "90%", "--y": "72%" } as CSSProperties} />
      <span aria-hidden="true" className="identity-card__scan" />
    </div>
    <div className="identity-card__whoami" aria-hidden="true">
      <p><span className="identity-card__prompt">$</span> whoami</p>
      <p className="identity-card__name">matheus.henrique</p>
      {WHOAMI.map(([key, value]) => <p key={key}><span className="identity-card__key">{key}:</span> {value}</p>)}
    </div>
    <figcaption className="identity-card__status label"><span className="identity-card__dot" />› matheus.henrique — online</figcaption>
  </figure>;
}
