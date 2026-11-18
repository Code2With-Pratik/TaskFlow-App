import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "TaskFlow | Your development workflow, in one workspace",
  description:
    "Plan projects, coordinate tasks, collaborate with your team, and connect your GitHub workflow with TaskFlow.",
  alternates: { canonical: "/" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "TaskFlow",
      alternateName: ["TaskFlow by Pratik Dhandare", "Code2WithPratik"],
      url: siteUrl,
      founder: {
        "@type": "Person",
        name: "Pratik Dhandare",
        url: "https://github.com/Code2With-Pratik",
      },
      sameAs: ["https://github.com/Code2With-Pratik"],
    },
    {
      "@type": "SoftwareApplication",
      name: "TaskFlow",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Project and task management software for planning work, coordinating teams, and tracking delivery.",
      url: siteUrl,
      creator: {
        "@type": "Person",
        name: "Pratik Dhandare",
      },
      keywords:
        "TaskFlow task management, TaskFlow project planning, project management software, team collaboration, task tracking",
      knowsAbout: [
        "TaskFlow task management",
        "TaskFlow project planning",
        "Team collaboration",
        "TaskFlow API",
      ],
    },
  ],
};

const structuredDataJson = JSON.stringify(structuredData).replace(/</g, "\\u003c");

export default function Home() {
  return (
    <>
      <script type="application/ld+json">{structuredDataJson}</script>
      <LandingPage />
    </>
  );
}
