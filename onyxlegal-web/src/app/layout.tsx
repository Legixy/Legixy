import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/lib/query-provider";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  style: ["normal", "italic"],
});

/**
 * Arabic.
 *
 * WHY A FACE AT ALL
 * -----------------
 * The product already renders Arabic — licence type names, authority names
 * and document labels all carry a `nameAr` and are shown with lang="ar". All
 * three Latin faces here are latin-subset only, so until now every one of
 * those strings fell through to whatever the OS happened to have. On macOS
 * that is Geeza Pro, on Windows Tahoma, on Android Noto Naskh: three
 * different colours, weights and baselines for the same string, none of them
 * chosen. An unchosen face is worse than no face, because it looks decided.
 *
 * WHY IBM PLEX SANS ARABIC
 * ------------------------
 * - Licence: SIL OFL 1.1. Commercial use, embedding and modification are all
 *   permitted with no attribution surface in the UI, and no runtime call to
 *   a third party (next/font self-hosts the file at build time).
 * - Interface-designed, not a text face pressed into UI work. It was drawn
 *   by Boutros for IBM's own design system, so it is already resolved for
 *   small sizes, tight leading and dense tables — which is what this product
 *   is made of.
 * - Harmonises with Instrument Sans: both are low-contrast humanist
 *   skeletons with open counters and a tall x-height (in Plex Arabic's case,
 *   tall medial forms), so the two sit on the same optical weight at the same
 *   pixel size. Cairo is more geometric and rides visibly lighter next to
 *   Instrument Sans; Almarai ships only four weights and no true 500.
 * - Coverage: Arabic, Arabic Supplement and Arabic Extended-A, which covers
 *   Saudi government and business terminology in full, plus the Persian and
 *   Urdu forms that turn up in company names on a commercial registration.
 * - Tabular figures in both the Western and Arabic-Indic sets.
 *
 * DIGITS: WESTERN (0–9), including inside Arabic runs. See the .tnum
 * utility in globals.css for the reasoning.
 */
const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Legixy — Licence & Compliance Tracking",
  description:
    "Track every licence, permit and registration your business holds in Saudi Arabia, with reminders before each renewal window closes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${instrumentSerif.variable} ${plexArabic.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
