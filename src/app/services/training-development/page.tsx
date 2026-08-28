import ServiceDetailPage from "@/components/ServiceDetailPage";
import { GraduationCap } from "lucide-react";

export default function TrainingDevelopmentPage() {
  return (
    <ServiceDetailPage
      title="Training & Development"
      description="Upskill employees to enhance productivity and drive growth."
      icon={GraduationCap}
      content={{
        overview: "At Axia HR Advisory, we believe training and development are key to building a high-performing workforce. We create customized learning programs that upskill employees, enhance productivity, and develop leadership capabilities. We begin with training needs assessments to identify skill gaps and design engaging, tailored programs that meet your organization's goals.",
        services: [
          "Soft Skills & Leadership Training – Enhance communication, teamwork, and leadership",
          "Technical & Functional Training – Equip employees with role-specific skills",
          "Coaching & Mentoring – Help employees apply new skills effectively",
          "Employee Development Plans – Structured paths for continuous growth"
        ],
        approach: "We also measure program effectiveness and make continuous improvements to ensure maximum impact."
      }}
      ctaText="Explore Training Programs"
      ctaLink="/contact"
    />
  );
}

