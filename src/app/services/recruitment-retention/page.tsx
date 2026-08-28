import ServiceDetailPage from "@/components/ServiceDetailPage";
import { UserCheck } from "lucide-react";

export default function RecruitmentRetentionPage() {
  return (
    <ServiceDetailPage
      title="Employee Recruitment, Selection & Retention"
      description="We connect companies with top talent and help job seekers find, grow, and retain meaningful careers—quickly, professionally, and with trust."
      icon={UserCheck}
      content={{
        overview: "At Axia HR Advisory, we simplify hiring by helping organizations attract, assess, and retain the right talent — saving time, cost, and risk while ensuring compliance with employment laws.",
        services: [
          "Workforce Planning: Define job roles and success factors.",
          "Talent Sourcing: Access a wide network of qualified candidates.",
          "Screening & Assessment: Conduct interviews, tests, and background checks.",
          "Selection Support: Coordinate interviews and shortlist top candidates.",
          "Offer & Onboarding: Manage offers and ensure smooth employee integration.",
          "Retention Strategies: Design engagement and career growth programs.",
          "Compliance Assurance: Align all practices with the labor laws of each country.",
          "HR Insights: Share hiring and retention data for better decision-making."
        ]
      }}
      ctaText="Start Your Hiring Journey"
      ctaLink="/employer/register"
    />
  );
}

