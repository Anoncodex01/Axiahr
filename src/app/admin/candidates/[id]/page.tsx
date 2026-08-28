'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  ArrowLeft,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  FileText,
  Download,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  ExternalLink,
  UserCheck,
  UserX,
  Shield,
  Code,
  Trophy,
  DollarSign,
  Target,
  Building2
} from 'lucide-react';
import LoadingState from '@/components/LoadingState';

interface Candidate {
  id: string;
  firstName: string;
  middleName?: string;
  surname: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  whatsapp?: string;
  gender: string;
  status: string;
  emailVerified: boolean;
  profileCompleted: boolean;
  location: string;
  currentLocation: {
    city: string;
    state: string;
    country: string;
  };
  permanentLocation: {
    city: string;
    state: string;
    country: string;
  };
  currentAddress?: {
    houseNo: string;
    streetName: string;
    landmark: string;
    postalCode: string;
  };
  permanentAddress?: {
    houseNo: string;
    streetName: string;
    landmark: string;
    postalCode: string;
  };
  nationality: string;
  origin?: string;
  maritalStatus?: string;
  dateOfBirth: string | null;
  profilePicture: string | null;
  resumeHeadline: string;
  profileSummary: string;
  experienceType: string;
  totalExperienceYears: number;
  totalExperienceMonths: number;
  isOpenForRelocation: boolean;
  preferredLocations: string[];
  skills: Array<{
    name: string;
    proficiency: string;
  }>;
  experienceCount: number;
  educationCount: number;
  experiences: any[];
  education: any[];
  languages: any[];
  salary: any;
  references: any[];
  projects: any[];
  accomplishments: any[];
  certifications: any[];
  onlinePresence: any;
  jobPreferences: any;
  resume: any;
  createdAt: string | null;
  updatedAt: string | null;
}

