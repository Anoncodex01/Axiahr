import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollAnimate from "@/components/ScrollAnimate";
import { 
  ArrowRight, 
  Target, 
  TrendingUp, 
  Shield, 
  Users, 
  Building2,
  GraduationCap,
  Calculator,
  UserCheck,
  Globe,
  BookOpen,
  CheckCircle
} from "lucide-react";

export default function SolutionsPage() {
  const allServices = [
    {
      id: 1,
      title: "Employee Recruitment, Selection & Retention",
      description: "We connect companies with top talent and help job seekers find, grow, and retain meaningful careers—quickly, professionally, and with trust.",
      icon: UserCheck,
      href: "/services/recruitment-retention"
    },
    {
      id: 2,
      title: "HR Advisory & Strategy",
      description: "Expert guidance on organizational development and workforce optimization.",
      icon: Target,
      href: "/services/hr-advisory"
    },
    {
      id: 3,
      title: "Organizational Structuring & Restructuring",
      description: "Design and realign teams for maximum efficiency and performance.",
      icon: Building2,
      href: "/services/organizational-design"
    },
    {
      id: 4,
      title: "Job Description, Job Evaluation, Salary Survey & Workload Analysis",
      description: "Ensure clarity, fairness, and competitive compensation.",
      icon: Calculator,
      href: "/services/job-analysis"
    },
    {
      id: 5,
      title: "Training & Development",
      description: "Upskill employees to enhance productivity and drive growth.",
      icon: GraduationCap,
      href: "/services/training-development"
    },
    {
      id: 6,
      title: "Performance Management",
      description: "Align employee goals with business objectives for measurable results.",
      icon: TrendingUp,
      href: "/services/performance-management"
    },
    {
      id: 7,
      title: "HR Audits",
      description: "Identify gaps, ensure compliance, and strengthen HR practices.",
      icon: Shield,
      href: "/services/hr-audits"
    },
    {
      id: 8,
      title: "HR Policies & Procedures",
      description: "Develop frameworks that promote consistency, fairness, and governance.",
      icon: BookOpen,
      href: "/services/policies-procedures"
    },
    {
      id: 9,
      title: "Visas & Work Permits",
      description: "Facilitate smooth immigration and compliance solutions for your workforce.",
      icon: Globe,
      href: "/services/visa-permits"
    },
    {
      id: 10,
      title: "Due Diligence",
      description: "Evaluate human capital during mergers, acquisitions, and partnerships.",
      icon: CheckCircle,
      href: "/services/due-diligence"
    },
    {
      id: 11,
      title: "Independent Reference Checks",
      description: "Ensure thorough validation of candidate backgrounds and experience.",
      icon: UserCheck,
      href: "/services/reference-checks"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-[#114373] to-[#1a3658] relative overflow-hidden">
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <ScrollAnimate delay="0.2s" animationClass="animate-fade-in-up">
              <p className="text-[#6db99f] text-sm font-outfit-semibold uppercase tracking-wide mb-4">
                OUR SERVICES
              </p>
            </ScrollAnimate>
            
            <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-outfit-bold text-white mb-6 leading-tight">
                Comprehensive HR Solutions
              </h1>
            </ScrollAnimate>
            
            <ScrollAnimate delay="0.4s" animationClass="animate-fade-in-up">
              <p className="text-xl text-white/90 leading-relaxed font-outfit-regular">
                At Axia HR Advisory, we provide comprehensive, end-to-end HR solutions tailored to meet your organization's unique needs.
              </p>
            </ScrollAnimate>
          </div>
        </div>
      </section>

      {/* All Services Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {allServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <ScrollAnimate 
                  key={service.id} 
                  delay={`${0.5 + index * 0.1}s`} 
                  animationClass="animate-fade-in-up" 
                  className="relative"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-2 border-[#6db99f]">
                        <IconComponent className="w-8 h-8 text-gray-700" />
                      </div>
                    </div>
                    <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-[#6db99f]"></div>
                    <div className="flex-1 pt-2">
                      <h3 className="text-xl font-outfit-bold text-gray-900 mb-4">
                        {service.title}
                      </h3>
                      <p className="text-gray-700 leading-relaxed mb-6 font-outfit-regular">
                        {service.description}
                      </p>
                      <Link
                        href={service.href}
                        className="inline-flex items-center text-gray-900 font-outfit-semibold hover:text-[#6db99f] transition-colors duration-300 group"
                      >
                        Read more
                        <ArrowRight className="w-4 h-4 ml-2 text-[#6db99f] group-hover:translate-x-1 transition-transform duration-300" />
                      </Link>
                    </div>
                  </div>
                </ScrollAnimate>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ScrollAnimate delay="0.2s" animationClass="animate-fade-in-up">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-outfit-bold text-gray-900 mb-6 leading-tight">
              Ready to Transform Your HR Strategy?
            </h2>
          </ScrollAnimate>
          
          <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up">
            <p className="text-lg text-gray-700 leading-relaxed font-outfit-regular mb-8 max-w-2xl mx-auto">
              Let's discuss how our comprehensive HR solutions can help you build a high-performing workforce, optimize your organizational structure, and achieve your business objectives.
            </p>
          </ScrollAnimate>
          
          <ScrollAnimate delay="0.4s" animationClass="animate-fade-in-up">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center bg-[#6db99f] hover:bg-[#5aa88a] text-white px-8 py-4 rounded-lg font-outfit-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Contact Us
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/employer/register"
                className="inline-flex items-center border-2 border-[#6db99f] text-[#6db99f] hover:bg-[#6db99f] hover:text-white px-8 py-4 rounded-lg font-outfit-semibold transition-all duration-300"
              >
                Get Started
              </Link>
            </div>
          </ScrollAnimate>
        </div>
      </section>

      <Footer />
    </div>
  );
}

