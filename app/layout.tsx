import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const body = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-body",
});

const label = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-label",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#071D15",
};

export const metadata: Metadata = {
  title: "Het Geheim van de Senaatskamer",
  description: "Mobiel onderzoeksspel in de Senaatskamer van ADO Den Haag.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body className={`${body.variable} ${label.variable}`}>{children}</body>
    </html>
  );
}
