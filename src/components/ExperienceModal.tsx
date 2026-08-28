'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search, Calendar, Building, Briefcase, Award, Target } from 'lucide-react';
import { getAllJobTitlesAsync, searchJobTitlesAsync } from '@/utils/jobData';
import { getAllIndustries, getAllLevels, searchIndustries } from '@/utils/industriesDesignations';

interface Experience {
  id: string;
  companyName: string;
  designation: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  companyProfile: string;
  rolesResponsibilities: string;
  keyAchievements: string;
  industry: string;
  level: string;
  experienceType?: 'work' | 'internship' | 'volunteer';
}

interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  experience?: Experience | null;
  defaultExperienceType?: 'work' | 'internship' | 'volunteer';
  onSave: (experience: Omit<Experience, 'id'>) => void;
}

// Format dates for date input (YYYY-MM-DD format) - helper function
const formatDateForInput = (dateStr: string | undefined) => {
  if (!dateStr) return '';
  const s = typeof dateStr === 'string' ? dateStr.trim() : String(dateStr).trim();
  
  // If it's already in YYYY-MM-DD format, return as is
  if (s.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return s;
  }
  
  // If it includes 'T' (ISO format with time), extract date part
  if (s.includes('T')) {
    return s.split('T')[0];
  }
  
  // If it's in YYYY format, convert to YYYY-MM-DD (use January 1st)
  if (s.match(/^\d{4}$/)) {
    return `${s}-01-01`;
  }
  
  // Try to parse DD/MM/YYYY or MM/DD/YYYY format
  const ddmmyyyyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    // Assume DD/MM/YYYY format
    const paddedDay = day.padStart(2, '0');
    const paddedMonth = month.padStart(2, '0');
    return `${year}-${paddedMonth}-${paddedDay}`;
  }
  
  // Try to parse other date formats
  try {
    const date = new Date(s);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    console.warn('Failed to parse date:', s);
  }
  
  return '';
};

