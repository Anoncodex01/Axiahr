import { Shield, Lock, Eye, Database, UserCheck, FileText, ArrowLeft, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
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
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
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
                  At Axia HR Advisory ("we," "our," or "us"), we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.
                </p>
                <p className="text-gray-700 leading-relaxed mt-3">
                  By using our services, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use our services.
                </p>
              </div>
            </div>
          </section>

          {/* Information We Collect */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 rounded-xl">
                <Database className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">2.1 Personal Information</h3>
                    <p className="text-gray-700 leading-relaxed mb-2">
                      We collect information that you provide directly to us, including:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Name, email address, phone number, and contact information</li>
                      <li>Resume, CV, work history, and educational background</li>
                      <li>Skills, certifications, and professional qualifications</li>
                      <li>Job preferences and career objectives</li>
                      <li>Payment information (processed securely through third-party providers)</li>
                      <li>Profile photos and other documents you upload</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">2.2 Automatically Collected Information</h3>
                    <p className="text-gray-700 leading-relaxed mb-2">
                      When you use our services, we automatically collect certain information:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Device information (IP address, browser type, operating system)</li>
                      <li>Usage data (pages visited, time spent, features used)</li>
                      <li>Cookies and similar tracking technologies</li>
                      <li>Location data (if you enable location services)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We use the information we collect for the following purposes:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>To provide, maintain, and improve our services</li>
                  <li>To match candidates with job opportunities</li>
                  <li>To process job applications and facilitate recruitment</li>
                  <li>To communicate with you about your account, applications, and our services</li>
                  <li>To send you job alerts, newsletters, and promotional materials (with your consent)</li>
                  <li>To detect, prevent, and address technical issues and security threats</li>
                  <li>To comply with legal obligations and enforce our Terms of Service</li>
                  <li>To analyze usage patterns and improve user experience</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Information Sharing */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-100 rounded-xl">
                <UserCheck className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Information Sharing and Disclosure</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>
                    We do not sell your personal information. We may share your information in the following circumstances:
                  </p>
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                    <p><strong className="text-gray-900">With Employers:</strong> When you apply for a job, we share your profile and application information with the relevant employer.</p>
                    <p><strong className="text-gray-900">Service Providers:</strong> We may share information with third-party service providers who perform services on our behalf (e.g., hosting, analytics, payment processing).</p>
                    <p><strong className="text-gray-900">Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety.</p>
                    <p><strong className="text-gray-900">Business Transfers:</strong> In the event of a merger, acquisition, or sale, your information may be transferred to the new entity.</p>
                    <p><strong className="text-gray-900">With Your Consent:</strong> We may share information with your explicit consent for specific purposes.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-100 rounded-xl">
                <Lock className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Data Security</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>
                    We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Encryption of data in transit and at rest</li>
                    <li>Regular security assessments and updates</li>
                    <li>Access controls and authentication mechanisms</li>
                    <li>Secure data storage and backup procedures</li>
                    <li>Employee training on data protection</li>
                  </ul>
                  <p className="mt-3">
                    However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <UserCheck className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Your Rights and Choices</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong className="text-gray-900">Access:</strong> Request access to your personal information</li>
                  <li><strong className="text-gray-900">Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong className="text-gray-900">Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong className="text-gray-900">Portability:</strong> Request a copy of your data in a portable format</li>
                  <li><strong className="text-gray-900">Opt-out:</strong> Unsubscribe from marketing communications</li>
                  <li><strong className="text-gray-900">Account Settings:</strong> Manage your privacy preferences through your account settings</li>
                </ul>
                <p className="mt-3 text-gray-700">
                  To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
                </p>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-yellow-100 rounded-xl">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Cookies and Tracking Technologies</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>
                    We use cookies and similar tracking technologies to track activity on our platform and store certain information. Cookies are small data files stored on your device.
                  </p>
                  <p>
                    You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our services.
                  </p>
                  <p>
                    We use cookies for:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Authentication and session management</li>
                    <li>Remembering your preferences and settings</li>
                    <li>Analyzing usage patterns and improving our services</li>
                    <li>Providing personalized content and advertisements</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-teal-100 rounded-xl">
                <Database className="w-6 h-6 text-teal-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">8. Data Retention</h2>
                <p className="text-gray-700 leading-relaxed">
                  We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal, regulatory, or business purposes.
                </p>
              </div>
            </div>
          </section>

          {/* Children's Privacy */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-pink-100 rounded-xl">
                <Shield className="w-6 h-6 text-pink-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">9. Children's Privacy</h2>
                <p className="text-gray-700 leading-relaxed">
                  Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately, and we will delete such information.
                </p>
              </div>
            </div>
          </section>

          {/* Changes to Privacy Policy */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <FileText className="w-6 h-6 text-[#114373]" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">10. Changes to This Privacy Policy</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically for any changes. Your continued use of our services after changes are posted constitutes your acceptance of the updated Privacy Policy.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="space-y-4 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Mail className="w-6 h-6 text-[#114373]" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">11. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#114373]" />
                    <div>
                      <p className="text-gray-900 font-semibold">Email</p>
                      <a href="mailto:privacy@axiahr.com" className="text-[#114373] hover:underline">privacy@axiahr.com</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-[#114373]" />
                    <div>
                      <p className="text-gray-900 font-semibold">Phone</p>
                      <a href="tel:+255123456789" className="text-[#114373] hover:underline">+255 123 456 789</a>
                    </div>
                  </div>
                  <div className="pt-3">
                    <Link href="/contact" className="inline-block text-[#114373] hover:text-[#0d3559] font-medium transition-colors">
                      Visit our Contact Page →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

