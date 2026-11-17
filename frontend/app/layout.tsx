import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { siteUrl } from "../lib/site";
import { Providers } from "./providers";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default:
      "TaskFlow by Pratik Dhandare | Project and Task Management",
    template: "%s · TaskFlow",
  },
  description:
    "TaskFlow is project and task management software for teams. Plan projects, coordinate tasks, track progress, and explore the TaskFlow API. By Pratik Dhandare, Code2WithPratik.",
  keywords: [
    "TaskFlow",
    "project management software",
    "task management",
    "team collaboration",
    "project planning",
    "task tracking",
    "TaskFlow API",
    "Pratik Dhandare",
    "Code2WithPratik",
  ],
  authors: [{ name: "Pratik Dhandare", url: "https://github.com/Code2With-Pratik" }],
  creator: "Pratik Dhandare · Code2WithPratik",
  publisher: "TaskFlow",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "TaskFlow",
    title: "TaskFlow by Pratik Dhandare | Project and Task Management",
    description:
      "Plan projects, coordinate tasks, and follow team progress with TaskFlow, by Pratik Dhandare (Code2WithPratik).",
  },
  twitter: {
    card: "summary",
    title: "TaskFlow by Pratik Dhandare",
    description:
      "Project and task management software for teams. Built by Code2WithPratik.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Arima:wght@100..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
