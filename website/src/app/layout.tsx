import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Michael Peters - Web Developer Portfolio",
  description:
    "Ich bin ein Web Entwickler und fasziniere mich für Optimierung und Automatisierung. Ich habe Spaß an einer sauberen und guten Umsetzung.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
