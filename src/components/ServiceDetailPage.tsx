import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollAnimate from "@/components/ScrollAnimate";
import { ArrowRight, ChevronRight, Home, LucideIcon } from "lucide-react";
import Image from "next/image";

interface ServiceDetailPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  content: {
    overview?: string;
    services?: string[];
    benefits?: string[];
    approach?: string;
  };
  ctaText?: string;
  ctaLink?: string;
}

export default function ServiceDetailPage({
  title,
  description,
  icon: Icon,
  content,
  ctaText = "Get Started",
  ctaLink = "/contact"
}: ServiceDetailPageProps) {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-[#114373] to-[#1a3658] relative overflow-hidden">
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              {/* Modern Breadcrumb - Replacing Icon */}
              <ScrollAnimate delay="0.2s" animationClass="animate-fade-in-up">
                <nav className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 mb-6">
                  <Link
                    href="/"
                    className="flex items-center text-white/80 hover:text-white transition-colors"
                    aria-label="Home"
                  >
                    <Home className="w-4 h-4" />
                  </Link>
                  <ChevronRight className="w-4 h-4 text-white/60" />
                  <Link
                    href="/solutions"
                    className="text-white/80 hover:text-white transition-colors text-sm font-outfit-medium"
                  >
                    Services
                  </Link>
                  <ChevronRight className="w-4 h-4 text-white/60" />
                  <span className="text-white text-sm font-outfit-semibold">
                    {title.split(' ').slice(0, 2).join(' ')}
                  </span>
                </nav>
              </ScrollAnimate>
              
              <ScrollAnimate delay="0.4s" animationClass="animate-fade-in-up">
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-outfit-bold text-white mb-6 leading-tight">
                  {title}
                </h1>
              </ScrollAnimate>
              
              <ScrollAnimate delay="0.5s" animationClass="animate-fade-in-up">
                <p className="text-xl text-white/90 leading-relaxed font-outfit-regular mb-8">
                  {description}
                </p>
              </ScrollAnimate>
            </div>

            <div className="hidden lg:block">
              <ScrollAnimate delay="0.4s" animationClass="animate-fade-in-up">
                <div className="relative">
                  {/* Image Container */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#6db99f]/20 rounded-3xl transform rotate-3"></div>
                    <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/20">
                      <Image
                        src="/Business-professionals-shaking-hands-during-a-meeting-in-a-modern-office-with-laptop-and-documents-portrait.jpg"
                        alt="Professional business meeting"
                        width={600}
                        height={400}
                        className="w-full h-full object-cover rounded-3xl"
                      />
                    </div>
                  </div>
                </div>
              </ScrollAnimate>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          {content.overview && (
            <ScrollAnimate delay="0.2s" animationClass="animate-fade-in-up" className="mb-12">
              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-gray-700 leading-relaxed font-outfit-regular">
                  {content.overview}
                </p>
              </div>
            </ScrollAnimate>
          )}

          {content.services && content.services.length > 0 && (
            <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up" className="mb-12">
              <h2 className="text-3xl font-outfit-bold text-gray-900 mb-6">
                Our Services Include:
              </h2>
              <ul className="space-y-4">
                {content.services.map((service, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-[#6db99f] rounded-full flex items-center justify-center mt-1">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-gray-700 leading-relaxed font-outfit-regular text-lg">
                      {service}
                    </span>
                  </li>
                ))}
              </ul>
            </ScrollAnimate>
          )}

          {content.approach && (
            <ScrollAnimate delay="0.4s" animationClass="animate-fade-in-up" className="mb-12">
              <h2 className="text-3xl font-outfit-bold text-gray-900 mb-6">
                Our Approach
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed font-outfit-regular">
                {content.approach}
              </p>
            </ScrollAnimate>
          )}

          {content.benefits && content.benefits.length > 0 && (
            <ScrollAnimate delay="0.5s" animationClass="animate-fade-in-up">
              <h2 className="text-3xl font-outfit-bold text-gray-900 mb-6">
                Benefits
              </h2>
              <ul className="space-y-4">
                {content.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-[#6db99f] rounded-full flex items-center justify-center mt-1">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-gray-700 leading-relaxed font-outfit-regular text-lg">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </ScrollAnimate>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ScrollAnimate delay="0.2s" animationClass="animate-fade-in-up">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-outfit-bold text-gray-900 mb-6 leading-tight">
              Ready to Get Started?
            </h2>
          </ScrollAnimate>
          
          <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up">
            <p className="text-lg text-gray-700 leading-relaxed font-outfit-regular mb-8 max-w-2xl mx-auto">
              Let's discuss how {title} can help your organization achieve its goals.
            </p>
          </ScrollAnimate>
          
          <ScrollAnimate delay="0.4s" animationClass="animate-fade-in-up">
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={ctaLink}
                className="inline-flex items-center bg-[#6db99f] hover:bg-[#5aa88a] text-white px-8 py-4 rounded-lg font-outfit-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                {ctaText}
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

