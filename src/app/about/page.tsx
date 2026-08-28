import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollAnimate from "@/components/ScrollAnimate";
import { ArrowRight, Globe, Award, Briefcase } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-[#114373] to-[#1a3658] relative overflow-hidden">
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up">
              <p className="text-[#6db99f] text-sm font-outfit-semibold uppercase tracking-wide mb-4">
                ABOUT US
              </p>
            </ScrollAnimate>
            
            <ScrollAnimate delay="0.4s" animationClass="animate-fade-in-up">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-outfit-bold text-white mb-6 leading-tight">
                About Axia HR Advisory
              </h1>
            </ScrollAnimate>
            
            <ScrollAnimate delay="0.5s" animationClass="animate-fade-in-up">
              <p className="text-xl text-white/90 leading-relaxed font-outfit-regular">
                We help organizations optimize their workforce, enhance performance, and achieve strategic growth.
              </p>
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
                At Axia HR Advisory, we help organizations optimize their workforce, enhance performance, and achieve strategic growth. Established in 2022 as a segment of RM Financial Consulting Limited, we bring expertise, innovation, and an agile approach to every client engagement across industries.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed font-outfit-regular text-justify">
                We see where the world of work is evolving. Recruitment remains our core strength, where we connect organizations with exceptional talent who shape culture, performance, and long-term success. Beyond this, Axia HR Advisory partners with businesses at a strategic level, strengthening their people frameworks through thoughtful advisory, structured organizational design, performance alignment, workforce optimization, and compliance-driven HR practices. Our holistic approach ensures that while the right people are brought on board, the systems, structures, and strategies around them are equally robust — enabling sustainable growth and a resilient workforce.
              </p>
            </div>
          </ScrollAnimate>

          {/* Expertise Section */}
          <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up" className="mt-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 bg-[#6db99f]/10 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-7 h-7 text-[#6db99f]" />
                </div>
                <div className="flex-1">
                  <p className="text-xl font-outfit-semibold text-gray-900 leading-tight">
                    Expertise in all segments
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 bg-[#6db99f]/10 rounded-lg flex items-center justify-center">
                  <Globe className="w-7 h-7 text-[#6db99f]" />
                </div>
                <div className="flex-1">
                  <p className="text-xl font-outfit-semibold text-gray-900 leading-tight">
                    National & International Reach
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 bg-[#6db99f]/10 rounded-lg flex items-center justify-center">
                  <Award className="w-7 h-7 text-[#6db99f]" />
                </div>
                <div className="flex-1">
                  <p className="text-xl font-outfit-semibold text-gray-900 leading-tight">
                    Trusted by over 30 <span className="whitespace-nowrap">leading organizations</span>
                  </p>
                </div>
              </div>
            </div>
          </ScrollAnimate>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pt-0 pb-20 lg:pb-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <ScrollAnimate delay="0.2s" animationClass="animate-fade-in-up">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-outfit-bold text-gray-900 mb-6 leading-tight">
              Ready to Work With Us?
            </h2>
          </ScrollAnimate>
          
          <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up">
            <p className="text-lg text-gray-700 leading-relaxed font-outfit-regular mb-8 max-w-2xl mx-auto">
              Let's discuss how we can help your organization achieve its HR goals.
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
                href="/solutions"
                className="inline-flex items-center border-2 border-[#6db99f] text-[#6db99f] hover:bg-[#6db99f] hover:text-white px-8 py-4 rounded-lg font-outfit-semibold transition-all duration-300"
              >
                View Our Services
              </Link>
            </div>
          </ScrollAnimate>
        </div>
      </section>

      <Footer />
    </div>
  );
}



