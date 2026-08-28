import ServiceDetailPage from "@/components/ServiceDetailPage";
import { BookOpen } from "lucide-react";

export default function PoliciesProceduresPage() {
  return (
    <ServiceDetailPage
      title="HR Policies & Procedures"
      description="Develop frameworks that promote consistency, fairness, and governance."
      icon={BookOpen}
      content={{
        overview: "At Axia HR Advisory, we develop frameworks, policies, and employment contracts that ensure consistency, fairness, and compliance, creating a strong foundation for HR operations. All our policies and contracts are drafted in accordance with the labor laws and regulations of the respective country.",
        services: [
          "HR policy development",
          "Employee handbook creation",
          "Employment contracts",
          "Process standardization",
          "Regulatory compliance guidance"
        ]
      }}
      ctaText="Build HR Policies"
      ctaLink="/contact"
    />
  );
}

