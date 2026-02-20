import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pluvio Web 3.x",
  description: "Modernizacao do Pluvio 2.1 para plataforma web.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
