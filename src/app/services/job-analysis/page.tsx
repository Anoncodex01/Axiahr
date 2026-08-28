import ServiceDetailPage from "@/components/ServiceDetailPage";
import { Calculator } from "lucide-react";

export default function JobAnalysisPage() {
  return (
    <ServiceDetailPage
      title="Job Description, Job Evaluation, Salary Survey & Workload Analysis"
      description="Ensure clarity, fairness, and competitive compensation."
      icon={Calculator}
      content={{
        overview: "We provide comprehensive job analysis services to help organizations establish clear role definitions, fair compensation structures, and balanced workloads.",
        services: [
          "Job Description Development: Crafting detailed and accurate job descriptions for every role.",
          "Job Evaluation: Assessing the relative worth of positions to ensure fair and equitable compensation.",
          "Salary Surveys: Providing insights into industry standards to attract and retain top talent.",
          "Workload Analysis: Identifying workload imbalances and promoting fair distribution to boost productivity.",
          "HR Optimization: Offering tailored solutions to build strong, high-performing teams that drive business success."
        ]
      }}
      ctaText="Partner with Us"
      ctaLink="/contact"
    />
  );
}

