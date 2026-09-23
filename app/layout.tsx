import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aurora | Segurança e acolhimento em Rio Claro",
  description: "Mapa de registros históricos, percepção de segurança e relatos sem identificação em Rio Claro.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
