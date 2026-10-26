"use client";

import dynamic from "next/dynamic";
import type { VisualVariant } from "@/data/visuals";

const ProjectScene3D = dynamic(() => import("./ProjectScene3D").then(module => module.ProjectScene3D), {
  ssr: false,
  loading: () => <div className="pscene" aria-hidden="true" />,
});

export function ProjectScene(props: { variant: VisualVariant; interactive?: boolean; compact?: boolean; stage?: number | null; onStage?: (index: number | null) => void }) {
  return <ProjectScene3D {...props} />;
}
