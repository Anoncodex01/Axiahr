'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingImage from "@/components/FloatingImage";
import LogoCarousel from "@/components/LogoCarousel";
import { PARTNER_COMPANY_LOGOS } from "@/data/companyLogos";
import ScrollAnimate from "@/components/ScrollAnimate";
import { 
  ArrowRight, 
  Target, 
  TrendingUp, 
  Shield, 
  Users, 
  Star,
  Building2,
  GraduationCap,
  Calculator,
  UserCheck,
  Calendar,
  Globe,
  Briefcase,
  Search,
  CheckCircle,
  Trophy,
  Linkedin,
  Mail,
  Phone as PhoneIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  DollarSign,
  Clock,
  Play
} from "lucide-react";

export default function Home() {
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  useEffect(() => {
    // Fetch recent jobs with pagination
    const fetchRecentJobs = async () => {
      try {
        setLoadingJobs(true);
        const response = await fetch(`/api/jobs?limit=9&page=${currentPage}`);
        const data = await response.json();
        if (data.success && data.jobs) {
          setRecentJobs(data.jobs);
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages || 1);
            setTotalJobs(data.pagination.total || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching recent jobs:', error);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchRecentJobs();
  }, [currentPage]);

  const formatSalary = (salary: any) => {
    if (!salary || (!salary.min && !salary.max)) return 'Not specified';
    const currency = salary.currency || 'TZS';
    if (salary.min && salary.max) {
      return `${formatNumber(salary.min)} - ${formatNumber(salary.max)} ${currency}`;
    }
    return `${formatNumber(salary.min || salary.max)} ${currency}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <main className="relative min-h-screen overflow-visible bg-[#114373]">
        <div className="grid grid-cols-1 lg:grid-cols-[47%_53%] min-h-screen">
          {/* Left Column - Dark Background with Content */}
          <div className="bg-[#114373] relative overflow-visible flex">
            <div className="relative z-10 w-full flex flex-col justify-center items-end lg:items-end px-6 lg:px-8 xl:px-12 pt-20 lg:pt-24 pb-8 lg:pb-12">
              <div className="w-full max-w-2xl lg:max-w-[90%] xl:max-w-[85%]">
                {/* Modern Badge/Tag */}
                <ScrollAnimate delay="0.2s" animationClass="animate-fade-in-up" className="mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#6db99f]/20 backdrop-blur-sm border border-[#6db99f]/30 rounded-full">
                    <div className="w-2 h-2 bg-[#6db99f] rounded-full animate-pulse"></div>
                    <span className="text-[#6db99f] text-sm font-outfit-semibold uppercase tracking-wide">
                      Trusted HR Partner
                  </span>
                  </div>
                </ScrollAnimate>

                {/* Main Headline - Modern Typography */}
                <ScrollAnimate delay="0.4s" animationClass="animate-fade-in-up" className="mb-6">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-outfit-bold leading-[1.1] text-white mb-4">
                    <span className="block mb-2">Transforming</span>
                    <span className="block text-[#6db99f]">People.</span>
                    <span className="block mt-2">Driving Business</span>
                    <span className="block text-[#6db99f]">Success.</span>
                  </h1>
                </ScrollAnimate>

                {/* Description - Enhanced */}
                <ScrollAnimate delay="0.6s" animationClass="animate-fade-in-up" className="mb-8">
                  <p className="text-lg sm:text-xl lg:text-2xl text-white/90 leading-relaxed max-w-2xl font-outfit-regular">
                    Comprehensive HR solutions for modern organizations in Tanzania and beyond.
                  </p>
                </ScrollAnimate>

                {/* CTA Button - Modern Design */}
                <ScrollAnimate delay="0.8s" animationClass="animate-fade-in-up">
                  <Link 
                    href="/contact"
                    className="group relative inline-flex items-center justify-center sm:justify-start gap-2 bg-[#6db99f] hover:bg-[#5aa88a] text-white px-8 py-4 rounded-xl font-outfit-semibold text-base transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 overflow-hidden"
                  >
                    <span className="relative z-10">
                      Enquire Now
                    </span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#5aa88a] to-[#6db99f] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </Link>
                </ScrollAnimate>
              </div>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative bg-[#114373] flex min-h-[400px] lg:min-h-0 overflow-visible">
            <div className="w-full h-full flex items-start lg:items-center justify-center p-4 sm:p-6 lg:p-8 pt-12 sm:pt-16 lg:pt-20 overflow-visible">
              <figure className="relative w-full max-w-[85%] lg:max-w-[70%] rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center mb-0 lg:-mb-48 z-20">
                <img 
                  src="/Business-professionals-shaking-hands-during-a-meeting-in-a-modern-office-with-laptop-and-documents-portrait.jpg" 
                  alt="Business professionals shaking hands during a meeting in a modern office"
                  className="w-full h-auto min-h-[400px] lg:min-h-[550px] object-cover object-center aspect-[3/4] lg:aspect-[3/4]"
                  style={{ boxShadow: 'var(--wp--preset--shadow--default, 0 10px 40px rgba(0, 0, 0, 0.2))' }}
                />
              </figure>
            </div>
          </div>
        </div>
      </main>

      {/* Trusted By Section */}
      <section 
        className="py-12 lg:py-20 relative overflow-visible pt-24 lg:pt-32"
        style={{
          background: 'linear-gradient(to bottom, rgba(109, 185, 159, 0.10) 0%, rgba(109, 185, 159, 0.085) 50%, rgba(109, 185, 159, 0.065) 75%, rgba(109, 185, 159, 0.040) 100%)'
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <p className="text-[#6db99f] text-sm font-outfit-semibold uppercase tracking-wide mb-8">
              TRUSTED BY LEADING BUSINESSES WORLDWIDE
            </p>
            <LogoCarousel logos={PARTNER_COMPANY_LOGOS} />
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section 
        className="py-20 lg:py-32 relative overflow-visible pt-32 lg:pt-40 bg-white"
      >
        {/* Left Side Gradient */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-[30%] lg:w-[25%] opacity-60"
          style={{
            background: 'linear-gradient(to right, rgba(109, 185, 159, 0.15) 0%, rgba(109, 185, 159, 0.08) 50%, transparent 100%)'
          }}
        ></div>
        
        {/* Right Side Gradient */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-[30%] lg:w-[25%] opacity-60"
          style={{
            background: 'linear-gradient(to left, rgba(109, 185, 159, 0.15) 0%, rgba(109, 185, 159, 0.08) 50%, transparent 100%)'
          }}
        ></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - About Us Content */}
            <div>
              <ScrollAnimate delay="0.2s" animationClass="animate-fade-in-left" className="flex items-start gap-3 mb-6">
                <ScrollAnimate delay="0.3s" animationClass="animate-grow-vertical">
                  <div className="w-1 h-12 bg-[#6db99f] rounded-full flex-shrink-0"></div>
                </ScrollAnimate>
                <div>
                  <ScrollAnimate delay="0.4s" animationClass="animate-fade-in-up">
                    <h3 className="text-[#6db99f] text-sm font-outfit-bold uppercase tracking-wide mb-6">
                      ABOUT US
                    </h3>
                  </ScrollAnimate>
                  
                  <ScrollAnimate delay="0.5s" animationClass="animate-fade-in-up">
                    <h2 className="text-3xl lg:text-4xl xl:text-5xl font-outfit-bold text-gray-800 mb-6 leading-tight">
                      About Axia HR Advisory
                    </h2>
                  </ScrollAnimate>
                </div>
              </ScrollAnimate>
              
              <ScrollAnimate delay="0.6s" animationClass="animate-fade-in-up" className="mb-8">
                <p className="text-base lg:text-lg text-gray-700 leading-relaxed font-outfit-regular mb-6">
                  At Axia HR Advisory, we help organizations optimize their workforce, enhance performance, and achieve strategic growth. Established in 2022 as a segment of RM Financial Consulting Limited, we bring expertise, innovation, and an agile approach to every client engagement across industries.
                </p>
                <p className="text-base lg:text-lg text-gray-700 leading-relaxed font-outfit-regular">
                  We see where the world of work is evolving. Recruitment remains our core strength, where we connect organizations with exceptional talent who shape culture, performance, and long-term success. Beyond this, Axia HR Advisory partners with businesses at a strategic level, strengthening their people frameworks through thoughtful advisory, structured organizational design, performance alignment, workforce optimization, and compliance-driven HR practices.
                </p>
              </ScrollAnimate>
              
              <ScrollAnimate delay="0.7s" animationClass="animate-fade-in-up">
                <Link 
                  href="/about"
                  className="inline-flex items-center bg-[#6db99f] hover:bg-[#5aa88a] text-white px-8 py-4 rounded-lg font-outfit-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Learn more
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </ScrollAnimate>
            </div>

            {/* Right Column - Floating Image */}
            <div className="relative min-h-[500px] lg:min-h-[600px]">
              {/* Central Image */}
              <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up" className="relative z-10">
                <FloatingImage />
              </ScrollAnimate>
            </div>
          </div>
        </div>
      </section>

      {/* Our Global Services Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <ScrollAnimate delay="0.2s" animationClass="animate-fade-in-up">
              <p className="text-[#6db99f] text-sm font-outfit-bold uppercase tracking-wide mb-6">
                OUR SERVICES
              </p>
            </ScrollAnimate>
            <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up">
              <h2 className="text-3xl lg:text-4xl xl:text-5xl font-outfit-bold text-gray-900 mb-6 leading-tight">
                Comprehensive HR Solutions<br />Tailored to Your Needs
              </h2>
            </ScrollAnimate>
            <ScrollAnimate delay="0.4s" animationClass="animate-fade-in-up">
              <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed font-outfit-regular mb-8">
                At Axia HR Advisory, we provide comprehensive, end-to-end HR solutions tailored to meet your organization's unique needs.
              </p>
            </ScrollAnimate>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Employee Recruitment, Selection & Retention */}
            <ScrollAnimate delay="0.5s" animationClass="animate-fade-in-up" className="relative">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-2 border-[#6db99f]">
                    <UserCheck className="w-8 h-8 text-gray-700" />
                  </div>
                </div>
                <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-[#6db99f]"></div>
                <div className="flex-1 pt-2">
                  <h3 className="text-xl font-outfit-bold text-gray-900 mb-4">
                    Employee Recruitment, Selection & Retention
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-6 font-outfit-regular">
                    We connect companies with top talent and help job seekers find, grow, and retain meaningful careers—quickly, professionally, and with trust.
                  </p>
                  <Link
                    href="/services/recruitment-retention"
                    className="inline-flex items-center text-gray-900 font-outfit-semibold hover:text-[#6db99f] transition-colors duration-300 group"
                  >
                    Read more
                    <ArrowRight className="w-4 h-4 ml-2 text-[#6db99f] group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </div>
              </div>
            </ScrollAnimate>

            {/* HR Advisory & Strategy */}
            <ScrollAnimate delay="0.6s" animationClass="animate-fade-in-up" className="relative">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-2 border-[#6db99f]">
                    <Target className="w-8 h-8 text-gray-700" />
                  </div>
                </div>
                <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-[#6db99f]"></div>
                <div className="flex-1 pt-2">
                  <h3 className="text-xl font-outfit-bold text-gray-900 mb-4">
                    HR Advisory & Strategy
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-6 font-outfit-regular">
                    Expert guidance on organizational development and workforce optimization.
                  </p>
                  <Link
                    href="/services/hr-advisory"
                    className="inline-flex items-center text-gray-900 font-outfit-semibold hover:text-[#6db99f] transition-colors duration-300 group"
                  >
                    Read more
                    <ArrowRight className="w-4 h-4 ml-2 text-[#6db99f] group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </div>
              </div>
            </ScrollAnimate>

            {/* Organizational Structuring & Restructuring */}
            <ScrollAnimate delay="0.7s" animationClass="animate-fade-in-up" className="relative">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-2 border-[#6db99f]">
                    <Building2 className="w-8 h-8 text-gray-700" />
                  </div>
                </div>
                <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-[#6db99f]"></div>
                <div className="flex-1 pt-2">
                  <h3 className="text-xl font-outfit-bold text-gray-900 mb-4">
                    Organizational Structuring & Restructuring
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-6 font-outfit-regular">
                    Design and realign teams for maximum efficiency and performance.
                  </p>
                  <Link
                    href="/services/organizational-design"
                    className="inline-flex items-center text-gray-900 font-outfit-semibold hover:text-[#6db99f] transition-colors duration-300 group"
                  >
                    Read more
                    <ArrowRight className="w-4 h-4 ml-2 text-[#6db99f] group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </div>
              </div>
            </ScrollAnimate>

            {/* Job Description, Job Evaluation, Salary Survey & Workload Analysis */}
            <ScrollAnimate delay="0.8s" animationClass="animate-fade-in-up" className="relative">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-2 border-[#6db99f]">
                    <Calculator className="w-8 h-8 text-gray-700" />
                  </div>
                </div>
                <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-[#6db99f]"></div>
                <div className="flex-1 pt-2">
                  <h3 className="text-xl font-outfit-bold text-gray-900 mb-4">
                    Job Description, Job Evaluation, Salary Survey & Workload Analysis
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-6 font-outfit-regular">
                    Ensure clarity, fairness, and competitive compensation.
                  </p>
                  <Link
                    href="/services/job-analysis"
                    className="inline-flex items-center text-gray-900 font-outfit-semibold hover:text-[#6db99f] transition-colors duration-300 group"
                  >
                    Read more
                    <ArrowRight className="w-4 h-4 ml-2 text-[#6db99f] group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </div>
              </div>
            </ScrollAnimate>

            {/* Training & Development */}
            <ScrollAnimate delay="0.9s" animationClass="animate-fade-in-up" className="relative">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-2 border-[#6db99f]">
                    <GraduationCap className="w-8 h-8 text-gray-700" />
                  </div>
                </div>
                <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-[#6db99f]"></div>
                <div className="flex-1 pt-2">
                  <h3 className="text-xl font-outfit-bold text-gray-900 mb-4">
                    Training & Development
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-6 font-outfit-regular">
                    Upskill employees to enhance productivity and drive growth.
                  </p>
                  <Link
                    href="/services/training-development"
                    className="inline-flex items-center text-gray-900 font-outfit-semibold hover:text-[#6db99f] transition-colors duration-300 group"
                  >
                    Read more
                    <ArrowRight className="w-4 h-4 ml-2 text-[#6db99f] group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </div>
              </div>
            </ScrollAnimate>

            {/* Performance Management */}
            <ScrollAnimate delay="1s" animationClass="animate-fade-in-up" className="relative">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-2 border-[#6db99f]">
                    <TrendingUp className="w-8 h-8 text-gray-700" />
                  </div>
                </div>
                <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-[#6db99f]"></div>
                <div className="flex-1 pt-2">
                  <h3 className="text-xl font-outfit-bold text-gray-900 mb-4">
                    Performance Management
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-6 font-outfit-regular">
                    Align employee goals with business objectives for measurable results.
                  </p>
                  <Link
                    href="/services/performance-management"
                    className="inline-flex items-center text-gray-900 font-outfit-semibold hover:text-[#6db99f] transition-colors duration-300 group"
                  >
                    Read more
                    <ArrowRight className="w-4 h-4 ml-2 text-[#6db99f] group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </div>
              </div>
            </ScrollAnimate>
          </div>

          {/* Find out more button */}
          <div className="text-center mt-12">
            <ScrollAnimate delay="1.1s" animationClass="animate-fade-in-up">
              <Link
                href="/solutions"
                className="inline-flex items-center bg-[#6db99f] hover:bg-[#5aa88a] text-white px-8 py-4 rounded-lg font-outfit-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                View All Services
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </ScrollAnimate>
          </div>
        </div>
      </section>

      {/* Areas of Expertise Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
            {/* Left Column - Image */}
            <div className="relative order-2 lg:order-1">
              <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="/c957d12a2bfdf6c0c2dc6b4764bf4b4559bcccd7.jpg"
                    alt="Two professionals engaged in conversation in a modern office"
                    className="w-full h-auto object-cover min-h-[500px] lg:min-h-[600px]"
                  />
                </div>
              </ScrollAnimate>
            </div>

            {/* Right Column - Content */}
            <div className="order-1 lg:order-2">
              <ScrollAnimate delay="0.2s" animationClass="animate-fade-in-left" className="flex items-start gap-3 mb-6">
                <ScrollAnimate delay="0.25s" animationClass="animate-grow-vertical">
                  <div className="w-1 h-12 bg-[#6db99f] rounded-full flex-shrink-0"></div>
                </ScrollAnimate>
                <div>
                  <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up">
                    <p className="text-[#6db99f] text-sm font-outfit-bold uppercase tracking-wide mb-6">
                      AREAS OF EXPERTISE
                    </p>
                  </ScrollAnimate>
                  
                  <ScrollAnimate delay="0.4s" animationClass="animate-fade-in-up">
                    <h2 className="text-3xl lg:text-4xl xl:text-5xl font-outfit-bold text-gray-900 mb-6 leading-tight">
                      HR recruitment services across all specialisms and sectors
                    </h2>
                  </ScrollAnimate>
                </div>
              </ScrollAnimate>
              
              <ScrollAnimate delay="0.5s" animationClass="animate-fade-in-up" className="mb-8">
                <p className="text-lg text-gray-700 leading-relaxed font-outfit-regular">
                  Access top talent at every level, across all industries. Whether your company specialises in professional services, financial services, commerce and industry or public sector and non-profit, we will source the right professionals your business needs to thrive.
                </p>
              </ScrollAnimate>
              
              <ScrollAnimate delay="0.6s" animationClass="animate-fade-in-up">
                <Link
                  href="/job-search"
                  className="inline-flex items-center bg-[#6db99f] hover:bg-[#5aa88a] text-white px-8 py-4 rounded-lg font-outfit-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Explore more
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </ScrollAnimate>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Jobs Section */}
      <section className="pt-20 pb-12 lg:pt-32 lg:pb-16 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <ScrollAnimate delay="0.2s" animationClass="animate-fade-in-up">
              <p className="text-[#6db99f] text-sm font-outfit-bold uppercase tracking-wide mb-4">
                RECENT JOB OPPORTUNITIES
              </p>
            </ScrollAnimate>
            
            <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up">
              <h2 className="text-3xl lg:text-4xl xl:text-5xl font-outfit-bold text-gray-900 mb-6 leading-tight">
                Explore Latest Career Opportunities
              </h2>
            </ScrollAnimate>
            
            <ScrollAnimate delay="0.4s" animationClass="animate-fade-in-up">
              <p className="text-lg text-gray-700 leading-relaxed font-outfit-regular max-w-3xl mx-auto">
                Discover exciting job opportunities from leading companies across various industries.
              </p>
            </ScrollAnimate>
          </div>

          {/* Jobs Grid */}
          {loadingJobs ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-6"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              ))}
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-outfit-regular">No job opportunities available at the moment.</p>
              <p className="text-gray-500 text-sm mt-2">Check back soon for new opportunities!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {recentJobs.map((job, index) => (
                <ScrollAnimate 
                  key={job.id} 
                  delay={`${0.5 + index * 0.1}s`} 
                  animationClass="animate-fade-in-up"
                >
                  <Link 
                    href={`/jobs/${job.id}`}
                    className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-[#6db99f] transition-all duration-300 group"
                  >
                    {/* Company Logo */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
                          {job.companyLogo ? (
                            <img 
                              src={job.companyLogo} 
                              alt={job.company || 'Company'} 
                              className="w-full h-full object-contain p-1" 
                            />
                          ) : (
                            <div className="w-full h-full bg-[#114373] flex items-center justify-center">
                              <span className="text-white font-bold text-lg">
                                {(job.company || 'A').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-outfit-bold text-gray-900 mb-1 group-hover:text-[#6db99f] transition-colors line-clamp-2">
                          {job.title}
                        </h3>
                        <p className="text-[#114373] font-outfit-semibold text-sm mb-2">
                          {job.company || 'Company'}
                        </p>
                      </div>
                    </div>

                    {/* Job Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-[#6db99f] flex-shrink-0" />
                        <span className="truncate">{job.location || 'Location not specified'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="w-4 h-4 text-[#6db99f] flex-shrink-0" />
                        <span>{formatSalary(job.salary)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-[#6db99f] flex-shrink-0" />
                        <span>{job.postedDate ? getTimeAgo(job.postedDate) : 'Recently'}</span>
                      </div>
                      
                      {job.jobType && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Briefcase className="w-4 h-4 text-[#6db99f] flex-shrink-0" />
                          <span className="capitalize">{job.jobType.replace('-', ' ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Description Preview */}
                    {job.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {job.description.replace(/<[^>]*>/g, '').substring(0, 120)}...
                      </p>
                    )}

                    {/* Skills Tags */}
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.skills.slice(0, 3).map((skill: string, idx: number) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 bg-[#6db99f]/10 text-[#6db99f] text-xs font-outfit-medium rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-outfit-medium rounded-full">
                            +{job.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* View Job Link */}
                    <div className="flex items-center text-[#6db99f] font-outfit-semibold text-sm group-hover:gap-2 transition-all">
                      <span>View Details</span>
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </ScrollAnimate>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {recentJobs.length > 0 && totalPages > 1 && (
            <div className="flex flex-col items-center gap-4 mt-8">
              {/* Page Info */}
              <div className="text-sm text-gray-600 font-outfit-medium">
                Showing {((currentPage - 1) * 9) + 1} - {Math.min(currentPage * 9, totalJobs)} of {totalJobs} jobs
              </div>
              
              {/* Pagination Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-outfit-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-outfit-semibold transition-all ${
                          currentPage === pageNum
                            ? 'bg-[#6db99f] text-white shadow-lg'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-outfit-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* View All Jobs Button */}
          {recentJobs.length > 0 && (
            <div className="text-center mt-6">
              <ScrollAnimate delay="1.1s" animationClass="animate-fade-in-up">
                <Link
                  href="/job-search"
                  className="inline-flex items-center bg-[#6db99f] hover:bg-[#5aa88a] text-white px-8 py-4 rounded-lg font-outfit-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  View All Jobs
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </ScrollAnimate>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative pt-24 pb-12 lg:pt-32 lg:pb-16 overflow-hidden">
        {/* Content Box with Background */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-[#0a2d4d] via-[#114373] to-[#0a2d4d] rounded-3xl p-8 lg:p-12 shadow-2xl text-center overflow-hidden">
            {/* Subtle Glow Effect - Top Right */}
            <div 
              className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-3xl -mr-[200px] -mt-[200px]"
              style={{
                background: 'radial-gradient(circle, rgba(109, 185, 159, 0.2) 0%, rgba(109, 185, 159, 0.1) 50%, transparent 100%)'
              }}
            ></div>
            
            {/* Subtle Glow Effect - Bottom Left (darker) */}
            <div 
              className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full blur-3xl -ml-[175px] -mb-[175px]"
              style={{
                background: 'radial-gradient(circle, rgba(17, 67, 115, 0.3) 0%, rgba(10, 45, 77, 0.2) 50%, transparent 100%)'
              }}
            ></div>
            
            {/* Fine Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)',
              backgroundSize: '20px 20px'
            }}></div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Main Headline */}
      <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-outfit-bold text-white mb-6 leading-tight">
          Realize Your Potential
        </h2>
      </ScrollAnimate>

              {/* Sub-headline */}
              <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up">
        <p className="text-xl text-white/90 leading-relaxed mb-10 font-outfit-regular max-w-xl mx-auto">
          Take control of your business growth with strategic HR solutions.
        </p>
      </ScrollAnimate>

              {/* CTA Buttons */}
              <ScrollAnimate delay="0.4s" animationClass="animate-fade-in-up">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/contact"
            className="group inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-[#114373] 
                      px-8 py-4 rounded-xl font-outfit-semibold text-lg transition-all duration-300 
                      shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/about"
            className="group inline-flex items-center gap-2 bg-[#114373] hover:bg-[#0d3559] 
                      border border-white/20 hover:border-white/30 text-white 
                      px-8 py-4 rounded-xl font-outfit-semibold text-lg transition-all duration-300 
                      shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            <Play className="w-5 h-5" />
            <span>Learn More</span>
          </Link>
        </div>
      </ScrollAnimate>
            </div>
          </div>
        </div>
      </section>

      {/* Spacer between CTA and Footer */}
      <div className="h-12 lg:h-16 bg-white"></div>

      <Footer />
    </div>
  );
}