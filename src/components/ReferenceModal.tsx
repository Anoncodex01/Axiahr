'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { getAllDesignations, searchDesignations } from '@/utils/designations';

interface ReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  reference?: any;
  onSave: (referenceData: any) => void;
}

export default function ReferenceModal({ isOpen, onClose, reference, onSave }: ReferenceModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    designation: '',
    organization: '',
    email: '',
    phone: '',
    linkedinProfile: '',
    relationship: '',
    isAuthorized: true,
    consentToContact: false
  });
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Designation dropdown state
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);
  const [designationSearchTerm, setDesignationSearchTerm] = useState('');
  const [designations, setDesignations] = useState<string[]>([]);
  const designationDropdownRef = useRef<HTMLDivElement>(null);

  const relationshipOptions = [
    { value: 'manager', label: 'Manager' },
    { value: 'colleague', label: 'Colleague' },
    { value: 'client', label: 'Client' },
    { value: 'mentor', label: 'Mentor' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'other', label: 'Other' }
  ];

  // Filtered designations
  const filteredDesignations = searchDesignations(designations, designationSearchTerm);

  // Load designations data
  useEffect(() => {
    const loadDesignationsData = async () => {
      try {
        const designationList = await getAllDesignations();
        setDesignations(designationList);
      } catch (error) {
        console.error('Error loading designations:', error);
      }
    };
    loadDesignationsData();
  }, []);

  // Handle clicks outside designation dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (designationDropdownRef.current && !designationDropdownRef.current.contains(event.target as Node)) {
        setShowDesignationDropdown(false);
        setDesignationSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      // Reset when modal closes
      setFormData({
        fullName: '',
        designation: '',
        organization: '',
        email: '',
        phone: '',
        linkedinProfile: '',
        relationship: 'manager',
        isAuthorized: true,
        consentToContact: false
      });
      setErrors({});
      setDesignationSearchTerm('');
      return;
    }

    // If no reference provided, reset form to empty values
    if (!reference) {
      setFormData({
        fullName: '',
        designation: '',
        organization: '',
        email: '',
        phone: '',
        linkedinProfile: '',
        relationship: '',
        isAuthorized: true,
        consentToContact: false
      });
      setErrors({});
      setDesignationSearchTerm('');
      return;
    }

    // Populate form with reference data
    setFormData({
      fullName: reference.fullName || reference.full_name || '',
      designation: reference.designation || '',
      organization: reference.organization || '',
      email: reference.email || '',
      phone: reference.phone || '',
      linkedinProfile: reference.linkedinProfile || reference.linkedin_profile || '',
      relationship: reference.relationship || '',
      isAuthorized: reference.isAuthorized !== undefined ? reference.isAuthorized : true,
      consentToContact: reference.consentToContact !== undefined ? reference.consentToContact : false
    });
    setErrors({});
    setDesignationSearchTerm('');
  }, [reference, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { [k: string]: string } = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = 'Full name is required';
    }
    if (!formData.designation.trim()) {
      nextErrors.designation = 'Designation is required';
    }
    if (!formData.organization.trim()) {
      nextErrors.organization = 'Organization is required';
    }
    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Please enter a valid email address';
    }
    if (!formData.relationship.trim()) {
      nextErrors.relationship = 'Relationship is required';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving reference:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {reference ? 'Edit Reference' : 'Add Reference'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                placeholder="Enter full name"
                required
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
            </div>

            {/* Designation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Designation *
              </label>
              <div className="relative" ref={designationDropdownRef}>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, designation: e.target.value }));
                    setDesignationSearchTerm(e.target.value);
                  }}
                  placeholder="Search or select designation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  onFocus={() => setShowDesignationDropdown(true)}
                  required
                />
                {showDesignationDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {filteredDesignations.length > 0 ? (
                      <>
                        {filteredDesignations.map((designation, index) => (
                          <button
                            key={`${designation}-${index}`}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, designation }));
                              setShowDesignationDropdown(false);
                              setDesignationSearchTerm('');
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm font-medium text-gray-900 hover:text-gray-700"
                          >
                            {designation}
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-600 text-center font-medium">
                        No designations found
                      </div>
                    )}
                  </div>
                )}
              </div>
              {errors.designation && <p className="text-red-500 text-sm mt-1">{errors.designation}</p>}
            </div>

            {/* Organization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization *
              </label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                placeholder="e.g., ABC Company"
                required
              />
              {errors.organization && <p className="text-red-500 text-sm mt-1">{errors.organization}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                placeholder="reference@company.com"
                required
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* LinkedIn Profile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn Profile
              </label>
              <input
                type="url"
                value={formData.linkedinProfile}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedinProfile: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                placeholder="https://linkedin.com/in/username"
              />
            </div>
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relationship *
            </label>
            <input
              type="text"
              value={formData.relationship}
              onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
              placeholder="Select or type relationship (e.g., Manager, Colleague, Client)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              required
              list="relationship-options"
            />
            <datalist id="relationship-options">
              {relationshipOptions.map((option) => (
                <option key={option.value} value={option.label} />
              ))}
            </datalist>
            {errors.relationship && <p className="text-red-500 text-sm mt-1">{errors.relationship}</p>}
          </div>

          {/* Authorization and Consent */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAuthorized"
                checked={formData.isAuthorized}
                onChange={(e) => setFormData(prev => ({ ...prev, isAuthorized: e.target.checked }))}
                className="h-4 w-4 text-[#114373] focus:ring-[#114373] border-gray-300 rounded"
              />
              <label htmlFor="isAuthorized" className="ml-2 block text-sm text-gray-700">
                I authorize this person to provide a reference for me
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="consentToContact"
                checked={formData.consentToContact}
                onChange={(e) => setFormData(prev => ({ ...prev, consentToContact: e.target.checked }))}
                className="h-4 w-4 text-[#114373] focus:ring-[#114373] border-gray-300 rounded"
              />
              <label htmlFor="consentToContact" className="ml-2 block text-sm text-gray-700">
                I confirm Axia HR may contact this professional reference when needed
              </label>
            </div>
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
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  {reference ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                reference ? 'Update Reference' : 'Add Reference'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
