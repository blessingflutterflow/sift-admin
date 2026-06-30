import type { Metadata } from "next";
import { Sofia_Sans } from "next/font/google";
import "./globals.css";

// Sofia Sans — the closest open-source match to Mastercard's MarkForMC, and the
// font that carries the premium editorial feel. Variable weights 400–800.
const sofia = Sofia_Sans({
  variable: "--font-sofia",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Sift Admin",
  description: "Sift operations dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sofia.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        {children}
      </body>
    </html>
  );
}
