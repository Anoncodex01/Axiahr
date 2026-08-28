'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Eye,
  Mail,
  Phone,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Download,
  FileText,
  MapPin,
  User,
  Calendar,
  Shield,
  CheckSquare,
  Square,
} from 'lucide-react';
import LoadingState from '@/components/LoadingState';
import { getCountryOptions, getStateOptions } from '@/utils/locationData';

interface Employer {
  id: string;
  companyName: string;
  contactPerson: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  industry: string;
  businessType: string;
  companyBrief: string;
  companyLogo: string;
  website: string;
  city: string;
  region: string;
  country: string;
  mobilePhone: string;
  mobileCountryCode: string;
  landlinePhone: string;
  landlineCountryCode: string;
  status: 'pending' | 'active' | 'inactive' | 'suspended';
  profileStatus: 'incomplete' | 'pending' | 'approved' | 'rejected';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
}

export default function EmployersManagement() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [profileStatusFilter, setProfileStatusFilter] = useState('all');
  const [selectedEmployers, setSelectedEmployers] = useState<string[]>([]);

  const fetchEmployers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (profileStatusFilter !== 'all') params.append('profileStatus', profileStatusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/employers?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setEmployers(data.employers || []);
      } else {
        console.error('Failed to fetch employers:', data.error);
      }
    } catch (error) {
      console.error('Error fetching employers:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, profileStatusFilter, searchTerm]);

  // Fetch employers from API
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployers();
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timer);
  }, [fetchEmployers, searchTerm]);


  const handleSelectEmployer = (employerId: string) => {
    setSelectedEmployers(prev => 
      prev.includes(employerId) 
        ? prev.filter(id => id !== employerId)
        : [...prev, employerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployers.length === filteredEmployers.length) {
      setSelectedEmployers([]);
    } else {
      setSelectedEmployers(filteredEmployers.map(e => e.id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProfileStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'incomplete':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPhone = (phone: string, countryCode: string) => {
    if (!phone) return 'N/A';
    return countryCode ? `${countryCode} ${phone}` : phone;
  };

  const formatLocation = (city: string, region: string, country: string) => {
    const parts: string[] = [];
    
    if (city) parts.push(city);
    
    if (region) {
      // Try to convert region code to name if it's a code
      const countries = getCountryOptions();
      const countryObj = countries.find(c => c.value === country || c.label === country);
      if (countryObj) {
        const states = getStateOptions(countryObj.value);
        const stateObj = states.find(s => s.value === region || s.label === region);
        parts.push(stateObj ? stateObj.label : region);
      } else {
        parts.push(region);
      }
    }
    
    if (country) {
      // Try to convert country code to name if it's a code
      const countries = getCountryOptions();
      const countryObj = countries.find(c => c.value === country || c.label === country);
      parts.push(countryObj ? countryObj.label : country);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const filteredEmployers = employers.filter(employer => {
    const matchesSearch = !searchTerm || 
      employer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employer.industry.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const stats = [
    { 
      title: 'Total Employers', 
      value: employers.length, 
      color: 'bg-blue-500' 
    },
    { 
      title: 'Pending Approval', 
      value: employers.filter(e => e.profileStatus === 'pending').length, 
      color: 'bg-yellow-500' 
    },
    { 
      title: 'Approved', 
      value: employers.filter(e => e.profileStatus === 'approved').length, 
      color: 'bg-green-500' 
    },
    { 
      title: 'Rejected', 
      value: employers.filter(e => e.profileStatus === 'rejected').length, 
      color: 'bg-red-500' 
    },
    { 
      title: 'Incomplete', 
      value: employers.filter(e => e.profileStatus === 'incomplete').length, 
      color: 'bg-gray-500' 
    },
    { 
      title: 'Active', 
      value: employers.filter(e => e.status === 'active').length, 
      color: 'bg-indigo-500' 
    }
  ];

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingState message="Loading employers..." size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employers Management</h1>
          <p className="text-lg text-gray-600">Manage and approve employer profiles</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchEmployers}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
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
                <Building2 className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search Employers</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or contact person..."
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Status</label>
            <select
              value={profileStatusFilter}
              onChange={(e) => setProfileStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
            >
              <option value="all">All Profiles</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="incomplete">Incomplete</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">All Employers ({filteredEmployers.length})</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAll}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                {selectedEmployers.length === filteredEmployers.length ? 'Deselect All' : 'Select All'}
              </button>
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
                    checked={selectedEmployers.length === filteredEmployers.length && filteredEmployers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-[#114373] focus:ring-[#114373]"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Profile Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Building2 className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 text-lg font-medium">No employers found</p>
                      <p className="text-gray-400 text-sm mt-2">
                        {searchTerm ? 'Try adjusting your search criteria' : 'No employers in the database yet'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployers.map((employer) => (
                  <tr key={employer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedEmployers.includes(employer.id)}
                        onChange={() => handleSelectEmployer(employer.id)}
                        className="rounded border-gray-300 text-[#114373] focus:ring-[#114373]"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {employer.companyLogo ? (
                          <img 
                            src={employer.companyLogo} 
                            alt={employer.companyName} 
                            className="w-10 h-10 rounded-lg object-cover mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-[#114373] to-[#0d3559] rounded-lg flex items-center justify-center mr-3">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{employer.companyName}</div>
                          <div className="text-xs text-gray-500">{employer.industry || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">{employer.contactPerson}</div>
                      <div className="text-xs text-gray-500 mt-1">{employer.email}</div>
                      {employer.mobilePhone && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatPhone(employer.mobilePhone, employer.mobileCountryCode)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProfileStatusColor(employer.profileStatus)}`}>
                        {employer.profileStatus === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {employer.profileStatus === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {employer.profileStatus === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                        {employer.profileStatus === 'incomplete' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {employer.profileStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatLocation(employer.city, employer.region, employer.country)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(employer.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/admin/employers/${employer.id}`}
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
