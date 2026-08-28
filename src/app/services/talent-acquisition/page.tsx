import ServiceDetailPage from "@/components/ServiceDetailPage";
import { Users } from "lucide-react";

export default function TalentAcquisitionPage() {
  return (
    <ServiceDetailPage
      title="Talent Acquisition"
      description="We help you find, attract, and hire the best talent for your organization through strategic recruitment solutions."
      icon={Users}
      content={{
        overview: "At Axia HR Advisory, we specialize in connecting exceptional talent with forward-thinking organizations. Our comprehensive talent acquisition services streamline your hiring process, reduce time-to-fill, and ensure you find candidates who align with your company culture and business objectives.",
        services: [
          "Strategic Talent Sourcing: Leverage our extensive network and advanced sourcing techniques to find qualified candidates.",
          "Candidate Screening & Assessment: Comprehensive evaluation of skills, experience, and cultural fit.",
          "Interview Coordination: Manage the entire interview process from scheduling to feedback collection.",
          "Background Verification: Thorough reference checks and background screening for peace of mind.",
          "Offer Management: Support in crafting competitive offers and negotiating terms.",
          "Onboarding Support: Ensure smooth transition for new hires into your organization.",
          "Employer Branding: Enhance your company's reputation as an employer of choice.",
          "Recruitment Analytics: Data-driven insights to optimize your hiring strategy."
        ]
      }}
      ctaText="Start Hiring Today"
      ctaLink="/employer/register"
    />
  );
}

