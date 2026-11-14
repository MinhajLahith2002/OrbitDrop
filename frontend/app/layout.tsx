import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OrbitDrop | NASA Precision Satellite Irrigation Dispatch",
  description:
    "Interactive agricultural field boundary extraction, FAO-56 evapotranspiration modeling, and precision variable-rate water animation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/@geoman-io/leaflet-geoman-free@2.17.0/dist/leaflet-geoman.css"
        />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
