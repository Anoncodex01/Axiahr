'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import LoadingState from '@/components/LoadingState';
// AdminLayout is now provided by RoleBasedAdminLayout in the root layout
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MessageCircle,
  Download,
  Upload,
  Plus,
  UserPlus,
  UserCheck,
  UserX,
  Calendar,
  Award,
  MapPin,
  GraduationCap,
  Briefcase,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Target,
  Zap,
  RefreshCw,
  Bell,
  Settings,
  Archive,
  Share2,
  Copy,
  ExternalLink,
  BarChart3,
  PieChart,
  Activity,
  TrendingUp,
  TrendingDown,
  Building2,
  FileText,
  DollarSign,
  Shield,
  MessageSquare,
  Globe,
  BookOpen,
  Target as TargetIcon,
  TrendingUp as TrendingUpIcon,
  Users as UsersIcon,
  Building as BuildingIcon,
  FileText as FileTextIcon,
  Award as AwardIcon,
  DollarSign as DollarSignIcon,
  Clock as ClockIcon,
  AlertTriangle,
  CheckSquare,
  Square,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  ArrowRight,
  ArrowLeft,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  Bell as BellIcon,
  TrendingUp as TrendingUpIcon2,
  TrendingDown as TrendingDownIcon,
  Target as TargetIcon2,
  BarChart3 as BarChart3Icon,
  Settings as SettingsIcon
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: {
    countryCode: string;
    number: string;
  };
  whatsapp?: {
    countryCode: string;
    number: string;
  };
  status: 'new' | 'shortlisted' | 'interviewed' | 'selected' | 'rejected' | 'placed';
  appliedDate: string;
  lastActivity: string;
  skills: string[];
  experience: string;
  location: string;
  avatar?: string;
  nationality: string;
  currentCompany?: string;
  expectedSalary?: string;
  noticePeriod?: string;
  education: Array<{
    degree: string;
    specialization: string;
    institute: string;
    yearOfPassing: string;
    isHighestQualification: boolean;
  }>;
  languages: Array<{
    name: string;
    proficiency: string;
  }>;
  applications: number;
  interviews: number;
  placements: number;
}

interface CandidateData {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  emailVerified: boolean;
  profileCompleted: boolean;
  location: string;
  experience: string;
  profilePicture: string | null;
  createdAt: string | null;
}

