import ServiceDetailPage from "@/components/ServiceDetailPage";
import { TrendingUp } from "lucide-react";

export default function PerformanceManagementPage() {
  return (
    <ServiceDetailPage
      title="Performance Management"
      description="Align employee goals with business objectives for measurable results."
      icon={TrendingUp}
      content={{
        overview: "At Axia HR Advisory, we help organizations implement effective performance systems that align employee goals with business objectives and improve productivity. Performance management is key to motivating employees, enhancing engagement, and driving organizational success.",
        services: [
          "Set clear goals and KPIs aligned with business strategy",
          "Conduct performance appraisals to measure outcomes",
          "Provide feedback and coaching to support employee growth",
          "Design employee engagement strategies that incentivize high performance",
          "Identify and address performance gaps promptly"
        ],
        approach: "Our approach ensures employees are empowered, accountable, and motivated, while organizations maximize productivity and achieve long-term success."
      }}
      ctaText="Enhance Performance"
      ctaLink="/contact"
    />
  );
}

