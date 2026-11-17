import type { Metadata } from "next";
import { TrustPage } from "../../components/trust-page";
import { contactContent } from "../../lib/trust-content.mjs";

export const metadata: Metadata = {
  title: "Contact TaskFlow | Code2WithPratik",
  description:
    "Contact the TaskFlow maintainer, report an issue, or send project feedback.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return <TrustPage {...contactContent} />;
}
