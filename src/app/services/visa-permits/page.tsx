import ServiceDetailPage from "@/components/ServiceDetailPage";
import { Globe } from "lucide-react";

export default function VisaPermitsPage() {
  return (
    <ServiceDetailPage
      title="Visas & Work Permits"
      description="Facilitate smooth immigration and compliance solutions for your workforce."
      icon={Globe}
      content={{
        overview: "At Axia HR Advisory, we go beyond recruitment by assisting employers in hiring international talent. In compliance with Tanzanian immigration laws, we manage all work and residence permits, business passes, and related immigration processes—ensuring a smooth and lawful transition for both employers and employees.",
        services: [
          "Work Permits (Class A, B & C) – for investors, expatriate employees, and professionals.",
          "Residence Permits (Class A, B & C) – allowing lawful stay for work, business, or dependents.",
          "Business Passes – for short-term business visits or temporary assignments.",
          "Student Passes – for foreign students enrolled in Tanzanian institutions.",
          "Dependent Passes – for family members of expatriates residing in Tanzania.",
          "Special Passes – for urgent or short-term work authorization pending full permit approval."
        ],
        approach: "Our end-to-end support ensures full compliance with Tanzanian immigration regulations, providing employers and employees with a seamless relocation experience."
      }}
      ctaText="Request More Information"
      ctaLink="/contact"
    />
  );
}

