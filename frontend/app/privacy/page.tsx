import type { Metadata } from "next";
import { TrustPage } from "../../components/trust-page";
import { privacyContent } from "../../lib/trust-content.mjs";

export const metadata: Metadata = {
  title: "TaskFlow Privacy | Data and Cookies",
  description:
    "Read how TaskFlow handles account, project, authentication, analytics, and integration data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <TrustPage {...privacyContent} />;
}
