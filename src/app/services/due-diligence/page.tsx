import ServiceDetailPage from "@/components/ServiceDetailPage";
import { CheckCircle } from "lucide-react";

export default function DueDiligencePage() {
  return (
    <ServiceDetailPage
      title="Due Diligence"
      description="Evaluate human capital during mergers, acquisitions, and partnerships."
      icon={CheckCircle}
      content={{
        overview: "Ensure your business decisions are backed by solid insights. We help you evaluate human capital during mergers, acquisitions, and partnerships.",
        services: [
          "Workforce structure & key talent",
          "Compensation & benefits review",
          "Compliance & HR risk assessment",
          "Talent gaps & critical roles",
          "Smooth integration planning"
        ]
      }}
      ctaText="Start Your Due Diligence"
      ctaLink="/contact"
    />
  );
}

