import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { projects } from "@/data/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/projetos", "/sobre", "/contato", ...projects.map(p => `/projetos/${p.slug}`)].map(path => ({ url: `${site.url}${path}`, changeFrequency: "monthly", priority: path === "" ? 1 : .8 }));
}