export default function CandidateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/candidates?id=${candidateId}`);
        const data = await response.json();

        if (data.success && data.candidate) {
          setCandidate(data.candidate);
        } else {
          console.error('Failed to fetch candidate:', data.error);
          // Redirect to candidates list after 2 seconds
          setTimeout(() => {
            router.push('/admin/candidates');
          }, 2000);
        }
      } catch (error) {
        console.error('Error fetching candidate:', error);
        // Redirect to candidates list after 2 seconds
        setTimeout(() => {
          router.push('/admin/candidates');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    if (candidateId) {
      fetchCandidate();
    }
  }, [candidateId, router]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatLocation = (location: { city: string; state: string; country: string }) => {
    const parts = [location.city, location.state, location.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingState message="Loading candidate information..." size="lg" />
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Candidate Not Found</h2>
          <p className="text-gray-600 mb-6">The candidate you're looking for doesn't exist or has been removed.</p>
          <Link
            href="/admin/candidates"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Candidates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/candidates"
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {candidate.firstName} {candidate.surname}
            </h1>
            <p className="text-lg text-gray-600">Candidate Profile Information</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Candidate Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-6">
          {candidate.profilePicture ? (
            <img
              src={candidate.profilePicture}
              alt={`${candidate.firstName} ${candidate.surname}`}
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
            />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center border-4 border-gray-100">
              <Users className="w-12 h-12 text-blue-600" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {candidate.firstName} {candidate.surname}
              </h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(candidate.status)}`}>
                {candidate.status === 'active' && <CheckCircle className="w-4 h-4 mr-1" />}
                {candidate.status === 'pending' && <Clock className="w-4 h-4 mr-1" />}
                {candidate.status === 'suspended' && <XCircle className="w-4 h-4 mr-1" />}
                {candidate.status}
              </span>
              {candidate.emailVerified && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Verified
                </span>
              )}
            </div>
            {candidate.resumeHeadline && (
              <p className="text-lg text-gray-700 mb-4">{candidate.resumeHeadline}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-5 h-5" />
                <span className="text-sm">{candidate.email}</span>
              </div>
              {candidate.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-5 h-5" />
                  <span className="text-sm">{candidate.phone}</span>
                </div>
              )}
              {candidate.location && candidate.location !== 'N/A' && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm">{candidate.location}</span>
                </div>
              )}
              {candidate.nationality && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Globe className="w-5 h-5" />
                  <span className="text-sm">{candidate.nationality}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-[#114373]" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-500">First Name</label>
            <p className="text-gray-900 font-medium">{candidate.firstName || 'N/A'}</p>
          </div>
          {candidate.middleName && (
            <div>
              <label className="text-sm font-semibold text-gray-500">Middle Name</label>
              <p className="text-gray-900">{candidate.middleName}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-semibold text-gray-500">Surname</label>
            <p className="text-gray-900 font-medium">{candidate.surname || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-500">Email Address</label>
            <p className="text-gray-900">{candidate.email || 'N/A'}</p>
          </div>
          {candidate.gender && (
            <div>
              <label className="text-sm font-semibold text-gray-500">Gender</label>
              <p className="text-gray-900 capitalize">{candidate.gender}</p>
            </div>
          )}
          {candidate.dateOfBirth && (
            <div>
              <label className="text-sm font-semibold text-gray-500">Date of Birth</label>
              <p className="text-gray-900">{formatDate(candidate.dateOfBirth)}</p>
            </div>
          )}
          {candidate.maritalStatus && (
            <div>
              <label className="text-sm font-semibold text-gray-500">Marital Status</label>
              <p className="text-gray-900 capitalize">{candidate.maritalStatus}</p>
            </div>
          )}
          {candidate.origin && (
            <div>
              <label className="text-sm font-semibold text-gray-500">Origin</label>
              <p className="text-gray-900">{candidate.origin}</p>
            </div>
          )}
          {candidate.nationality && (
            <div>
              <label className="text-sm font-semibold text-gray-500">Nationality</label>
              <p className="text-gray-900">{candidate.nationality}</p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Phone className="w-6 h-6 text-[#114373]" />
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidate.phone && (
            <div>
              <label className="text-sm font-semibold text-gray-500">Phone Number</label>
              <p className="text-gray-900">{candidate.phone}</p>
            </div>
          )}
          {candidate.alternatePhone && (
            <div>
              <label className="text-sm font-semibold text-gray-500">Alternate Phone</label>
              <p className="text-gray-900">{candidate.alternatePhone}</p>
            </div>
          )}
          {candidate.whatsapp && (
            <div>
              <label className="text-sm font-semibold text-gray-500">WhatsApp Number</label>
              <p className="text-gray-900">{candidate.whatsapp}</p>
            </div>
          )}
          {!candidate.phone && !candidate.alternatePhone && !candidate.whatsapp && (
            <p className="text-gray-500 text-sm">No contact information available</p>
          )}
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-[#114373]" />
          Location Information
        </h3>
        <div className="space-y-6">
          {/* Current Address */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Current Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(candidate.currentAddress?.houseNo || candidate.currentAddress?.streetName || candidate.currentAddress?.landmark || candidate.currentAddress?.postalCode) ? (
                <>
                  {candidate.currentAddress.houseNo && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500">House No</label>
                      <p className="text-gray-900">{candidate.currentAddress.houseNo}</p>
                    </div>
                  )}
                  {candidate.currentAddress.streetName && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500">Street Name</label>
                      <p className="text-gray-900">{candidate.currentAddress.streetName}</p>
                    </div>
                  )}
                  {candidate.currentAddress.landmark && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500">Landmark</label>
                      <p className="text-gray-900">{candidate.currentAddress.landmark}</p>
                    </div>
                  )}
                  {candidate.currentAddress.postalCode && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500">Postal Code</label>
                      <p className="text-gray-900">{candidate.currentAddress.postalCode}</p>
                    </div>
                  )}
                </>
              ) : null}
              <div>
                <label className="text-sm font-semibold text-gray-500">Country</label>
                <p className="text-gray-900">{candidate.currentLocation.country || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">State/Province</label>
                <p className="text-gray-900">{candidate.currentLocation.state || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">City</label>
                <p className="text-gray-900">{candidate.currentLocation.city || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Permanent Address */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Permanent Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(candidate.permanentAddress?.houseNo || candidate.permanentAddress?.streetName || candidate.permanentAddress?.landmark || candidate.permanentAddress?.postalCode) ? (
                <>
                  {candidate.permanentAddress.houseNo && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500">House No</label>
                      <p className="text-gray-900">{candidate.permanentAddress.houseNo}</p>
                    </div>
                  )}
                  {candidate.permanentAddress.streetName && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500">Street Name</label>
                      <p className="text-gray-900">{candidate.permanentAddress.streetName}</p>
                    </div>
                  )}
                  {candidate.permanentAddress.landmark && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500">Landmark</label>
                      <p className="text-gray-900">{candidate.permanentAddress.landmark}</p>
                    </div>
                  )}
                  {candidate.permanentAddress.postalCode && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500">Postal Code</label>
                      <p className="text-gray-900">{candidate.permanentAddress.postalCode}</p>
                    </div>
                  )}
                </>
              ) : null}
              <div>
                <label className="text-sm font-semibold text-gray-500">Country</label>
                <p className="text-gray-900">{candidate.permanentLocation.country || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">State/Province</label>
                <p className="text-gray-900">{candidate.permanentLocation.state || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">City</label>
                <p className="text-gray-900">{candidate.permanentLocation.city || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Relocation and Preferred Locations */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-500">Open for Relocation</label>
                <p className="text-gray-900">{candidate.isOpenForRelocation ? 'Yes' : 'No'}</p>
              </div>
              {candidate.preferredLocations && candidate.preferredLocations.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-500">Preferred Work Locations (Maximum 3)</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {candidate.preferredLocations.map((location, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {location}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-[#114373]" />
          Professional Summary
        </h3>
          <div className="space-y-4">
            {candidate.resumeHeadline && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Resume Headline</label>
                <p className="text-gray-900">{candidate.resumeHeadline}</p>
              </div>
            )}
            {candidate.profileSummary && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Profile Summary</label>
                <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">{candidate.profileSummary}</p>
              </div>
            )}
            {!candidate.resumeHeadline && !candidate.profileSummary && (
              <p className="text-gray-500 text-sm">No professional summary available</p>
            )}
        </div>
      </div>

      {/* Employment Details and Skills & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Employment Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-[#114373]" />
            Employment Details
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-500">Experience Type</label>
              <p className="text-gray-900 capitalize">{candidate.experienceType || 'N/A'}</p>
            </div>
            {(candidate.totalExperienceYears > 0 || candidate.totalExperienceMonths > 0) && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Total Experience</label>
                <p className="text-gray-900">
                  {candidate.totalExperienceYears > 0 && `${candidate.totalExperienceYears} years `}
                  {candidate.totalExperienceMonths > 0 && `${candidate.totalExperienceMonths} months`}
                  {candidate.totalExperienceYears === 0 && candidate.totalExperienceMonths === 0 && 'N/A'}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-semibold text-gray-500">Experience Records</label>
              <p className="text-gray-900">{candidate.experienceCount} records</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-500">Education Records</label>
              <p className="text-gray-900">{candidate.educationCount} records</p>
            </div>
          </div>
        </div>

        {/* Skills & Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-[#114373]" />
            Skills & Summary
          </h3>
          <div className="space-y-4">
            {candidate.skills && candidate.skills.length > 0 && (
              <div>
                <label className="text-sm font-semibold text-gray-500 mb-2 block">Skills</label>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {skill.name}
                      {skill.proficiency && (
                        <span className="ml-2 text-xs text-blue-600">({skill.proficiency})</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {candidate.profileSummary && (
              <div>
                <label className="text-sm font-semibold text-gray-500 mb-2 block">Profile Summary</label>
                <p className="text-gray-900 text-sm leading-relaxed">{candidate.profileSummary}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Experience */}
      {candidate.experiences && candidate.experiences.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-[#114373]" />
            Work Experience ({candidate.experiences.length})
          </h3>
          <div className="space-y-6">
            {candidate.experiences.map((exp: any, index: number) => (
              <div key={index} className="border-l-4 border-[#114373] pl-4 pb-4 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{exp.job_title || exp.designation || 'N/A'}</h4>
                    <p className="text-gray-600">{exp.company_name || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {exp.start_date ? formatDate(exp.start_date) : 'N/A'} - {exp.is_current || exp.end_date === null ? 'Present' : (exp.end_date ? formatDate(exp.end_date) : 'N/A')}
                    </p>
                    {exp.industry && <p className="text-xs text-gray-500 mt-1">{exp.industry}</p>}
                  </div>
                </div>
                {exp.description && (
                  <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                )}
                {exp.achievements && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-gray-500">Key Achievements:</p>
                    <p className="text-sm text-gray-700">{exp.achievements}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {candidate.education && candidate.education.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#114373]" />
            Education ({candidate.education.length})
          </h3>
          <div className="space-y-6">
            {candidate.education.map((edu: any, index: number) => {
              const qualification = edu.qualification || edu.degree || edu.category;
              const institution = edu.institution || edu.institute || edu.university;
              
              // Only show if we have at least qualification or institution
              if (!qualification && !institution) return null;
              
              return (
              <div key={index} className="border-l-4 border-[#114373] pl-4 pb-4 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    {qualification && (
                      <h4 className="text-lg font-semibold text-gray-900">
                        {qualification}
                      </h4>
                    )}
                    {institution && (
                      <p className="text-gray-600 font-medium mt-1">
                        {institution}
                      </p>
                    )}
                    {edu.field_of_study && (
                      <p className="text-sm text-gray-500 mt-1">Field of Study: {edu.field_of_study}</p>
                    )}
                    {edu.country && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {edu.country}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    {edu.start_date && edu.end_date && (
                      <p className="text-sm text-gray-600 font-medium">
                        {formatDate(edu.start_date)} - {formatDate(edu.end_date)}
                      </p>
                    )}
                    {edu.start_date && !edu.end_date && (
                      <p className="text-sm text-gray-600 font-medium">
                        {formatDate(edu.start_date)} - Present
                      </p>
                    )}
                    {!edu.start_date && edu.end_date && (
                      <p className="text-sm text-gray-600 font-medium">
                        Completed: {formatDate(edu.end_date)}
                      </p>
                    )}
                  </div>
                </div>
                {edu.description && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-700 leading-relaxed">{edu.description}</p>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Languages */}
      {candidate.languages && candidate.languages.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-6 h-6 text-[#114373]" />
            Languages ({candidate.languages.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidate.languages.map((lang: any, index: number) => {
              const languageName = lang.language_name || lang.language;
              
              // Only show if we have language name
              if (!languageName) return null;
              
              return (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{languageName}</span>
                  {lang.is_native && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Native</span>
                  )}
                </div>
                {lang.proficiency_level && (
                  <p className="text-sm text-gray-600 mt-1">Proficiency: {lang.proficiency_level}</p>
                )}
                {lang.certification && (
                  <p className="text-xs text-gray-500 mt-1">Certification: {lang.certification}</p>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Projects */}
      {candidate.projects && candidate.projects.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Code className="w-6 h-6 text-[#114373]" />
            Projects ({candidate.projects.length})
          </h3>
          <div className="space-y-6">
            {candidate.projects.map((project: any, index: number) => (
              <div key={index} className="border-l-4 border-[#114373] pl-4 pb-4 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">{project.title || 'N/A'}</h4>
                    {project.client && (
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {project.client}
                      </p>
                    )}
                    {project.project_url && (
                      <a href={project.project_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#114373] hover:underline flex items-center gap-1 mt-1">
                        <ExternalLink className="w-4 h-4" />
                        View Project
                      </a>
                    )}
                  </div>
                  {project.start_date && (
                    <p className="text-sm text-gray-600 whitespace-nowrap ml-4">
                      {formatDate(project.start_date)} - {project.end_date ? formatDate(project.end_date) : 'Present'}
                    </p>
                  )}
                </div>
                {project.description && (
                  <p className="text-sm text-gray-700 mt-2">{project.description}</p>
                )}
                {project.tools_technologies && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-gray-500">Tools & Technologies:</p>
                    <p className="text-sm text-gray-700">{project.tools_technologies}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {candidate.certifications && candidate.certifications.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-[#114373]" />
            Certifications ({candidate.certifications.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidate.certifications.map((cert: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">{cert.name || 'N/A'}</h4>
                {cert.issuing_body && <p className="text-sm text-gray-600 mt-1">Issued by: {cert.issuing_body}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  {cert.year_of_completion && <span>Year: {cert.year_of_completion}</span>}
                  {cert.validity && <span>Valid until: {cert.validity}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accomplishments */}
      {candidate.accomplishments && candidate.accomplishments.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#114373]" />
            Accomplishments ({candidate.accomplishments.length})
          </h3>
          <div className="space-y-4">
            {candidate.accomplishments.map((acc: any, index: number) => (
              <div key={index} className="border-l-4 border-[#114373] pl-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{acc.title || 'N/A'}</h4>
                    <p className="text-sm text-gray-600 mt-1">{acc.type || acc.other_type || 'N/A'}</p>
                    {acc.description && (
                      <p className="text-sm text-gray-700 mt-2">{acc.description}</p>
                    )}
                  </div>
                  {acc.year && <span className="text-sm font-semibold text-gray-600">{acc.year}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Salary Information */}
      {candidate.salary && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#114373]" />
            Salary Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidate.salary.current_salary && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Current Salary</label>
                <p className="text-gray-900">{candidate.salary.current_salary} {candidate.salary.currency || ''}</p>
              </div>
            )}
            {candidate.salary.expected_salary && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Expected Salary</label>
                <p className="text-gray-900">{candidate.salary.expected_salary} {candidate.salary.currency || ''}</p>
              </div>
            )}
            {candidate.salary.salary_type && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Salary Type</label>
                <p className="text-gray-900">{candidate.salary.salary_type}</p>
              </div>
            )}
            {candidate.salary.notice_period && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Notice Period</label>
                <p className="text-gray-900">{candidate.salary.notice_period}</p>
              </div>
            )}
            {candidate.salary.benefits && (
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-500">Benefits</label>
                <p className="text-gray-900">{candidate.salary.benefits}</p>
              </div>
            )}
            {candidate.salary.negotiable !== null && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Negotiable</label>
                <p className="text-gray-900">{candidate.salary.negotiable ? 'Yes' : 'No'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Job Preferences */}
      {candidate.jobPreferences && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-[#114373]" />
            Job Preferences
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidate.jobPreferences.job_type && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Job Type</label>
                <p className="text-gray-900 capitalize">{candidate.jobPreferences.job_type}</p>
              </div>
            )}
            {candidate.jobPreferences.work_mode && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Work Mode</label>
                <p className="text-gray-900 capitalize">{candidate.jobPreferences.work_mode}</p>
              </div>
            )}
            {candidate.jobPreferences.shift_timing && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Shift Timing</label>
                <p className="text-gray-900 capitalize">{candidate.jobPreferences.shift_timing}</p>
              </div>
            )}
            {candidate.jobPreferences.relocation_preference && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Relocation</label>
                <p className="text-gray-900 capitalize">{candidate.jobPreferences.relocation_preference}</p>
              </div>
            )}
            {candidate.jobPreferences.notice_period && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Notice Period</label>
                <p className="text-gray-900">{candidate.jobPreferences.notice_period}</p>
              </div>
            )}
            {candidate.jobPreferences.preferred_industries && (
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-500">Preferred Industries</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(() => {
                    try {
                      const industries = typeof candidate.jobPreferences.preferred_industries === 'string' 
                        ? JSON.parse(candidate.jobPreferences.preferred_industries) 
                        : candidate.jobPreferences.preferred_industries;
                      return Array.isArray(industries) ? industries.map((ind: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{ind}</span>
                      )) : null;
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              </div>
            )}
            {candidate.jobPreferences.preferred_roles && (
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-500">Preferred Roles</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(() => {
                    try {
                      const roles = typeof candidate.jobPreferences.preferred_roles === 'string' 
                        ? JSON.parse(candidate.jobPreferences.preferred_roles) 
                        : candidate.jobPreferences.preferred_roles;
                      return Array.isArray(roles) ? roles.map((role: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">{role}</span>
                      )) : null;
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Online Presence */}
      {candidate.onlinePresence && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-6 h-6 text-[#114373]" />
            Online Presence
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidate.onlinePresence.linkedin_url && (
              <div>
                <label className="text-sm font-semibold text-gray-500">LinkedIn</label>
                <a href={candidate.onlinePresence.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[#114373] hover:underline flex items-center gap-1 mt-1">
                  <ExternalLink className="w-4 h-4" />
                  {candidate.onlinePresence.linkedin_url}
                </a>
              </div>
            )}
            {candidate.onlinePresence.github_url && (
              <div>
                <label className="text-sm font-semibold text-gray-500">GitHub</label>
                <a href={candidate.onlinePresence.github_url} target="_blank" rel="noopener noreferrer" className="text-[#114373] hover:underline flex items-center gap-1 mt-1">
                  <ExternalLink className="w-4 h-4" />
                  {candidate.onlinePresence.github_url}
                </a>
              </div>
            )}
            {candidate.onlinePresence.portfolio_url && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Portfolio</label>
                <a href={candidate.onlinePresence.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-[#114373] hover:underline flex items-center gap-1 mt-1">
                  <ExternalLink className="w-4 h-4" />
                  {candidate.onlinePresence.portfolio_url}
                </a>
              </div>
            )}
            {(() => {
              let otherProfiles: string[] = [];
              if (candidate.onlinePresence.other_profiles) {
                try {
                  otherProfiles = typeof candidate.onlinePresence.other_profiles === 'string' 
                    ? JSON.parse(candidate.onlinePresence.other_profiles) 
                    : candidate.onlinePresence.other_profiles;
                } catch (e) {
                  console.error('Error parsing other_profiles:', e);
                }
              } else if (candidate.onlinePresence.otherProfiles) {
                otherProfiles = Array.isArray(candidate.onlinePresence.otherProfiles) 
                  ? candidate.onlinePresence.otherProfiles 
                  : [];
              }
              
              return otherProfiles.length > 0 ? (
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-500">Other Profiles</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {otherProfiles.map((profile: string, index: number) => (
                      <a key={index} href={profile} target="_blank" rel="noopener noreferrer" className="text-[#114373] hover:underline text-sm flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {profile}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {/* References */}
      {candidate.references && candidate.references.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#114373]" />
            References ({candidate.references.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {candidate.references.map((ref: any, index: number) => {
              const verificationStatus = ref.verification_status || ref.verificationStatus || 'pending';
              const getVerificationColor = (status: string) => {
                switch (status) {
                  case 'verified':
                    return 'bg-green-100 text-green-800 border-green-200';
                  case 'rejected':
                    return 'bg-red-100 text-red-800 border-red-200';
                  case 'pending':
                  default:
                    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                }
              };
              
              const getVerificationIcon = (status: string) => {
                switch (status) {
                  case 'verified':
                    return <CheckCircle className="w-4 h-4" />;
                  case 'rejected':
                    return <XCircle className="w-4 h-4" />;
                  case 'pending':
                  default:
                    return <Clock className="w-4 h-4" />;
                }
              };
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{ref.name || 'N/A'}</h4>
                      {ref.designation && <p className="text-sm text-gray-600 mt-1">{ref.designation}</p>}
                      {ref.company && <p className="text-sm text-gray-600">{ref.company}</p>}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getVerificationColor(verificationStatus)}`}>
                      {getVerificationIcon(verificationStatus)}
                      <span className="capitalize">{verificationStatus}</span>
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 pt-3 border-t border-gray-200">
                    {ref.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{ref.email}</span>
                      </div>
                    )}
                    {ref.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{ref.phone}</span>
                      </div>
                    )}
                    {ref.relationship && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <UserCheck className="w-4 h-4 text-gray-400" />
                        <span>Relationship: <span className="font-medium capitalize">{ref.relationship}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resume */}
      {candidate.resume && candidate.resume.resume_url && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#114373]" />
            Resume
          </h3>
          <div className="flex items-center gap-4">
            <a
              href={candidate.resume.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors"
            >
              <Download className="w-5 h-5" />
              Download Resume
            </a>
            {candidate.resume.resume_filename && (
              <span className="text-sm text-gray-600">{candidate.resume.resume_filename}</span>
            )}
            {candidate.resume.resume_size && (
              <span className="text-xs text-gray-500">
                ({(candidate.resume.resume_size / 1024).toFixed(2)} KB)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Account Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#114373]" />
          Account Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-500">Status</label>
            <p className="text-gray-900 capitalize">{candidate.status}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-500">Email Verified</label>
            <p className="text-gray-900">{candidate.emailVerified ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-500">Profile Completed</label>
            <p className="text-gray-900">{candidate.profileCompleted ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-500">Joined</label>
            <p className="text-gray-900">{formatDate(candidate.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

