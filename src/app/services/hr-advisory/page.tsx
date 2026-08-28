import ServiceDetailPage from "@/components/ServiceDetailPage";
import { Target } from "lucide-react";

export default function HRAdvisoryPage() {
  return (
    <ServiceDetailPage
      title="HR Advisory & Strategy"
      description="Expert guidance on organizational development and workforce optimization."
      icon={Target}
      content={{
        overview: "We help organizations align their human capital with business goals. Our expert guidance in organizational development, workforce planning, and HR strategy ensures sustainable growth and high-performing teams.",
        services: [
          "Organizational development",
          "Workforce planning",
          "HR strategy & policy design",
          "Change management",
          "Leadership advisory"
        ]
      }}
      ctaText="Get Started with HR Advisory"
      ctaLink="/contact"
    />
  );
}

