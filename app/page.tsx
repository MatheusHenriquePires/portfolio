import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/SiteShell";
import { Hero } from "@/components/home/Hero";
import { ProjectsSection } from "@/components/home/ProjectsSection";
import { Capabilities } from "@/components/home/Capabilities";
import { AboutTeaser } from "@/components/home/AboutTeaser";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return <SiteShell><Hero /><ProjectsSection /><Capabilities /><AboutTeaser /></SiteShell>;
}
