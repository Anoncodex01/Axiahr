'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, FileText, DollarSign, Calendar, MapPin, Users, Briefcase, ArrowRight } from 'lucide-react';
import EmployerLayout from '@/components/EmployerLayout';

interface JobDescriptionForm {
  designation: string;
  jobProfile: string;
  jobRequirements: string;
  salaryRangeTsh: string;
  salaryRangeUsd: string;
  currency: 'TZS' | 'USD';
  contractType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Consultant';
  location: string;
  experienceLevel: 'Entry' | 'Mid' | 'Senior' | 'Executive';
  educationLevel: 'High School' | 'Diploma' | 'Bachelor' | 'Master' | 'PhD';
  numberOfPositions: number;
  startDate: string;
  reportingTo: string;
  department: string;
}

export default function JobDescriptionForm() {
  const router = useRouter();
  const [form, setForm] = useState<JobDescriptionForm>({
    designation: '',
    jobProfile: '',
    jobRequirements: '',
    salaryRangeTsh: '',
    salaryRangeUsd: '',
    currency: 'TZS',
    contractType: 'Full-time',
    location: '',
    experienceLevel: 'Mid',
    educationLevel: 'Bachelor',
    numberOfPositions: 1,
    startDate: '',
    reportingTo: '',
    department: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof JobDescriptionForm, value: string | number) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Redirect to success page or dashboard
    router.push('/employer/dashboard');
  };

  const isFormValid = form.designation && 
                    form.jobProfile && 
                    form.jobRequirements && 
                    (form.currency === 'TZS' ? form.salaryRangeTsh : form.salaryRangeUsd) &&
                    form.contractType &&
                    form.location &&
                    form.experienceLevel &&
                    form.educationLevel &&
                    form.numberOfPositions > 0 &&
                    form.startDate &&
                    form.reportingTo &&
                    form.department;

  return (
    <EmployerLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Description</h1>
              <p className="text-lg text-gray-600">Please provide detailed information about the position you want to fill</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-8">
              <div className="space-y-8">
                {/* Basic Information */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Briefcase className="w-6 h-6 mr-2 text-blue-600" />
                    Basic Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Designation/Position *
                      </label>
                      <input
                        type="text"
                        value={form.designation}
                        onChange={(e) => handleInputChange('designation', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Senior Software Engineer"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department *
                      </label>
                      <input
                        type="text"
                        value={form.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Information Technology"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Positions *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={form.numberOfPositions}
                        onChange={(e) => handleInputChange('numberOfPositions', parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reporting To *
                      </label>
                      <input
                        type="text"
                        value={form.reportingTo}
                        onChange={(e) => handleInputChange('reportingTo', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., IT Manager"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location *
                      </label>
                      <input
                        type="text"
                        value={form.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Dar es Salaam, Tanzania"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Start Date *
                      </label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Job Details */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FileText className="w-6 h-6 mr-2 text-green-600" />
                    Job Details
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Profile *
                      </label>
                      <textarea
                        value={form.jobProfile}
                        onChange={(e) => handleInputChange('jobProfile', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe the role, responsibilities, and what the candidate will be doing..."
                        rows={6}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Requirements *
                      </label>
                      <textarea
                        value={form.jobRequirements}
                        onChange={(e) => handleInputChange('jobRequirements', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="List the required skills, qualifications, experience, and any other requirements..."
                        rows={6}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Compensation & Contract */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <DollarSign className="w-6 h-6 mr-2 text-purple-600" />
                    Compensation & Contract
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency *
                      </label>
                      <select
                        value={form.currency}
                        onChange={(e) => handleInputChange('currency', e.target.value as 'TZS' | 'USD')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="TZS">Tanzanian Shilling (TZS)</option>
                        <option value="USD">US Dollar (USD)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contract Type *
                      </label>
                      <select
                        value={form.contractType}
                        onChange={(e) => handleInputChange('contractType', e.target.value as JobDescriptionForm['contractType'])}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                        <option value="Consultant">Consultant</option>
                      </select>
                    </div>

                    {form.currency === 'TZS' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Salary Range (TZS) *
                        </label>
                        <input
                          type="text"
                          value={form.salaryRangeTsh}
                          onChange={(e) => handleInputChange('salaryRangeTsh', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 1,500,000 - 2,500,000"
                          required
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Salary Range (USD) *
                        </label>
                        <input
                          type="text"
                          value={form.salaryRangeUsd}
                          onChange={(e) => handleInputChange('salaryRangeUsd', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 800 - 1,200"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience Level *
                      </label>
                      <select
                        value={form.experienceLevel}
                        onChange={(e) => handleInputChange('experienceLevel', e.target.value as JobDescriptionForm['experienceLevel'])}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="Entry">Entry Level (0-2 years)</option>
                        <option value="Mid">Mid Level (3-5 years)</option>
                        <option value="Senior">Senior Level (6-10 years)</option>
                        <option value="Executive">Executive Level (10+ years)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Education Level *
                      </label>
                      <select
                        value={form.educationLevel}
                        onChange={(e) => handleInputChange('educationLevel', e.target.value as JobDescriptionForm['educationLevel'])}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="High School">High School</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Bachelor">Bachelor's Degree</option>
                        <option value="Master">Master's Degree</option>
                        <option value="PhD">PhD</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
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
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Job Description
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </EmployerLayout>
  );
}
