import localFont from "next/font/local";

const tiemposHeadline = localFont({
  src: [
    { path: "../../public/fonts/TiemposHeadline-Regular.otf", weight: "400", style: "normal" },
    { path: "../../public/fonts/TiemposHeadline-Semibold.otf", weight: "600", style: "normal" },
  ],
  variable: "--font-tiempos-headline",
  display: "swap",
});

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <div className={`blog-theme ${tiemposHeadline.variable}`}>{children}</div>;
}
