import type { Metadata, Viewport } from "next";
import "@kanaries/graphic-walker/dist/style.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://chartdek.vercel.com"),
  title: {
    default: "ChartDeck — Private analytics, on your terms",
    template: "%s · ChartDeck"
  },
  description:
    "Explore data locally with Graphic Walker, build charts with your own AI provider, and save portable workspaces. Open source under Apache-2.0.",
  applicationName: "ChartDeck",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ChartDeck — Private analytics, on your terms",
    description: "An open-source, local-first BI workspace with BYOK AI chart generation.",
    url: "https://chartdek.vercel.com",
    siteName: "ChartDeck",
    type: "website"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f3ec"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
