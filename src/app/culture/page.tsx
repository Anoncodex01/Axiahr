import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollAnimate from "@/components/ScrollAnimate";
import { ArrowRight, Lightbulb, Users, TrendingUp, Heart } from "lucide-react";

export default function CulturePage() {
  const culturePillars = [
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "Embracing smarter ways of working"
    },
    {
      icon: Users,
      title: "Teamwork",
      description: "Collaborating to deliver exceptional results"
    },
    {
      icon: TrendingUp,
      title: "Growth",
      description: "Investing in learning and development"
    },
    {
      icon: Heart,
      title: "Integrity",
      description: "Building trust through honesty and fairness"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-[#114373] to-[#1a3658] relative overflow-hidden">
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up">
              <p className="text-[#6db99f] text-sm font-outfit-semibold uppercase tracking-wide mb-4">
                OUR CULTURE
              </p>
            </ScrollAnimate>
            
            <ScrollAnimate delay="0.4s" animationClass="animate-fade-in-up">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-outfit-bold text-white mb-6 leading-tight">
                Innovation, Teamwork & Growth
              </h1>
            </ScrollAnimate>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <ScrollAnimate delay="0.2s" animationClass="animate-fade-in-up">
            <div className="prose prose-lg max-w-none text-left">
              <p className="text-lg text-gray-700 leading-relaxed font-outfit-regular mb-6 text-justify">
                At Axia HR Advisory, we believe people are the foundation of success. We foster a collaborative, transparent, and growth-oriented workplace where ideas are valued, results are celebrated, and work-life balance is respected. By prioritizing our people, we boost morale, attract top talent, and drive organizational success.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed font-outfit-regular text-justify">
                We combine expertise with innovation to deliver tailored HR solutions in organizational design, strategic planning, job evaluation, salary surveys, workload analysis, and more. At Axia HR, it's not just about HR services — it's about building relationships, creating opportunities, and making a lasting impact.
              </p>
            </div>
          </ScrollAnimate>

          {/* Culture Pillars */}
          <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up">
            <h2 className="text-3xl font-outfit-bold text-gray-900 mb-8">Our Team Thrives On</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {culturePillars.map((pillar, index) => {
                const IconComponent = pillar.icon;
                return (
                  <ScrollAnimate 
                    key={index}
                    delay={`${0.4 + index * 0.1}s`} 
                    animationClass="animate-fade-in-up"
                  >
                    <div className="p-6 bg-white rounded-xl border border-[#6db99f]/20">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-[#6db99f]/10 rounded-lg flex items-center justify-center">
                            <IconComponent className="w-6 h-6 text-[#6db99f]" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xl font-outfit-bold text-gray-900 mb-2">{pillar.title}</h3>
                          <p className="text-gray-700 leading-relaxed font-outfit-regular">{pillar.description}</p>
                        </div>
                      </div>
                    </div>
                  </ScrollAnimate>
                );
              })}
            </div>
          </ScrollAnimate>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pt-0 pb-20 lg:pb-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <ScrollAnimate delay="0.2s" animationClass="animate-fade-in-up">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-outfit-bold text-gray-900 mb-6 leading-tight">
              Join Our Team
            </h2>
          </ScrollAnimate>
          
          <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up">
            <p className="text-lg text-gray-700 leading-relaxed font-outfit-regular mb-8 max-w-2xl mx-auto">
              Be part of a culture that values innovation, teamwork, and growth.
            </p>
          </ScrollAnimate>
          
          <ScrollAnimate delay="0.4s" animationClass="animate-fade-in-up">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/candidate/register"
                className="inline-flex items-center bg-[#6db99f] hover:bg-[#5aa88a] text-white px-8 py-4 rounded-lg font-outfit-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                View Open Positions
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center border-2 border-[#6db99f] text-[#6db99f] hover:bg-[#6db99f] hover:text-white px-8 py-4 rounded-lg font-outfit-semibold transition-all duration-300"
              >
                Contact Us
              </Link>
            </div>
          </ScrollAnimate>
        </div>
      </section>

      <Footer />
    </div>
  );
}



