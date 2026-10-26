"use client";

import dynamic from "next/dynamic";

const GenesisScene3D = dynamic(() => import("./GenesisScene3D").then(module => module.GenesisScene3D), {
  ssr: false,
  loading: () => <div className="pscene" aria-hidden="true" />,
});

/** Cena 3D da escola do Gênesis, exibida durante o "Ver como funciona". */
export function GenesisScene(props: { stage: number; onStage?: (index: number | null) => void }) {
  return <GenesisScene3D {...props} />;
}
