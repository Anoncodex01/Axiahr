import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollAnimate from "@/components/ScrollAnimate";
import { ArrowRight, Target, Eye, Heart, Lightbulb, Shield, Rocket } from "lucide-react";

export default function VisionMissionPage() {
  const values = [
    {
      icon: Heart,
      title: "Customer-Centric",
      description: "Our clients' needs and goals are in the centre when creating HR solutions."
    },
    {
      icon: Lightbulb,
      title: "Revolutionary",
      description: "We strive to make a difference with our ground-breaking products and solutions. Innovation is our expertise, and experimentation drives our work and culture."
    },
    {
      icon: Shield,
      title: "Resilient",
      description: "We're determined not to quit or give up on our mission to reinvent how companies operate by providing them innovative solutions."
    },
    {
      icon: Heart,
      title: "Integrity",
      description: "We are the realest. Our work is honest. We engage with ethical individuals who share and trust in our vision."
    },
    {
      icon: Rocket,
      title: "Pioneers",
      description: "Our exploratory nature gives us an edge in the HR space to develop more effective and efficient solutions."
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
                OUR GUIDING PRINCIPLES
              </p>
            </ScrollAnimate>
            
            <ScrollAnimate delay="0.4s" animationClass="animate-fade-in-up">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-outfit-bold text-white mb-6 leading-tight">
                Vision, Mission & Values
              </h1>
            </ScrollAnimate>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <ScrollAnimate delay="0.2s" animationClass="animate-fade-in-up">
            <div className="flex items-start gap-4 mb-12">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-[#6db99f]/10 rounded-full flex items-center justify-center">
                  <Eye className="w-8 h-8 text-[#6db99f]" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-outfit-bold text-gray-900 mb-4">Our Vision</h2>
                <p className="text-xl text-gray-700 leading-relaxed font-outfit-regular">
                  Axia HR envisions itself as the first choice of companies for HR-related matters.
                </p>
              </div>
            </div>
          </ScrollAnimate>

          {/* Mission Section */}
          <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up">
            <div className="flex items-start gap-4 mb-12">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-[#6db99f]/10 rounded-full flex items-center justify-center">
                  <Target className="w-8 h-8 text-[#6db99f]" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-outfit-bold text-gray-900 mb-4">Our Mission</h2>
                <p className="text-xl text-gray-700 leading-relaxed font-outfit-regular">
                  To reinvent organizational operations by implementing scientific, and modern HR methodologies.
                </p>
              </div>
            </div>
          </ScrollAnimate>

          {/* Values Section */}
          <ScrollAnimate delay="0.4s" animationClass="animate-fade-in-up">
            <h2 className="text-3xl font-outfit-bold text-gray-900 mb-8">Our Core Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, index) => {
                const IconComponent = value.icon;
                return (
                  <ScrollAnimate 
                    key={index}
                    delay={`${0.5 + index * 0.1}s`} 
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
                          <h3 className="text-xl font-outfit-bold text-gray-900 mb-2">{value.title}</h3>
                          <p className="text-gray-700 leading-relaxed font-outfit-regular">{value.description}</p>
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
              Join Us on Our Mission
            </h2>
          </ScrollAnimate>
          
          <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up">
            <p className="text-lg text-gray-700 leading-relaxed font-outfit-regular mb-8 max-w-2xl mx-auto">
              Let's work together to transform your organization's HR operations.
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
                Explore Our Services
              </Link>
            </div>
          </ScrollAnimate>
        </div>
      </section>

      <Footer />
    </div>
  );
}



