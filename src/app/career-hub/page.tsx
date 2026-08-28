import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollAnimate from "@/components/ScrollAnimate";
import { ArrowRight, ArrowLeft, BookOpen, TrendingUp, Users, FileText, Briefcase } from "lucide-react";

export default function CareerHubPage() {
  const resources = [
    {
      icon: BookOpen,
      title: "Market Insights",
      description: "Stay updated with the latest HR trends and market analysis",
      href: "/resources/market-insights"
    },
    {
      icon: TrendingUp,
      title: "Career Progression",
      description: "Guidance on advancing your HR career",
      href: "/resources/career-progression"
    },
    {
      icon: Users,
      title: "Industry Leaders",
      description: "Interviews and insights from HR executives",
      href: "/resources/industry-leaders"
    },
    {
      icon: FileText,
      title: "Salary Guides",
      description: "Comprehensive salary information by role and location",
      href: "/resources/salary-guides"
    },
    {
      icon: Briefcase,
      title: "Job Search Tips",
      description: "Expert advice on finding and securing HR positions",
      href: "/resources/job-search-tips"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-[#114373] to-[#1a3658] relative overflow-hidden">
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <ScrollAnimate delay="0.2s" animationClass="animate-fade-in-up">
            <Link
              href="/"
              className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors font-outfit-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </ScrollAnimate>

          <div className="text-center max-w-4xl mx-auto">
            <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up">
              <p className="text-[#6db99f] text-sm font-outfit-semibold uppercase tracking-wide mb-4">
                CAREER HUB
              </p>
            </ScrollAnimate>
            
            <ScrollAnimate delay="0.4s" animationClass="animate-fade-in-up">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-outfit-bold text-white mb-6 leading-tight">
                Resources & Insights
              </h1>
            </ScrollAnimate>
            
            <ScrollAnimate delay="0.5s" animationClass="animate-fade-in-up">
              <p className="text-xl text-white/90 leading-relaxed font-outfit-regular">
                Access market insights, hiring advice, salary guides, and thought leadership content to advance your HR career.
              </p>
            </ScrollAnimate>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollAnimate delay="0.2s" animationClass="animate-fade-in-up">
            <h2 className="text-3xl font-outfit-bold text-gray-900 mb-8 text-center">Explore Our Resources</h2>
          </ScrollAnimate>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resources.map((resource, index) => {
              const IconComponent = resource.icon;
              return (
                <ScrollAnimate 
                  key={index}
                  delay={`${0.3 + index * 0.1}s`} 
                  animationClass="animate-fade-in-up"
                >
                  <Link
                    href={resource.href}
                    className="block p-6 bg-white border border-gray-200 rounded-xl hover:border-[#6db99f] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="w-12 h-12 bg-[#6db99f]/10 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className="w-6 h-6 text-[#6db99f]" />
                    </div>
                    <h3 className="text-xl font-outfit-bold text-gray-900 mb-2">{resource.title}</h3>
                    <p className="text-gray-700 leading-relaxed font-outfit-regular">{resource.description}</p>
                    <div className="mt-4 inline-flex items-center text-[#6db99f] font-outfit-semibold group">
                      Learn more
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
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
              Ready to Advance Your Career?
            </h2>
          </ScrollAnimate>
          
          <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up">
            <p className="text-lg text-gray-700 leading-relaxed font-outfit-regular mb-8 max-w-2xl mx-auto">
              Explore job opportunities and take the next step in your HR career.
            </p>
          </ScrollAnimate>
          
          <ScrollAnimate delay="0.4s" animationClass="animate-fade-in-up">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/job-search"
                className="inline-flex items-center bg-[#6db99f] hover:bg-[#5aa88a] text-white px-8 py-4 rounded-lg font-outfit-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Browse Jobs
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/candidate/register"
                className="inline-flex items-center border-2 border-[#6db99f] text-[#6db99f] hover:bg-[#6db99f] hover:text-white px-8 py-4 rounded-lg font-outfit-semibold transition-all duration-300"
              >
                Create Profile
              </Link>
            </div>
          </ScrollAnimate>
        </div>
      </section>

      <Footer />
    </div>
  );
}



