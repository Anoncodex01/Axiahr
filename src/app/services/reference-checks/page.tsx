import ServiceDetailPage from "@/components/ServiceDetailPage";
import { UserCheck } from "lucide-react";

export default function ReferenceChecksPage() {
  return (
    <ServiceDetailPage
      title="Independent Reference Checks"
      description="Ensure thorough validation of candidate backgrounds and experience."
      icon={UserCheck}
      content={{
        overview: "At Axia HR Advisory, we deliver a fast, independent, and confidential validation of each candidate's background so you can hire with confidence.",
        services: [
          "Client briefing: We capture your key probe areas and the candidate CV.",
          "Independent referees: We locate and confidentially speak to trusted referees beyond those supplied by the candidate.",
          "Candid conversation: Structured questions cover performance, integrity, leadership, career path and your specific probes.",
          "Social media check: Public profiles are screened for reputational or discriminatory concerns.",
          "Advisory note: Expert interpretation of findings to highlight fit and risk.",
          "Confidential report: Auditable summary delivered within 3–5 business days."
        ],
        approach: "Why Axia HR Advisory? We are independent & unbiased, role-sensitive with structured checks, quick turnaround with auditable outcomes, and fully confidential and compliant. Gain clearer insights and reduce hiring risk."
      }}
      ctaText="Request Reference Check"
      ctaLink="/contact"
    />
  );
}

