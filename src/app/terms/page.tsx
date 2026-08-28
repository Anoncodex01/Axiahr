import { FileText, Shield, Users, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#114373] to-[#1e5a8a] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link 
            href="/" 
            className="inline-flex items-center text-white/90 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Terms and Conditions</h1>
              <p className="text-white/90">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 sm:p-12 space-y-8">
          
          {/* Introduction */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Shield className="w-6 h-6 text-[#114373]" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Introduction</h2>
                <p className="text-gray-700 leading-relaxed">
                  Welcome to Axia HR Advisory ("we," "our," or "us"). These Terms and Conditions ("Terms") govern your access to and use of our platform, services, and website. By accessing or using our services, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our services.
                </p>
              </div>
            </div>
          </section>

          {/* Acceptance */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Acceptance of Terms</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  By creating an account, accessing our platform, or using any of our services, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>You must be at least 18 years old to use our services</li>
                  <li>You must provide accurate and complete information</li>
                  <li>You are responsible for maintaining the confidentiality of your account</li>
                  <li>You agree to notify us immediately of any unauthorized use of your account</li>
                </ul>
              </div>
            </div>
          </section>

          {/* User Accounts */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">3. User Accounts</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>
                    <strong className="text-gray-900">Account Creation:</strong> To access certain features, you must create an account. You agree to provide accurate, current, and complete information during registration.
                  </p>
                  <p>
                    <strong className="text-gray-900">Account Security:</strong> You are responsible for maintaining the security of your account credentials. You must not share your password with third parties or use your account for any illegal purpose.
                  </p>
                  <p>
                    <strong className="text-gray-900">Account Termination:</strong> We reserve the right to suspend or terminate your account if you violate these Terms or engage in fraudulent, abusive, or illegal activity.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Services */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-100 rounded-xl">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Our Services</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>
                    Axia HR Advisory provides a platform connecting job seekers with employers. Our services include but are not limited to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Job posting and search functionality</li>
                    <li>Candidate profile management</li>
                    <li>Application processing</li>
                    <li>Recruitment and talent acquisition services</li>
                    <li>HR advisory and consulting services</li>
                  </ul>
                  <p className="mt-3">
                    We reserve the right to modify, suspend, or discontinue any aspect of our services at any time without prior notice.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* User Conduct */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">5. User Conduct</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  You agree not to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Use our services for any unlawful purpose or in violation of any laws</li>
                  <li>Impersonate any person or entity or falsely state your affiliation</li>
                  <li>Upload or transmit any viruses, malware, or harmful code</li>
                  <li>Interfere with or disrupt the integrity or performance of our services</li>
                  <li>Collect or harvest information about other users without their consent</li>
                  <li>Post false, misleading, or defamatory content</li>
                  <li>Violate any intellectual property rights</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Intellectual Property</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>
                    All content, features, and functionality of our platform, including but not limited to text, graphics, logos, and software, are owned by Axia HR Advisory and are protected by international copyright, trademark, and other intellectual property laws.
                  </p>
                  <p>
                    You retain ownership of any content you submit to our platform. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and distribute your content for the purpose of providing our services.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-yellow-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Limitation of Liability</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>
                    To the maximum extent permitted by law, Axia HR Advisory shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
                  </p>
                  <p>
                    Our total liability for any claims arising from or related to your use of our services shall not exceed the amount you paid to us in the twelve (12) months preceding the claim.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-teal-100 rounded-xl">
                <FileText className="w-6 h-6 text-teal-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">8. Changes to Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the updated Terms on our website and updating the "Last updated" date. Your continued use of our services after such changes constitutes your acceptance of the new Terms.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="space-y-4 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Shield className="w-6 h-6 text-[#114373]" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">9. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you have any questions about these Terms and Conditions, please contact us:
                </p>
                <div className="bg-gray-50 rounded-2xl p-6 space-y-2">
                  <p className="text-gray-900 font-semibold">Axia HR Advisory</p>
                  <p className="text-gray-700">Email: <a href="mailto:info@axiahr.com" className="text-[#114373] hover:underline">info@axiahr.com</a></p>
                  <p className="text-gray-700">Phone: <a href="tel:+255123456789" className="text-[#114373] hover:underline">+255 123 456 789</a></p>
                  <Link href="/contact" className="inline-block mt-4 text-[#114373] hover:text-[#0d3559] font-medium transition-colors">
                    Visit our Contact Page →
                  </Link>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