export default function ExperienceModal({ isOpen, onClose, experience, defaultExperienceType = 'work', onSave }: ExperienceModalProps) {
  // Get date from various possible field names
  const getInitialStartDate = () => {
    return formatDateForInput(
      (experience as any)?.fromDate || 
      (experience as any)?.startDate || 
      (experience as any)?.start_date || 
      ''
    );
  };
  
  const getInitialEndDate = () => {
    return formatDateForInput(
      (experience as any)?.toDate || 
      (experience as any)?.endDate || 
      (experience as any)?.end_date || 
      ''
    );
  };
  
  // Support both camelCase (client) and snake_case (from DB) when pre-filling for edit
  const [formData, setFormData] = useState({
    companyName: (experience as any)?.companyName || (experience as any)?.company_name || '',
    designation: (experience as any)?.designation || (experience as any)?.jobTitle || (experience as any)?.job_title || '',
    startDate: getInitialStartDate(),
    endDate: getInitialEndDate(),
    isCurrent: Boolean((experience as any)?.isCurrent ?? (experience as any)?.is_current ?? false),
    companyProfile: (experience as any)?.companyProfile || (experience as any)?.description || '',
    rolesResponsibilities: (experience as any)?.rolesResponsibilities || (experience as any)?.roles_responsibilities || '',
    keyAchievements: (experience as any)?.keyAchievements || (experience as any)?.achievements || '',
    industry: (experience as any)?.industry || '',
    level: (experience as any)?.level || '',
    experienceType: (experience as any)?.experienceType || (experience as any)?.experience_type || defaultExperienceType
  });

  // Sync when editingExperience changes; ensure dates are in yyyy-MM-dd for input
  useEffect(() => {
    if (!isOpen) {
      // Clear validation errors when modal closes
      setValidationErrors({});
      return;
    }
    
    // Clear validation errors when modal opens
    setValidationErrors({});
    
    // If no experience provided, reset form to empty values
    if (!experience) {
      setFormData({
        companyName: '',
        designation: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        companyProfile: '',
        rolesResponsibilities: '',
        keyAchievements: '',
        industry: '',
        level: '',
        experienceType: defaultExperienceType
      });
      return;
    }
    
    // Get date from various possible field names
    const getStartDate = () => {
      return (experience as any)?.fromDate || 
             (experience as any)?.startDate || 
             (experience as any)?.start_date || 
             '';
    };
    
    const getEndDate = () => {
      return (experience as any)?.toDate || 
             (experience as any)?.endDate || 
             (experience as any)?.end_date || 
             '';
    };
    
    setFormData({
      companyName: (experience as any)?.companyName || (experience as any)?.company_name || '',
      designation: (experience as any)?.designation || (experience as any)?.jobTitle || (experience as any)?.job_title || '',
      startDate: formatDateForInput(getStartDate()) || '',
      endDate: formatDateForInput(getEndDate()) || '',
      isCurrent: Boolean((experience as any)?.isCurrent ?? (experience as any)?.is_current ?? false),
      companyProfile: (experience as any)?.companyProfile || (experience as any)?.description || '',
      rolesResponsibilities: (experience as any)?.rolesResponsibilities || (experience as any)?.roles_responsibilities || '',
      keyAchievements: (experience as any)?.keyAchievements || (experience as any)?.achievements || '',
      industry: (experience as any)?.industry || '',
      level: (experience as any)?.level || '',
      experienceType: (experience as any)?.experienceType || (experience as any)?.experience_type || defaultExperienceType
    });
  }, [experience, isOpen, defaultExperienceType]);

  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);
  const [industrySearchTerm, setIndustrySearchTerm] = useState('');
  const [designationSearchTerm, setDesignationSearchTerm] = useState('');

  const industryDropdownRef = useRef<HTMLDivElement>(null);
  const designationDropdownRef = useRef<HTMLDivElement>(null);

  // Async-loaded data from CSV-backed helpers
  const [industries, setIndustries] = useState<string[]>([]);
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [filteredJobTitles, setFilteredJobTitles] = useState<string[]>([]);
  const [levels] = useState<string[]>(['Entry', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'Executive']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingJobTitles, setIsLoadingJobTitles] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        console.log('Loading industries and job titles...');
        const [industryList, titles] = await Promise.all([
          getAllIndustries(),
          getAllJobTitlesAsync()
        ]);
        console.log('Industries loaded:', industryList.length, industryList.slice(0, 5));
        console.log('Job titles loaded:', titles.length, titles.slice(0, 5));
        if (!isMounted) return;
        setIndustries(industryList);
        setJobTitles(titles);
        setFilteredJobTitles(titles.slice(0, 20));
      } catch (e) {
        console.error('Error loading data:', e);
        // If anything fails, keep arrays empty; UI will show no results
        // Fallback still exists in utils if CSV unavailable
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Search job titles asynchronously when search term changes
  useEffect(() => {
    if (!designationSearchTerm.trim()) {
      setFilteredJobTitles(jobTitles.slice(0, 20));
      return;
    }

    let isMounted = true;
    setIsLoadingJobTitles(true);
    
    searchJobTitlesAsync(designationSearchTerm)
      .then(results => {
        if (isMounted) {
          setFilteredJobTitles(results);
          setIsLoadingJobTitles(false);
        }
      })
      .catch(error => {
        console.error('Error searching job titles:', error);
        if (isMounted) {
          // Fallback to simple filter
          const filtered = jobTitles
            .filter(t => t.toLowerCase().includes(designationSearchTerm.toLowerCase()))
            .slice(0, 20);
          setFilteredJobTitles(filtered);
          setIsLoadingJobTitles(false);
        }
      });

    return () => { isMounted = false; };
  }, [designationSearchTerm, jobTitles]);

  // Filter data based on search terms
  const filteredIndustries = industrySearchTerm 
    ? industries.filter(industry => 
        industry.toLowerCase().includes(industrySearchTerm.toLowerCase())
      )
    : industries;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(event.target as Node)) {
        setShowIndustryDropdown(false);
        setIndustrySearchTerm('');
      }
      if (designationDropdownRef.current && !designationDropdownRef.current.contains(event.target as Node)) {
        setShowDesignationDropdown(false);
        setDesignationSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear previous validation errors
    setValidationErrors({});
    
    // Validate required fields before submission
    const errors: Record<string, string> = {};
    
    // CRITICAL: Validate startDate - this is the most important field
    if (!formData.startDate || formData.startDate.trim() === '') {
      errors.startDate = 'Start date is required. Please select a start date.';
      console.error('❌ VALIDATION FAILED: startDate is missing or empty');
      console.error('FormData at validation:', formData);
    }
    
    if (!formData.companyName || formData.companyName.trim() === '') {
      errors.companyName = 'Company name is required.';
    }
    
    if (!formData.designation || formData.designation.trim() === '') {
      errors.designation = 'Designation is required.';
    }
    
    // If there are validation errors, show them and prevent submission
    if (Object.keys(errors).length > 0) {
      console.error('❌ Form validation failed. Errors:', errors);
      console.error('❌ FormData state:', formData);
      setValidationErrors(errors);
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`) || 
                          document.querySelector(`#${firstErrorField}`);
      if (errorElement) {
        (errorElement as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        (errorElement as HTMLElement).focus();
      }
      return;
    }
    
    // Double-check startDate is present before calling onSave
    if (!formData.startDate || formData.startDate.trim() === '') {
      console.error('❌ CRITICAL: startDate validation bypassed! FormData:', formData);
      setValidationErrors({ startDate: 'Start date is required. Please select a start date.' });
      return;
    }
    
    // Final safety check - ensure startDate is present before calling onSave
    const finalFormData = { ...formData };
    if (!finalFormData.startDate || finalFormData.startDate.trim() === '') {
      console.error('❌ CRITICAL: startDate is missing in final check! FormData:', finalFormData);
      setValidationErrors({ startDate: 'Start date is required. Please select a start date.' });
      const startDateInput = document.querySelector('#startDate') as HTMLInputElement;
      if (startDateInput) {
        startDateInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        startDateInput.focus();
      }
      return;
    }
    
    console.log('✅ Form validation passed. Submitting with data:', {
      companyName: finalFormData.companyName,
      designation: finalFormData.designation,
      startDate: finalFormData.startDate,
      endDate: finalFormData.endDate,
      isCurrent: finalFormData.isCurrent,
      fullFormData: finalFormData
    });
    
    setIsSubmitting(true);
    try {
      await onSave(finalFormData);
      // Clear errors on successful save
      setValidationErrors({});
    } catch (error) {
      console.error('Error saving experience:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              {experience ? 'Edit Experience' : 'Add Experience'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
          {/* Basic Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
            <input
              type="text"
              name="companyName"
              id="companyName"
              value={formData.companyName}
              onChange={(e) => {
                handleInputChange('companyName', e.target.value);
                // Clear error when user starts typing
                if (validationErrors.companyName) {
                  setValidationErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.companyName;
                    return newErrors;
                  });
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-[#114373] focus:border-[#114373] ${
                validationErrors.companyName ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {validationErrors.companyName && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.companyName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Experience Type</label>
            <select
              value={formData.experienceType}
              onChange={(e) => handleInputChange('experienceType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#114373] focus:border-[#114373]"
            >
              <option value="work">Formal employment</option>
              <option value="internship">Internship</option>
              <option value="volunteer">Volunteer</option>
            </select>
          </div>

          {/* Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date *</label>
              <input
                type="date"
                name="startDate"
                id="startDate"
                value={formData.startDate}
                onChange={(e) => {
                  handleInputChange('startDate', e.target.value);
                  // Clear error when user selects a date
                  if (validationErrors.startDate) {
                    setValidationErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.startDate;
                      return newErrors;
                    });
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-[#114373] focus:border-[#114373] ${
                  validationErrors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {validationErrors.startDate && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.startDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#114373] focus:border-[#114373]"
                disabled={formData.isCurrent}
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isCurrent}
                  onChange={(e) => handleInputChange('isCurrent', e.target.checked)}
                  className="text-[#114373] focus:ring-[#114373]"
                />
                <span className="text-sm font-medium text-gray-700">
                  {formData.experienceType === 'work' ? 'Current Employment' : 'Currently Active'}
                </span>
              </label>
            </div>
          </div>

          {/* Industry, Designation and Level */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                <div className="relative" ref={industryDropdownRef}>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => {
                    handleInputChange('industry', e.target.value);
                    setIndustrySearchTerm(e.target.value);
                    // Reset level when industry changes (designation is now independent)
                    handleInputChange('level', '');
                  }}
                  placeholder="Search or select industry..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#114373] focus:border-[#114373]"
                  onFocus={() => setShowIndustryDropdown(true)}
                />
                {showIndustryDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {filteredIndustries.length > 0 ? (
                      <>
                        {filteredIndustries.map((industry) => (
                          <button
                            key={industry}
                            type="button"
                            onClick={() => {
                              handleInputChange('industry', industry);
                              setShowIndustryDropdown(false);
                              setIndustrySearchTerm('');
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm font-medium text-gray-900 hover:text-gray-700"
                          >
                            {industry}
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-600 text-center font-medium">
                        No industries found. You can type your own industry.
                      </div>
                    )}
                  </div>
                )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Designation *</label>
                <div className="relative" ref={designationDropdownRef}>
                <input
                  type="text"
                  name="designation"
                  id="designation"
                  value={formData.designation}
                  onChange={(e) => {
                    handleInputChange('designation', e.target.value);
                    setDesignationSearchTerm(e.target.value);
                    // Clear error when user starts typing
                    if (validationErrors.designation) {
                      setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.designation;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="Search or select job title/designation..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-[#114373] focus:border-[#114373] ${
                    validationErrors.designation ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                  onFocus={() => setShowDesignationDropdown(true)}
                />
                {showDesignationDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isLoadingJobTitles ? (
                      <div className="px-3 py-2 text-sm text-gray-600 text-center font-medium">
                        Searching...
                      </div>
                    ) : filteredJobTitles.length > 0 ? (
                      <>
                        {filteredJobTitles.map((jobTitle, index) => (
                          <button
                            key={`${jobTitle}-${index}`}
                            type="button"
                            onClick={() => {
                              handleInputChange('designation', jobTitle);
                              setShowDesignationDropdown(false);
                              setDesignationSearchTerm('');
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm font-medium text-gray-900 hover:text-gray-700"
                          >
                            {jobTitle}
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-600 text-center font-medium">
                        No job titles found. You can type your own designation.
                      </div>
                    )}
                  </div>
                )}
                </div>
                {validationErrors.designation && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.designation}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => handleInputChange('level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#114373] focus:border-[#114373]"
                >
                  <option value="">Select Level</option>
                  {levels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
          </div>

          {/* Company Profile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Description / Brief</label>
            <textarea
              value={formData.companyProfile}
              onChange={(e) => handleInputChange('companyProfile', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#114373] focus:border-[#114373]"
              placeholder="Overview of the employer or sector/industry of the company"
            />
          </div>

          {/* Roles & Responsibilities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Roles & Responsibilities</label>
            <textarea
              value={formData.rolesResponsibilities}
              onChange={(e) => handleInputChange('rolesResponsibilities', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#114373] focus:border-[#114373]"
              placeholder="Enter each role/responsibility on a new line (each line will be displayed as a bullet point)"
            />
            <p className="mt-1 text-xs text-gray-500">Tip: Press Enter to create a new bullet point</p>
          </div>

          {/* Key Achievements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Key Achievements & Accomplishments</label>
            <textarea
              value={formData.keyAchievements}
              onChange={(e) => handleInputChange('keyAchievements', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#114373] focus:border-[#114373]"
              placeholder="List your key achievements and accomplishments"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {experience ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                experience ? 'Update' : 'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
