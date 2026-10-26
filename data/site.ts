import { profile } from "./profile";

export const site = {
  name: profile.name,
  brand: "MH/",
  domain: "matheushenrique.dev",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://matheushenrique.dev",
  location: profile.location,
  description: profile.description,
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || profile.email,
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || profile.linkedin,
  github: process.env.NEXT_PUBLIC_GITHUB_URL || profile.github,
};

export const navigation = [
  { href: "/projetos", label: "Projetos" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];
