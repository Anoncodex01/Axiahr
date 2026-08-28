import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollAnimate from "@/components/ScrollAnimate";
import { ArrowRight, Mail, Phone, MapPin, Send } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-[#114373] to-[#1a3658] relative overflow-hidden">
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up">
              <p className="text-[#6db99f] text-sm font-outfit-semibold uppercase tracking-wide mb-4">
                GET IN TOUCH
              </p>
            </ScrollAnimate>
            
            <ScrollAnimate delay="0.4s" animationClass="animate-fade-in-up">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-outfit-bold text-white mb-6 leading-tight">
                Contact Us
              </h1>
            </ScrollAnimate>
            
            <ScrollAnimate delay="0.5s" animationClass="animate-fade-in-up">
              <p className="text-xl text-white/90 leading-relaxed font-outfit-regular">
                Let's discuss how we can help your organization achieve its HR goals.
              </p>
            </ScrollAnimate>
          </div>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <ScrollAnimate delay="0.2s" animationClass="animate-fade-in-up">
              <div>
                <h2 className="text-3xl font-outfit-bold text-gray-900 mb-6">Send us a Message</h2>
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-outfit-semibold text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6db99f] focus:border-transparent font-outfit-regular"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-outfit-semibold text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6db99f] focus:border-transparent font-outfit-regular"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-outfit-semibold text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6db99f] focus:border-transparent font-outfit-regular"
                      placeholder="+255 XXX XXX XXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-outfit-semibold text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6db99f] focus:border-transparent font-outfit-regular"
                      placeholder="Tell us how we can help..."
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#6db99f] hover:bg-[#5aa88a] text-white px-8 py-4 rounded-lg font-outfit-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
                  >
                    Send Message
                    <Send className="w-5 h-5 ml-2" />
                  </button>
                </form>
              </div>
            </ScrollAnimate>

            {/* Contact Information */}
            <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up">
              <div>
                <h2 className="text-3xl font-outfit-bold text-gray-900 mb-6">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-[#6db99f]/10 rounded-lg flex items-center justify-center">
                        <Phone className="w-6 h-6 text-[#6db99f]" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-outfit-bold text-gray-900 mb-1">Phone</h3>
                      <a href="tel:+255786443003" className="text-gray-700 hover:text-[#6db99f] transition-colors font-outfit-regular">
                        +255 786 443 003
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-[#6db99f]/10 rounded-lg flex items-center justify-center">
                        <Mail className="w-6 h-6 text-[#6db99f]" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-outfit-bold text-gray-900 mb-1">Email</h3>
                      <a href="mailto:career@axia.co.tz" className="text-gray-700 hover:text-[#6db99f] transition-colors font-outfit-regular">
                        career@axia.co.tz
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-[#6db99f]/10 rounded-lg flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-[#6db99f]" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-outfit-bold text-gray-900 mb-1">Website</h3>
                      <a href="https://www.axia.co.tz" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-[#6db99f] transition-colors font-outfit-regular">
                        www.axia.co.tz
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-white rounded-xl">
                  <h3 className="text-lg font-outfit-bold text-gray-900 mb-3">Business Hours</h3>
                  <div className="space-y-2 text-gray-700 font-outfit-regular">
                    <p>Monday - Friday: 8:00 AM - 5:00 PM</p>
                    <p>Saturday: 9:00 AM - 1:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </ScrollAnimate>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}



