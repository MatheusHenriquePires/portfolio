"use client";

import dynamic from "next/dynamic";

const DeveloperCore3D = dynamic(() => import("./DeveloperCore3D").then(module => module.DeveloperCore3D), {
  ssr: false,
  loading: () => <div className="developer-core hero-system" aria-hidden="true" />,
});

export function DeveloperScene() {
  return <DeveloperCore3D />;
}
