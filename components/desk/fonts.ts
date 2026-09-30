import { IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Serif } from "next/font/google";

// Scoped to the desk rather than the root layout — the blog keeps its own
// Tiempos/Geist stack. next/font self-hosts these at build time.
export const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-desk-serif",
});

export const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-desk-mono",
});

export const plexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-desk-sans",
});

export const deskFontVars = `${instrumentSerif.variable} ${plexMono.variable} ${plexSans.variable}`;
