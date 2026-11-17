import type { Metadata } from "next";
import { TrustPage } from "../../components/trust-page";
import { aboutContent } from "../../lib/trust-content.mjs";

export const metadata: Metadata = {
  title: "About TaskFlow | Pratik Dhandare",
  description:
    "Learn what TaskFlow project and task management software does and who builds it.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <TrustPage {...aboutContent} />;
}
