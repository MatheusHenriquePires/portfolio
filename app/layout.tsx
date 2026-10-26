import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { site } from "@/data/site";
import "@/styles/globals.css";
import "@/styles/systems.css";

const sora = localFont({ src: "../node_modules/@fontsource-variable/sora/files/sora-latin-wght-normal.woff2", weight: "100 800", variable: "--font-sora", display: "swap" });
const manrope = localFont({ src: "../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2", weight: "200 800", variable: "--font-manrope", display: "swap" });
const space = localFont({ src: "../node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2", weight: "300 700", variable: "--font-space", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Matheus Henrique — Desenvolvedor Full Stack", template: "%s — Matheus Henrique" },
  description: site.description,
  openGraph: { type: "website", locale: "pt_BR", siteName: site.name, title: "Matheus Henrique — Portfólio", description: site.description },
  twitter: { card: "summary_large_image", title: "Matheus Henrique — Portfólio", description: site.description },
};
export const viewport: Viewport = { themeColor: "#0b0d10" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className={`${sora.variable} ${manrope.variable} ${space.variable}`}>{children}</body></html>;
}
