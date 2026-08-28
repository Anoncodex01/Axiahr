import { FileText, Shield, AlertCircle, CheckCircle2, ArrowLeft, UserCheck, Briefcase, Mail, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function CandidateTermsPage() {
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
              <h1 className="text-4xl font-bold mb-2">Candidate Terms & Conditions</h1>
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
            <p className="text-gray-700 leading-relaxed text-lg">
              By submitting your application through Axia HR Advisory's recruitment platform, you acknowledge and agree to the following:
            </p>
          </section>

          {/* 1. Accuracy of Information */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Shield className="w-6 h-6 text-[#114373]" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Accuracy of Information</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>
                    I hereby declare that all information, statements, and responses provided in my application and during any interviews are true and honest to the best of my knowledge. I consent to Axia HR Advisory conducting verification checks on all information provided, including but not limited to employment history, qualifications, and references. I understand that Axia HR Advisory may engage third-party verification services and contact previous employers, educational institutions, or other relevant parties to confirm the accuracy of my information.
                  </p>
                  <p>
                    I understand that providing false, misleading, or incomplete information at any stage of the recruitment process will result in the following consequences:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Immediate disqualification from consideration for the current position and exclusion from Axia HR Advisory's candidate database permanently.</li>
                    <li>If employed, immediate termination of employment with potential liability for recruitment costs, training expenses, and any damages incurred by the hiring company;</li>
                    <li>Payment of liquidated damages to Axia HR Advisory equivalent to 25% of the gross annual salary for the position applied for, to compensate for verification costs, administrative expenses, and reputational damage; and</li>
                    <li>Potential legal action for recovery of all costs and damages, with the candidate being liable for Axia HR Advisory's legal fees and expenses in pursuing such action.</li>
                  </ul>
                  <p>
                    Axia HR Advisory reserves the right to share information about candidates who have provided false information with other recruitment agencies and potential employers within its network, subject to applicable data protection laws.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Employment References */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 rounded-xl">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Employment References</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>
                    I agree to provide at least three (3) professional references from my previous employment within five (5) business days when requested by Axia HR Advisory or its client(s). These references must be genuine, verifiable, and relevant to my work history. If I am unable to provide three adequate references, I may provide alternative professional references (such as clients, suppliers, or professional contacts) with prior approval from Axia HR Advisory.
                  </p>
                  <p>
                    Axia HR Advisory will conduct reasonable verification of references provided and may request additional references if the initial references are deemed insufficient or unverifiable. I understand that failure to provide satisfactory references within the specified timeframe may result in withdrawal from the recruitment process.
                  </p>
                  <p>
                    In the event of conflicting reference feedback, Axia HR Advisory reserves the right to request additional references or clarification, and I agree to cooperate fully with such requests. All reference checks will be conducted confidentially and in accordance with applicable data protection laws.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Employment Notification Obligation */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-100 rounded-xl">
                <Briefcase className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Employment Notification Obligation</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>
                    If I am interviewed by a client of Axia HR Advisory, I commit to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      Promptly notifying Axia HR Advisory upon signing or accepting any employment contract with that client within 24 hours of acceptance, failing which I will be liable to pay Axia HR Advisory liquidated damages equivalent to 20% of my gross annual salary to compensate for lost placement fees and administrative costs; and
                    </li>
                    <li>
                      Informing Axia HR Advisory immediately upon commencement of employment if I join the same client at any time within one (1) year from the date of my interview, regardless of whether the offer is made directly or via another agency. Failure to provide such notification will result in my liability to pay Axia HR Advisory compensation equivalent to the standard placement fee that would have been charged to the client (typically 8.33% of gross annual salary), plus legal costs and interest at 8% per annum from the date employment commenced until payment is made in full.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Post-Offer Commitment */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-100 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Post-Offer Commitment</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>
                    If I am offered a position through Axia HR Advisory and accept it by signing the offer letter, I commit not to withdraw my acceptance after the offer letter is signed. Should I withdraw my acceptance after signing, I acknowledge that Axia HR Advisory may pursue remedies available under Tanzanian jurisdiction, which may include seeking compensation for any losses incurred as a result of my withdrawal, as well as any legal costs associated with enforcing this clause.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Candidate Conduct & Compliance */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Candidate Conduct & Compliance</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>
                    I agree to cooperate fully with Axia HR Advisory during the recruitment process, including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Attending scheduled interviews on time;</li>
                    <li>Providing requested documents promptly; and</li>
                    <li>Communicating respectfully and courteously with all Axia HR Advisory staff and client representatives, which includes refraining from abusive, threatening, discriminatory, or defamatory language in any form of communication.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* 6. Liability Disclaimer */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-yellow-100 rounded-xl">
                <Shield className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Liability Disclaimer</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>
                    Axia HR Advisory acts solely as a recruitment intermediary between candidates and employers. The final decision to hire rests with the hiring company. Axia HR Advisory's liability is limited as follows: Axia HR Advisory excludes liability for disputes arising directly from the employment relationship between candidates and hiring companies, including but not limited to employment terms, workplace conditions, dismissal, or employment-related grievances.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 7. CV Consideration & Sharing Consent */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">7. CV Consideration & Sharing Consent</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>
                    I authorize Axia HR Advisory to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Consider my CV for the position I am applying for, for any future job opportunities, or if I submit my CV without applying for a specific role, for any suitable openings; and</li>
                    <li>Share my CV, without further consent from me, with prospective hiring organizations for suitable opportunities.</li>
                  </ul>
                </div>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Contact Us</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you have any questions about these Candidate Terms and Conditions, please contact us:
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

