import Link from "next/link";
import { Facebook, Linkedin, Instagram, Send, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const quickLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Our Solutions', href: '/solutions' },
    { name: 'Vision & Mission', href: '/vision-mission' },
    { name: 'Contact Us', href: '/contact' },
  ];

  const services = [
    { name: 'Talent Acquisition', href: '/services/talent-acquisition' },
    { name: 'Training & Development', href: '/services/training-development' },
    { name: 'Performance Management', href: '/services/performance-management' },
    { name: 'Organizational Design', href: '/services/organizational-design' },
  ];

  const socialLinks = [
    { name: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/axia_tz/?hl=en' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com/company/axia-hr-tz/posts/?feedView=all' },
    { name: 'Facebook', icon: Facebook, href: 'https://www.facebook.com/share/1EryTYPqhG/' },
  ];

  return (
    <footer className="bg-[#114373] text-white relative overflow-hidden">
      {/* Subtle dot pattern background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
                <span className="text-[#114373] font-bold text-lg">A</span>
              </div>
              <div>
                <div className="text-white font-bold text-lg">Axia HR Advisory</div>
                <div className="text-white/70 text-sm">HR Solutions | Advisory | Management</div>
              </div>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              Providing comprehensive HR solutions that drive business success and employee satisfaction across Tanzania.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Phone className="w-4 h-4" />
                <a href="tel:+255786443003" className="hover:text-[#4ebf9e] transition-colors">
                  +255 786 443 003
                </a>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Mail className="w-4 h-4" />
                <a href="mailto:career@axia.co.tz" className="hover:text-[#4ebf9e] transition-colors">
                  career@axia.co.tz
                </a>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <MapPin className="w-4 h-4" />
                <a href="https://www.axia.co.tz" target="_blank" rel="noopener noreferrer" className="hover:text-[#4ebf9e] transition-colors">
                  www.axia.co.tz
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-white/80 hover:text-[#4ebf9e] transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Our Services</h3>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service.name}>
                  <Link 
                    href={service.href}
                    className="text-white/80 hover:text-[#4ebf9e] transition-colors text-sm"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media & Newsletter */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Connect With Us</h3>
            <div className="flex gap-3 mb-4">
              {socialLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.name}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </a>
                );
              })}
            </div>
            
            <p className="text-white/70 text-sm mb-2">
              Follow us for the latest HR insights and updates.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 my-8" />

        {/* Bottom Section - Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/70 text-sm">
            © 2025 Axia HR Advisory. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-white/70 hover:text-[#4ebf9e] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-white/70 hover:text-[#4ebf9e] transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
