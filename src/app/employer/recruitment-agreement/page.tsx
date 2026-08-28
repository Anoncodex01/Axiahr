'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, FileText, Building2, User, Calendar, DollarSign, Shield, AlertTriangle } from 'lucide-react';
import EmployerLayout from '@/components/EmployerLayout';

interface AgreementData {
  clientName: string;
  clientAddress: string;
  clientSignature: string;
  clientDate: string;
}

export default function RecruitmentAgreement() {
  const router = useRouter();
  const [agreementData, setAgreementData] = useState<AgreementData>({
    clientName: '',
    clientAddress: '',
    clientSignature: '',
    clientDate: ''
  });
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof AgreementData, value: string) => {
    setAgreementData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAgreed) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Redirect to job description form
    router.push('/employer/job-description');
  };

  const isFormValid = agreementData.clientName && 
                    agreementData.clientAddress && 
                    agreementData.clientSignature && 
                    agreementData.clientDate && 
                    isAgreed;

  return (
    <EmployerLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center">
              <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Recruiting Services Agreement</h1>
              <p className="text-lg text-gray-600">Please review and sign the agreement to proceed with recruitment services</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Agreement Content */}
            <div className="p-8">
              <div className="prose max-w-none">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Recruiting Services Agreement</h2>
                  <p className="text-gray-600">This Agreement is made as of __________</p>
                </div>

                <div className="space-y-6 text-sm leading-relaxed">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Between</h3>
                    <p className="text-gray-700">
                      <strong>Axia HR Advisory Tanzania Limited</strong> (the "Agency"), an offshoot of RM Finance Consulting Limited, 
                      having its registered office at the mezzanine floor of Urban Tower, Jamhuri Street, P.O BOX 75303, Dar es Salaam, Tanzania
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">And</h3>
                    <p className="text-gray-700">
                      ____________________, (the "Client"), having its registered office at _____________________________________, 
                      where the Agency will source, recruit, review, and present potential employees to the Client.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                      1. Placement Fee:
                    </h3>
                    <div className="space-y-3 text-gray-700">
                      <div>
                        <strong>a. Fee Calculation:</strong>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                          <li>The Agency's fees shall be calculated as the employee's one-month Gross Salary or TSH 800,000/-, whichever is higher.</li>
                          <li>Fees are exclusive of VAT, which will be charged at the prevailing rate.</li>
                          <li>For each recruitment position assigned, a deposit of Tsh. 600,000 will be payable upfront. If a suitable candidate is identified and hired, this deposit will be deducted from the total fee due.</li>
                          <li>If we do not present a suitable candidate within one (1) month, the deposit will be fully refunded. However, to be eligible for the refund, you must review all CVs we provide and conduct interviews with candidates who meet your requirements. If no interviews are conducted by you for matching candidates, the deposit will be forfeited.</li>
                        </ul>
                      </div>
                      <div>
                        <strong>b. Fee Due Date and Payment Terms:</strong>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                          <li>The Client shall pay the due amount upon the Employee either joining the company or signing the employment contract, whichever occurs earlier.</li>
                          <li>This amount has to be paid within 15 days from the date the invoice is raised.</li>
                        </ul>
                      </div>
                      <div>
                        <strong>c. Replacement and Refund Policy:</strong>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                          <li>In the event the candidate placed by the Agency leaves within the first 3 months, the Agency shall provide a replacement candidate to the client within 21 working days from the date the Agency is informed of the candidate's departure.</li>
                        </ul>
                      </div>
                      <div>
                        <strong>d. Payment Details:</strong>
                        <p className="ml-4 mt-2">
                          Axia HR Advisory is a wholly-owned subsidiary of RM Financial Consulting. Accordingly, all invoices for services rendered by Axia HR Advisory shall be issued under the name of RM Financial Consulting, and all payments in respect thereof shall be made in favor of RM Financial Consulting. Payments can be made in cash, cheque, or electronic transfer. All cheques should be made payable to RM Financial Consulting Limited. For bank transactions, the details are as follows:
                        </p>
                       
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-green-600" />
                      2. Service Guarantee:
                    </h3>
                    <p className="text-gray-700">
                      The Agency offers a three-month guarantee for placed candidates. If a candidate resigns or is terminated due to poor performance within three months of employment (without any contributing factors from the Client), the Client must notify the Agency in writing within 7 days of termination. The Agency will conduct a new search at no extra cost and provide a suitable replacement within 21 working days. This free replacement clause applies only to the first recruitment and not to the replaced candidate.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">3. Qualifications of Candidates:</h3>
                    <p className="text-gray-700">
                      The Client has sole discretion to establish the minimum qualifications necessary for candidates applying for any positions offered.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">4. Timing:</h3>
                    <p className="text-gray-700">
                      The initial search and identification of prospective candidates are typically completed within one to three weeks. The screening/interview process, leading to the presentation of a candidate shortlist, is also usually completed within one to three weeks. Most searches are thus completed within two to six weeks. The final selection depends on both the Client's and the candidate's availability for interviews and the Client's internal decision-making process. An estimated timeframe for completion will be provided at the outset of each assignment.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">5. Confidentiality:</h3>
                    <p className="text-gray-700">
                      All searches conducted by the Agency are performed according to the highest standards of professionalism and confidentiality. Confidential information provided to the Agency is respected and should be treated with the same level of confidentiality by the Client regarding any candidate or general information provided.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                      6. Liability Disclaimer:
                    </h3>
                    <p className="text-gray-700">
                      While the Agency conducts thorough candidate background checks, it is ultimately the Client's responsibility to verify a candidate's suitability for a position. The Agency cannot be held liable for any loss, damage, or injury to persons or property arising directly or indirectly from any act of a candidate introduced by the Agency.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">7. Terms and Conditions:</h3>
                    <div className="space-y-2 text-gray-700">
                      <p>a) Candidates presented to the Client, whether verbally or in writing, will be considered Agency Recruitment candidates for twelve (12) months from the date of introduction. If such a candidate is hired within this timeframe, the Agency's professional fees will immediately become due.</p>
                      <p>b) The Client must notify the Agency immediately upon accepting one of the Agency's candidates.</p>
                      <p>c) If a replacement candidate is needed, the Agency will provide a free future search for that specific candidate's replacement, provided the Agency's invoice has been settled in full within 15 days of receipt. The service guarantee can be canceled if this condition is not met.</p>
                      <p>d) These Terms and Conditions of Business shall be effective upon execution by both parties and valid until terminated under the provisions hereof.</p>
                      <p>e) Either party may terminate these Terms and Conditions at its sole discretion, without assigning any reason or incurring any liability to the other party, by giving one (1) month's written notice.</p>
                      <p>f) No variation to these Terms and Conditions shall be valid unless agreed upon in writing by both the Agency and the Client.</p>
                      <p>g) These Terms and Conditions constitute the entire agreement between the parties concerning the subject matter and supersede all prior agreements, oral or written, concerning such subject matter.</p>
                      <p>i) The Client undertakes not to poach any employees of the Agency.</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">8. Entire Agreement and Governing Law:</h3>
                    <p className="text-gray-700">
                      The conditions contained herein constitute the entire agreement between the Client and the Agency. No variation shall be valid unless put in writing and signed by both parties. This Agreement shall be governed by and construed in accordance with the laws of Tanzania.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">9. Acknowledgement and Acceptance:</h3>
                    <p className="text-gray-700">
                      I have read the attached letter and standard Terms and Conditions, and accept the proposal for Recruitment Services by Axia HR Advisory, an offshoot of RM Financial Consulting Limited.
                    </p>
                  </div>
                </div>

                {/* Signature Section */}
                <div className="mt-12 border-t pt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Accepted by the Agency:</h4>
                      <p className="text-sm text-gray-600 mb-4">For and On Behalf of AXIA HR ADVISORY:</p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Signature:</label>
                          <div className="border-b border-gray-300 pb-1">
                            <span className="text-sm text-gray-500">Axia HR Advisory Representative</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
                          <div className="border-b border-gray-300 pb-1">
                            <span className="text-sm text-gray-500">{new Date().toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Stamp:</label>
                          <div className="border-b border-gray-300 pb-1">
                            <span className="text-sm text-gray-500">[Official Stamp]</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Accepted by the Client:</h4>
                      <p className="text-sm text-gray-600 mb-4">For and On Behalf of _______________________________</p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                          <input
                            type="text"
                            value={agreementData.clientName}
                            onChange={(e) => handleInputChange('clientName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your company name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Company Address *</label>
                          <textarea
                            value={agreementData.clientAddress}
                            onChange={(e) => handleInputChange('clientAddress', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your company address"
                            rows={3}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Signature *</label>
                          <input
                            type="text"
                            value={agreementData.clientSignature}
                            onChange={(e) => handleInputChange('clientSignature', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your full name as signature"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                          <input
                            type="date"
                            value={agreementData.clientDate}
                            onChange={(e) => handleInputChange('clientDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agreement Checkbox */}
                <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAgreed}
                      onChange={(e) => setIsAgreed(e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">I agree to the terms and conditions</span>
                      <p className="text-gray-600 mt-1">
                        By checking this box, I acknowledge that I have read, understood, and agree to be bound by all the terms and conditions outlined in this Recruiting Services Agreement.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className={`px-8 py-3 rounded-md font-medium transition-colors ${
                  isFormValid && !isSubmitting
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Sign Agreement & Continue
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </EmployerLayout>
  );
}