export default function CandidatesManagement() {
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/candidates?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setCandidates(data.candidates || []);
      } else {
        console.error('Failed to fetch candidates:', data.error);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  // Fetch candidates from API
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCandidates();
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timer);
  }, [fetchCandidates, searchTerm]);

  // Mock data - REMOVED - now using API data
  const mockCandidates: Candidate[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: {
        countryCode: '+1',
        number: '(555) 123-4567'
      },
      whatsapp: {
        countryCode: '+1',
        number: '(555) 123-4567'
      },
      status: 'shortlisted',
      appliedDate: '2024-01-15',
      lastActivity: '2024-01-20',
      skills: ['React', 'Node.js', 'Python', 'JavaScript'],
      experience: '5 years',
      location: 'San Francisco, CA',
      nationality: 'American',
      currentCompany: 'Tech Corp',
      expectedSalary: '$120,000',
      noticePeriod: '30 days',
      education: [
        {
          degree: 'Bachelor of Science',
          specialization: 'Computer Science',
          institute: 'Stanford University',
          yearOfPassing: '2019',
          isHighestQualification: true
        }
      ],
      languages: [
        { name: 'English', proficiency: 'Native' },
        { name: 'Spanish', proficiency: 'Professional' }
      ],
      applications: 3,
      interviews: 2,
      placements: 0
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: {
        countryCode: '+1',
        number: '(555) 234-5678'
      },
      status: 'interviewed',
      appliedDate: '2024-01-18',
      lastActivity: '2024-01-22',
      skills: ['Java', 'Spring', 'AWS', 'Docker'],
      experience: '7 years',
      location: 'New York, NY',
      nationality: 'Canadian',
      currentCompany: 'Finance Inc',
      expectedSalary: '$140,000',
      noticePeriod: '60 days',
      education: [
        {
          degree: 'Master of Science',
          specialization: 'Software Engineering',
          institute: 'MIT',
          yearOfPassing: '2017',
          isHighestQualification: true
        }
      ],
      languages: [
        { name: 'English', proficiency: 'Native' },
        { name: 'French', proficiency: 'Professional' }
      ],
      applications: 5,
      interviews: 3,
      placements: 1
    },
    {
      id: '3',
      name: 'Mike Chen',
      email: 'mike.chen@email.com',
      phone: {
        countryCode: '+1',
        number: '(555) 345-6789'
      },
      status: 'selected',
      appliedDate: '2024-01-20',
      lastActivity: '2024-01-25',
      skills: ['Python', 'Django', 'PostgreSQL', 'Redis'],
      experience: '4 years',
      location: 'Austin, TX',
      nationality: 'Chinese',
      currentCompany: 'Startup Inc',
      expectedSalary: '$95,000',
      noticePeriod: '15 days',
      education: [
        {
          degree: 'Bachelor of Engineering',
          specialization: 'Computer Engineering',
          institute: 'University of Texas',
          yearOfPassing: '2020',
          isHighestQualification: true
        }
      ],
      languages: [
        { name: 'English', proficiency: 'Professional' },
        { name: 'Mandarin', proficiency: 'Native' }
      ],
      applications: 2,
      interviews: 1,
      placements: 0
    },
    {
      id: '4',
      name: 'Emily Rodriguez',
      email: 'emily.r@email.com',
      phone: {
        countryCode: '+1',
        number: '(555) 456-7890'
      },
      status: 'placed',
      appliedDate: '2024-01-10',
      lastActivity: '2024-01-28',
      skills: ['Vue.js', 'TypeScript', 'GraphQL', 'MongoDB'],
      experience: '6 years',
      location: 'Seattle, WA',
      nationality: 'Mexican',
      currentCompany: 'Tech Corp',
      expectedSalary: '$130,000',
      noticePeriod: '45 days',
      education: [
        {
          degree: 'Bachelor of Science',
          specialization: 'Information Technology',
          institute: 'University of Washington',
          yearOfPassing: '2018',
          isHighestQualification: true
        }
      ],
      languages: [
        { name: 'English', proficiency: 'Native' },
        { name: 'Spanish', proficiency: 'Native' }
      ],
      applications: 4,
      interviews: 2,
      placements: 1
    },
    {
      id: '5',
      name: 'David Kim',
      email: 'david.kim@email.com',
      phone: {
        countryCode: '+1',
        number: '(555) 567-8901'
      },
      status: 'rejected',
      appliedDate: '2024-01-12',
      lastActivity: '2024-01-18',
      skills: ['Angular', 'C#', 'SQL Server', 'Azure'],
      experience: '8 years',
      location: 'Chicago, IL',
      nationality: 'Korean',
      currentCompany: 'Enterprise Corp',
      expectedSalary: '$150,000',
      noticePeriod: '90 days',
      education: [
        {
          degree: 'Master of Science',
          specialization: 'Computer Science',
          institute: 'Northwestern University',
          yearOfPassing: '2016',
          isHighestQualification: true
        }
      ],
      languages: [
        { name: 'English', proficiency: 'Professional' },
        { name: 'Korean', proficiency: 'Native' }
      ],
      applications: 1,
      interviews: 1,
      placements: 0
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'shortlisted':
        return 'bg-yellow-100 text-yellow-800';
      case 'interviewed':
        return 'bg-purple-100 text-purple-800';
      case 'selected':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'placed':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <UserPlus className="w-4 h-4" />;
      case 'shortlisted':
        return <UserCheck className="w-4 h-4" />;
      case 'interviewed':
        return <Calendar className="w-4 h-4" />;
      case 'selected':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <UserX className="w-4 h-4" />;
      case 'placed':
        return <Award className="w-4 h-4" />;
      default:
        return <UserPlus className="w-4 h-4" />;
    }
  };

  const handleSelectCandidate = (candidateId: string) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCandidates.length === candidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(candidates.map(c => c.id));
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = !searchTerm || 
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { title: 'Total Candidates', value: candidates.length, color: 'bg-blue-500' },
    { title: 'Active', value: candidates.filter(c => c.status === 'active').length, color: 'bg-green-500' },
    { title: 'Pending', value: candidates.filter(c => c.status === 'pending').length, color: 'bg-yellow-500' },
    { title: 'Suspended', value: candidates.filter(c => c.status === 'suspended').length, color: 'bg-red-500' },
    { title: 'Verified', value: candidates.filter(c => c.emailVerified).length, color: 'bg-indigo-500' },
    { title: 'Profile Complete', value: candidates.filter(c => c.profileCompleted).length, color: 'bg-emerald-500' }
  ];

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingState message="Loading candidates..." size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Candidates Management</h1>
            <p className="text-lg text-gray-600">Manage and track all candidate profiles and applications</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/candidates/new"
              className="inline-flex items-center px-4 py-2 bg-[#114373] text-white rounded-xl hover:bg-[#0d3559] transition-colors font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Candidate
            </Link>
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-2xl ${stat.color} text-white`}>
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Candidates</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interviewed">Interviewed</option>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
                <option value="placed">Placed</option>
              </select>
            </div>
            
          </div>
        </div>

        {/* Candidates Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">All Candidates ({filteredCandidates.length})</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  {selectedCandidates.length === candidates.length ? 'Deselect All' : 'Select All'}
                </button>
                {selectedCandidates.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{selectedCandidates.length} selected</span>
                    <button className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors">
                      Bulk Actions
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.length === candidates.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-[#114373] focus:ring-[#114373]"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg font-medium">No candidates found</p>
                        <p className="text-gray-400 text-sm mt-2">
                          {searchTerm ? 'Try adjusting your search criteria' : 'No candidates in the database yet'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.includes(candidate.id)}
                          onChange={() => handleSelectCandidate(candidate.id)}
                          className="rounded border-gray-300 text-[#114373] focus:ring-[#114373]"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {candidate.profilePicture ? (
                            <img 
                              src={candidate.profilePicture} 
                              alt={candidate.name}
                              className="w-10 h-10 rounded-full object-cover mr-3"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mr-3">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{candidate.name}</div>
                            <div className="text-xs text-gray-500">{candidate.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">{candidate.email}</div>
                        {candidate.phone && (
                          <div className="text-xs text-gray-500 mt-1">{candidate.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                          {getStatusIcon(candidate.status)}
                          <span className="ml-1 capitalize">{candidate.status}</span>
                        </span>
                        {candidate.emailVerified && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {candidate.location && candidate.location !== 'N/A' ? candidate.location : 'N/A'}
                        </div>
                        {candidate.experience && candidate.experience !== 'N/A' && (
                          <div className="text-xs text-gray-500 mt-1">{candidate.experience}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(candidate.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/admin/candidates/${candidate.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
  );
}
