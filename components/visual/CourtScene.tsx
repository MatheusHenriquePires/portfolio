"use client";

import dynamic from "next/dynamic";

const CourtScene3D = dynamic(() => import("./CourtScene3D").then(module => module.CourtScene3D), {
  ssr: false,
  loading: () => <div className="pscene" aria-hidden="true" />,
});

/** Cena 3D da quadra do Arena Replay, exibida durante o "Ver como funciona". */
export function CourtScene(props: { stage: number; onStage?: (index: number | null) => void }) {
  return <CourtScene3D {...props} />;
}
