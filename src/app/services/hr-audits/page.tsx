import ServiceDetailPage from "@/components/ServiceDetailPage";
import { Shield } from "lucide-react";

export default function HRAuditsPage() {
  return (
    <ServiceDetailPage
      title="HR Audits"
      description="Identify gaps, ensure compliance, and strengthen HR practices."
      icon={Shield}
      content={{
        overview: "Our HR audits identify gaps, assess compliance, and recommend improvements to strengthen HR practices and mitigate risks.",
        services: [
          "Compliance reviews",
          "HR policy and process evaluation",
          "Risk assessment and mitigation",
          "Recommendations for improvement"
        ]
      }}
      ctaText="Request an HR Audit"
      ctaLink="/contact"
    />
  );
}

