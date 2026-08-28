import ServiceDetailPage from "@/components/ServiceDetailPage";
import { Building2 } from "lucide-react";

export default function OrganizationalDesignPage() {
  return (
    <ServiceDetailPage
      title="Organizational Structuring & Restructuring"
      description="Design and realign teams for maximum efficiency and performance."
      icon={Building2}
      content={{
        overview: "We design and restructure organizations for start-ups, SMEs, and established businesses to maximize efficiency, drive innovation, and achieve long-term goals.",
        services: [
          "New organizational design",
          "Restructuring existing structures",
          "Aligning roles and processes with strategy",
          "Implementation plans for smooth transitions"
        ]
      }}
      ctaText="Partner with Us"
      ctaLink="/contact"
    />
  );
}

