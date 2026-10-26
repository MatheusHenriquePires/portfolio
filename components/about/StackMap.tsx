"use client";

import Link from "next/link";
import { useState } from "react";
import type { PointerEvent } from "react";
import { profile } from "@/data/profile";

/**
 * Mapa stack × projetos. Escolher uma tecnologia acende os projetos em que ela foi usada;
 * escolher um projeto acende a stack dele. O mouse pré-visualiza, o clique fixa.
 */

type Selection = { kind: "tech"; name: string } | { kind: "place"; id: string } | null;

const TECHS = profile.stack.flatMap(group => group.items);
const same = (a: Selection, b: Selection) => !!a && !!b && (a.kind === "tech" ? b.kind === "tech" && a.name === b.name : b.kind === "place" && a.id === b.id);
const placeName = (id: string) => profile.places.find(place => place.id === id)?.name ?? id;
const mouseOnly = (handler: () => void) => (event: PointerEvent) => { if (event.pointerType === "mouse") handler(); };

export function StackMap() {
  const [selected, setSelected] = useState<Selection>(null);
  const [preview, setPreview] = useState<Selection>(null);
  const active = preview ?? selected;

  const litPlaces = active?.kind === "tech" ? TECHS.find(tech => tech.name === active.name)?.used ?? [] : active?.kind === "place" ? [active.id] : [];
  const litTechs = active?.kind === "place" ? TECHS.filter(tech => tech.used.includes(active.id)).map(tech => tech.name) : active?.kind === "tech" ? [active.name] : [];
  const toggle = (next: Selection) => setSelected(current => same(current, next) ? null : next);
  const state = (lit: boolean) => !active ? undefined : lit ? "is-lit" : "is-dim";

  const readout = active?.kind === "tech"
    ? { cmd: `grep -rl "${active.name}" ./projetos`, out: `${litPlaces.length} ${litPlaces.length === 1 ? "resultado" : "resultados"} · ${litPlaces.map(placeName).join(", ")}` }
    : active?.kind === "place"
      ? { cmd: `cat ./projetos/${active.id}/stack`, out: `${litTechs.length} tecnologias · ${litTechs.join(", ")}` }
      : { cmd: "ls ./projetos", out: `${profile.places.length} projetos · escolha uma tecnologia ou um projeto` };

  return <div className="stack-map" onPointerLeave={() => setPreview(null)}>
    <div className="stack-map__groups">
      {profile.stack.map(group => <div key={group.area} className="stack-map__group">
        <p className="stack-map__area label">{group.area}</p>
        <ul className="stack-map__chips">
          {group.items.map(tech => {
            const item: Selection = { kind: "tech", name: tech.name };
            return <li key={tech.name}>
              <button type="button" className={state(litTechs.includes(tech.name))} aria-pressed={same(selected, item)}
                onClick={() => toggle(item)} onPointerEnter={mouseOnly(() => setPreview(item))} onPointerLeave={mouseOnly(() => setPreview(null))}>
                {tech.name}<small aria-label={`usado em ${tech.used.length}`}>{tech.used.length}</small>
              </button>
            </li>;
          })}
        </ul>
      </div>)}
    </div>

    <aside className="stack-map__panel" aria-label="Onde usei">
      <div className="stack-map__readout" aria-live="polite">
        <p><span aria-hidden="true">$ </span>{readout.cmd}</p>
        <p className="stack-map__out">{readout.out}</p>
      </div>
      <ul className="stack-map__places">
        {profile.places.map(place => {
          const item: Selection = { kind: "place", id: place.id };
          const count = TECHS.filter(tech => tech.used.includes(place.id)).length;
          return <li key={place.id} className={state(litPlaces.includes(place.id))}>
            <button type="button" aria-pressed={same(selected, item)} onClick={() => toggle(item)}
              onPointerEnter={mouseOnly(() => setPreview(item))} onPointerLeave={mouseOnly(() => setPreview(null))}>
              <span className="stack-map__dot" aria-hidden="true" />
              <span className="stack-map__name">{place.name}<small>{place.context}</small></span>
              <span className="stack-map__count" aria-label={`${count} tecnologias`}>{count}</span>
            </button>
            {place.slug && <Link href={`/projetos/${place.slug}`} className="stack-map__case" aria-label={`Ver o case ${place.name}`}>case ↗</Link>}
          </li>;
        })}
      </ul>
      {selected && <button type="button" className="stack-map__clear" onClick={() => setSelected(null)}>limpar seleção</button>}
    </aside>
  </div>;
}
