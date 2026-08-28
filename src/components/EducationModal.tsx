'use client';

import { useState, useEffect } from 'react';
import { X, Search, GraduationCap, Building, Calendar, Award } from 'lucide-react';
import { searchUniversities, getCommonFieldsOfStudyAsync } from '@/utils/universities';
import { getAllCategories, getQualificationsByCategory, getSpecializationsForQualification, searchQualifications, searchSpecializations, getAllQualifications } from '@/utils/qualifications';
import { getCountryOptions } from '@/utils/locationData';

interface Education {
  id: string;
  country?: string;
  category?: string;
  degree: string; // Qualification
  specialization: string;
  institute: string; // Institution
  startDate?: string;
  endDate?: string;
  description?: string;
  yearOfPassing?: string; // legacy support
  isHighestQualification?: boolean;
  otherLevel?: string;
}

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  education?: Education | null;
  onSave: (education: Omit<Education, 'id'>) => void;
}

export default function EducationModal({ isOpen, onClose, education, onSave }: EducationModalProps) {
  // Helper function to format date for input field (yyyy-MM-dd)
  const formatDateForInput = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  // Initial state - prioritize database field names (snake_case)
  const [formData, setFormData] = useState({
    country: (education as any)?.country || '',
    category: (education as any)?.category || '',
    degree: (education as any)?.qualification || education?.degree || '',
    specialization: (education as any)?.field_of_study || education?.specialization || '',
    institute: (education as any)?.institution || education?.institute || '',
    startDate: formatDateForInput((education as any)?.start_date || (education as any)?.startDate),
    endDate: formatDateForInput((education as any)?.end_date || (education as any)?.endDate),
    description: (education as any)?.gpa_achievement || (education as any)?.description || '',
  });

  const [showInstitutionDropdown, setShowInstitutionDropdown] = useState(false);
  const [showFieldDropdown, setShowFieldDropdown] = useState(false);
  const [institutionSearchTerm, setInstitutionSearchTerm] = useState('');
  const [fieldSearchTerm, setFieldSearchTerm] = useState('');
  const [institutionResults, setInstitutionResults] = useState<Array<{ iso2: string; name: string; url?: string }>>([]);
  const [fieldResults, setFieldResults] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [loadingQualifications, setLoadingQualifications] = useState(false);
  const [loadingSpecializations, setLoadingSpecializations] = useState(false);
  const [qualificationSearch, setQualificationSearch] = useState('');
  const [showQualificationDropdown, setShowQualificationDropdown] = useState(false);
  const [qualificationSearchResults, setQualificationSearchResults] = useState<string[]>([]);
  const [specializationSearch, setSpecializationSearch] = useState('');
  const [showSpecializationDropdown, setShowSpecializationDropdown] = useState(false);
  const [specializationSearchResults, setSpecializationSearchResults] = useState<string[]>([]);
  // Fixed category options requested
  const fixedCategories = [
    'High School',
    'Diploma',
    "Bachelor's Degree",
    "Master's Degree",
    'PhD',
    'Professional Certification',
    'Other'
  ];
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (institutionSearchTerm.length > 0) {
      // Add debouncing for better performance
      const timeoutId = setTimeout(() => {
        searchUniversities(institutionSearchTerm).then(results => {
          setInstitutionResults(results);
        });
      }, 150); // 150ms debounce
      
      return () => clearTimeout(timeoutId);
    } else {
      setInstitutionResults([]);
    }
  }, [institutionSearchTerm]);

  useEffect(() => {
    if (fieldSearchTerm.length > 0) {
      // Add debouncing for better performance
      const timeoutId = setTimeout(() => {
        getCommonFieldsOfStudyAsync(fieldSearchTerm).then(results => {
          setFieldResults(results);
        });
      }, 150); // 150ms debounce
      
      return () => clearTimeout(timeoutId);
    } else {
      setFieldResults([]);
    }
  }, [fieldSearchTerm]);

  // Search qualifications when user types
  useEffect(() => {
    if (qualificationSearch.length > 0) {
      const timeoutId = setTimeout(() => {
        searchQualifications(qualificationSearch, 50).then(results => {
          setQualificationSearchResults(results);
          console.log(`🔍 Found ${results.length} qualifications matching "${qualificationSearch}"`);
        }).catch(() => setQualificationSearchResults([]));
      }, 200); // 200ms debounce
      
      return () => clearTimeout(timeoutId);
    } else {
      // If no search term, show category-specific qualifications or all if category has none
      if (formData.category && qualifications.length > 0) {
        setQualificationSearchResults(qualifications);
      } else if (formData.category && qualifications.length === 0) {
        // Category selected but no qualifications - show all qualifications for search
        getAllQualifications().then(allQuals => {
          setQualificationSearchResults(allQuals);
        }).catch(() => setQualificationSearchResults([]));
      } else {
        setQualificationSearchResults([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qualificationSearch]);

  // Search specializations when user types
  useEffect(() => {
    if (specializationSearch.length > 0) {
      const timeoutId = setTimeout(() => {
        searchSpecializations(specializationSearch, 50).then(results => {
          setSpecializationSearchResults(results);
          console.log(`🔍 Found ${results.length} specializations matching "${specializationSearch}"`);
        }).catch(() => setSpecializationSearchResults([]));
      }, 200); // 200ms debounce
      
      return () => clearTimeout(timeoutId);
    } else {
      // If no search term, show qualification-specific specializations or all if qualification has none
      if (formData.degree && specializations.length > 0) {
        setSpecializationSearchResults(specializations);
      } else if (formData.degree && specializations.length === 0) {
        // Qualification selected but no specializations - show all specializations for search
        import('@/utils/qualifications').then(({ getAllSpecializations }) => {
          getAllSpecializations().then(allSpecs => {
            setSpecializationSearchResults(allSpecs);
          }).catch(() => setSpecializationSearchResults([]));
        });
      } else {
        setSpecializationSearchResults([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specializationSearch]);

  // Load categories once
  useEffect(() => {
    getAllCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  // When category changes, load qualifications
  useEffect(() => {
    if (formData.category && formData.category !== 'Other') {
      setLoadingQualifications(true);
      getQualificationsByCategory(formData.category)
        .then(quals => {
          setQualifications(quals);
          console.log(`✅ Loaded ${quals.length} qualifications for category: ${formData.category}`, quals);
        })
        .catch((error) => {
          console.error('Error loading qualifications:', error);
          setQualifications([]);
        })
        .finally(() => setLoadingQualifications(false));
    } else if (formData.category === 'Other') {
      // If "Other" is selected, show all available qualifications
      setLoadingQualifications(true);
      getAllCategories()
        .then(categories => {
          const allQuals = categories.flatMap(cat => getQualificationsByCategory(cat));
          Promise.all(allQuals)
            .then(qualArrays => {
              const uniqueQuals = Array.from(new Set(qualArrays.flat()));
              setQualifications(uniqueQuals);
              console.log(`✅ Loaded ${uniqueQuals.length} qualifications for "Other" category`, uniqueQuals);
            })
            .catch((error) => {
              console.error('Error loading all qualifications:', error);
              setQualifications([]);
            })
            .finally(() => setLoadingQualifications(false));
        })
        .catch((error) => {
          console.error('Error loading categories:', error);
          setQualifications([]);
          setLoadingQualifications(false);
        });
    } else {
      // No category selected
      setQualifications([]);
      setSpecializations([]);
      setQualificationSearchResults([]);
    }
    // Only reset downstream selections if we're NOT editing (no education prop with existing values)
    // When editing, we want to preserve the qualification and specialization from the database
    if (!education || (!(education as any)?.qualification && !education?.degree)) {
      setFormData(prev => ({ ...prev, degree: '', specialization: '' }));
      setQualificationSearch('');
      setSpecializationSearch('');
      setSpecializations([]);
    }
  }, [formData.category, education]);

  // Update qualification search results when qualifications change (if no active search)
  useEffect(() => {
    if (!qualificationSearch && formData.category) {
      if (qualifications.length > 0) {
        setQualificationSearchResults(qualifications);
      } else if (formData.category) {
        // Category selected but no qualifications - load all for search capability
        getAllQualifications().then(allQuals => {
          setQualificationSearchResults(allQuals);
        }).catch(() => setQualificationSearchResults([]));
      }
    }
  }, [qualifications, formData.category, qualificationSearch]);

  // When qualification (degree) changes, load specializations
  useEffect(() => {
    if (formData.degree && formData.degree !== 'Other') {
      setLoadingSpecializations(true);
      getSpecializationsForQualification(formData.degree)
        .then(specs => {
          setSpecializations(specs);
          console.log(`✅ Loaded ${specs.length} specializations for qualification: ${formData.degree}`, specs);
        })
        .catch((error) => {
          console.error('Error loading specializations:', error);
          setSpecializations([]);
        })
        .finally(() => setLoadingSpecializations(false));
    } else if (formData.degree === 'Other') {
      // If "Other" is selected, show all available specializations
      setLoadingSpecializations(true);
      getAllCategories()
        .then(categories => {
          const allSpecs = categories.flatMap(cat => 
            getQualificationsByCategory(cat).then(quals => 
              Promise.all(quals.map(qual => getSpecializationsForQualification(qual)))
            )
          );
          Promise.all(allSpecs)
            .then(specArrays => {
              const uniqueSpecs = Array.from(new Set(specArrays.flat().flat()));
              setSpecializations(uniqueSpecs);
              console.log(`✅ Loaded ${uniqueSpecs.length} specializations for "Other" qualification`, uniqueSpecs);
            })
            .catch((error) => {
              console.error('Error loading all specializations:', error);
              setSpecializations([]);
            })
            .finally(() => setLoadingSpecializations(false));
        })
        .catch((error) => {
          console.error('Error loading categories for specializations:', error);
          setSpecializations([]);
          setLoadingSpecializations(false);
        });
    } else {
      // No qualification selected
      setSpecializations([]);
      setSpecializationSearchResults([]);
    }
    // Only reset specialization if we're NOT editing (no education prop with existing values)
    // When editing, we want to preserve the specialization from the database
    if (!education || (!(education as any)?.field_of_study && !education?.specialization)) {
      setFormData(prev => ({ ...prev, specialization: '' }));
      setSpecializationSearch('');
    }
  }, [formData.degree, education]);

  // Update specialization search results when specializations change (if no active search)
  useEffect(() => {
    if (!specializationSearch && formData.degree) {
      if (specializations.length > 0) {
        setSpecializationSearchResults(specializations);
      } else if (formData.degree) {
        // Qualification selected but no specializations - load all for search capability
        import('@/utils/qualifications').then(({ getAllSpecializations }) => {
          getAllSpecializations().then(allSpecs => {
            setSpecializationSearchResults(allSpecs);
          }).catch(() => setSpecializationSearchResults([]));
        });
      }
    }
  }, [specializations, formData.degree, specializationSearch]);

  // Reset form data when modal opens/closes or education changes
  useEffect(() => {
    if (!isOpen) {
      // Reset when modal closes
      setFormData({
        country: '',
        category: '',
        degree: '',
        specialization: '',
        institute: '',
        startDate: '',
        endDate: '',
        description: ''
      });
      setCountrySearch('');
      setQualificationSearch('');
      setSpecializationSearch('');
      return;
    }

    // If no education provided, reset form to empty values
    if (!education) {
      setFormData({
        country: '',
        category: '',
        degree: '',
        specialization: '',
        institute: '',
        startDate: '',
        endDate: '',
        description: ''
      });
      setCountrySearch('');
      setQualificationSearch('');
      setSpecializationSearch('');
      return;
    }

    // Populate form with education data
    // Map all possible field names - database returns snake_case, so check that first
    // Debug: Log the education object to see what we're receiving
    console.log('🔍 EducationModal - Loading education data:', education);
    console.log('🔍 EducationModal - Education keys:', education ? Object.keys(education) : 'no education');
    
    const qualification = (education as any)?.qualification || education?.degree || '';
    const fieldOfStudy = (education as any)?.field_of_study || education?.specialization || '';
    const startDate = formatDateForInput((education as any)?.start_date || (education as any)?.startDate);
    const endDate = formatDateForInput((education as any)?.end_date || (education as any)?.endDate);
    const gpaAchievement = (education as any)?.gpa_achievement || (education as any)?.description || '';
    
    console.log('🔍 EducationModal - Mapped values:', {
      qualification,
      fieldOfStudy,
      startDate,
      endDate,
      gpaAchievement,
      rawQualification: (education as any)?.qualification,
      rawFieldOfStudy: (education as any)?.field_of_study
    });
    
    // Set form data first - this is what displays in the input fields
    setFormData({
      country: (education as any)?.country || '',
      category: (education as any)?.category || '',
      degree: qualification,
      specialization: fieldOfStudy,
      institute: education?.institute || (education as any)?.institution || '',
      startDate: startDate,
      endDate: endDate,
      description: gpaAchievement
    });
    
    // Set search terms for dropdown filtering (not for display - formData is used for display)
    setQualificationSearch(qualification);
    setSpecializationSearch(fieldOfStudy);
    
    console.log('🔍 EducationModal - Form data set:', {
      degree: qualification,
      specialization: fieldOfStudy
    });

    // Initialize country search
    if (education?.country) {
      const countryOption = getCountryOptions().find(c => c.value === education.country);
      setCountrySearch(countryOption?.label || education.country);
    } else {
      setCountrySearch('');
    }
  }, [education, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Save form data directly (no need to normalize "Other" since we removed it)
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {education ? 'Edit Education' : 'Add Education'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Country | Institution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative" onFocus={() => setShowCountryDropdown(true)}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                onBlur={() => setTimeout(() => setShowCountryDropdown(false), 200)}
                onFocus={() => setShowCountryDropdown(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                placeholder="Type to search country..."
              />
              {showCountryDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                  {getCountryOptions()
                    .filter(c => c.label.toLowerCase().includes(countrySearch.toLowerCase()))
                    .map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => {
                          handleInputChange('country', c.label); // Store full country name instead of code
                          setCountrySearch(c.label);
                          setShowCountryDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-50 text-sm ${formData.country === c.label ? 'bg-[#114373] text-white hover:bg-[#0d3559]' : 'text-gray-900 hover:text-gray-700'}`}
                      >
                        {c.label}
                      </button>
                    ))}
                </div>
              )}
              {formData.country && (
                <div className="mt-1 text-xs text-gray-500">
                  Selected: {getCountryOptions().find(c => c.value === formData.country)?.label}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.institute}
                  onChange={(e) => {
                    handleInputChange('institute', e.target.value);
                    setInstitutionSearchTerm(e.target.value);
                    setShowInstitutionDropdown(true);
                  }}
                  onFocus={() => setShowInstitutionDropdown(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  placeholder="University or College name"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              {showInstitutionDropdown && institutionResults.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {institutionResults.map((institution, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        handleInputChange('institute', institution.name);
                        setShowInstitutionDropdown(false);
                        setInstitutionSearchTerm('');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-900 font-medium"
                    >
                      <Building className="w-4 h-4 text-gray-500" />
                      {institution.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Category | Qualification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  handleInputChange('category', e.target.value);
                  console.log('📚 Category selected:', e.target.value);
                }}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-[#114373] transition-all"
              >
                <option value="">Select education category...</option>
                {fixedCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                {categories.filter(c => !fixedCategories.includes(c)).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {formData.category && (
                <p className="mt-1 text-xs text-gray-500">
                  Selected: <span className="font-semibold text-[#114373]">{formData.category}</span>
                </p>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qualification *
                {loadingQualifications && (
                  <span className="ml-2 text-xs text-gray-500">(Loading...)</span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.degree || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setQualificationSearch(value); // For dropdown filtering
                    handleInputChange('degree', value); // Update formData.degree as user types - this is what displays
                    setShowQualificationDropdown(true);
                    // If user clears the search, also clear the selected degree
                    if (!value) {
                      handleInputChange('degree', '');
                    }
                  }}
                  onFocus={() => {
                    setShowQualificationDropdown(true);
                    // If category is selected but no qualifications loaded, load all
                    if (formData.category && qualifications.length === 0 && !qualificationSearch) {
                      getAllQualifications().then(allQuals => {
                        setQualificationSearchResults(allQuals);
                      });
                    } else if (formData.category && qualifications.length > 0 && !qualificationSearch) {
                      setQualificationSearchResults(qualifications);
                    } else if (!formData.category) {
                      // Even without category, allow searching all qualifications
                      getAllQualifications().then(allQuals => {
                        setQualificationSearchResults(allQuals);
                      });
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowQualificationDropdown(false), 200)}
                  placeholder={!formData.category ? "Select category first or type to search" : "Search or select qualification..."}
                  className="w-full px-3 py-2 pr-10 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-[#114373] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loadingQualifications}
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              {showQualificationDropdown && (qualificationSearchResults.length > 0 || qualificationSearch.length > 0) && (
                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {qualificationSearchResults.length > 0 ? (
                    <>
                      {qualificationSearchResults.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => {
                            handleInputChange('degree', q); // This updates formData.degree which displays in input
                            setQualificationSearch(''); // Clear search to show selected value
                            setShowQualificationDropdown(false);
                            console.log('✅ Qualification selected:', q);
                          }}
                          className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-sm ${
                            formData.degree === q 
                              ? 'bg-[#114373] text-white hover:bg-[#0d3559]' 
                              : 'text-gray-900 hover:text-gray-700'
                          }`}
                        >
                          <GraduationCap className="w-4 h-4" />
                          {q}
                        </button>
                      ))}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handleInputChange('degree', qualificationSearch);
                        setShowQualificationDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-900 hover:bg-gray-50"
                    >
                      Use custom qualification: <span className="font-semibold">{qualificationSearch}</span>
                    </button>
                  )}
                </div>
              )}
              {formData.degree && (
                <p className="mt-1 text-xs text-gray-500">
                  Selected: <span className="font-semibold text-[#114373]">{formData.degree}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Specialization | Start Date | End Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialization
                {loadingSpecializations && (
                  <span className="ml-2 text-xs text-gray-500">(Loading...)</span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.specialization || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSpecializationSearch(value); // For dropdown filtering
                    handleInputChange('specialization', value); // Update formData.specialization as user types - this is what displays
                    setShowSpecializationDropdown(true);
                    // If user clears the search, also clear the selected specialization
                    if (!value) {
                      handleInputChange('specialization', '');
                    }
                  }}
                  onFocus={() => {
                    setShowSpecializationDropdown(true);
                    // If qualification is selected but no specializations loaded, load all
                    if (formData.degree && specializations.length === 0 && !specializationSearch) {
                      import('@/utils/qualifications').then(({ getAllSpecializations }) => {
                        getAllSpecializations().then(allSpecs => {
                          setSpecializationSearchResults(allSpecs);
                        });
                      });
                    } else if (formData.degree && specializations.length > 0 && !specializationSearch) {
                      setSpecializationSearchResults(specializations);
                    } else if (!formData.degree) {
                      // Even without qualification, allow searching all specializations
                      import('@/utils/qualifications').then(({ getAllSpecializations }) => {
                        getAllSpecializations().then(allSpecs => {
                          setSpecializationSearchResults(allSpecs);
                        });
                      });
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowSpecializationDropdown(false), 200)}
                  placeholder={!formData.degree ? "Select qualification first or type to search" : "Search or select specialization..."}
                  className="w-full px-3 py-2 pr-10 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-[#114373] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loadingSpecializations}
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              {showSpecializationDropdown && (specializationSearchResults.length > 0 || specializationSearch.length > 0) && (
                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {specializationSearchResults.length > 0 ? (
                    <>
                      {specializationSearchResults.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            handleInputChange('specialization', s); // This updates formData.specialization which displays in input
                            setSpecializationSearch(''); // Clear search to show selected value
                            setShowSpecializationDropdown(false);
                            console.log('✅ Specialization selected:', s);
                          }}
                          className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-sm ${
                            formData.specialization === s 
                              ? 'bg-[#114373] text-white hover:bg-[#0d3559]' 
                              : 'text-gray-900 hover:text-gray-700'
                          }`}
                        >
                          <Award className="w-4 h-4" />
                          {s}
                        </button>
                      ))}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handleInputChange('specialization', specializationSearch);
                        setShowSpecializationDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-900 hover:bg-gray-50"
                    >
                      Use custom specialization: <span className="font-semibold">{specializationSearch}</span>
                    </button>
                  )}
                </div>
              )}
              {formData.specialization && (
                <p className="mt-1 text-xs text-gray-500">
                  Selected: <span className="font-semibold text-[#114373]">{formData.specialization}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#114373] focus:border-[#114373]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#114373] focus:border-[#114373]"
              />
            </div>
          </div>

          {/* GPA/Achievement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">GPA/Achievement</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#114373] focus:border-[#114373]"
              placeholder="Enter each GPA, grade, achievement, honor, or accomplishment on a new line (each line will be displayed as a bullet point)"
            />
            <p className="mt-1 text-xs text-gray-500">Tip: Press Enter to create a new bullet point</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {education ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                education ? 'Update Education' : 'Add Education'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
