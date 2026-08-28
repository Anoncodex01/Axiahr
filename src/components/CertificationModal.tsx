'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Certification {
  id?: string;
  name: string;
  issuingBody: string;
  yearOfCompletion: string;
  validity?: string;
}

interface CertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  certification?: Certification | null;
  onSave: (certificationData: Certification) => void;
}

export default function CertificationModal({ isOpen, onClose, certification, onSave }: CertificationModalProps) {
  const [formData, setFormData] = useState<Certification>({
    name: '',
    issuingBody: '',
    yearOfCompletion: '',
    validity: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset when modal closes
      setFormData({
        name: '',
        issuingBody: '',
        yearOfCompletion: '',
        validity: ''
      });
      setErrors({});
      return;
    }

    // If no certification provided, reset form to empty values
    if (!certification) {
      setFormData({
        name: '',
        issuingBody: '',
        yearOfCompletion: '',
        validity: ''
      });
      setErrors({});
      return;
    }

    // Populate form with certification data
    setFormData({
      name: certification.name || '',
      issuingBody: certification.issuingBody || '',
      yearOfCompletion: certification.yearOfCompletion || '',
      validity: certification.validity || ''
    });
    setErrors({});
  }, [certification, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Certification name is required';
    }

    if (!formData.issuingBody.trim()) {
      newErrors.issuingBody = 'Issuing body is required';
    }

    if (!formData.yearOfCompletion.trim()) {
      newErrors.yearOfCompletion = 'Year of completion is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      try {
        await onSave(formData);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleChange = (field: keyof Certification, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {certification ? 'Edit Certification' : 'Add Certification'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Certification Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#114373] ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., AWS Certified Developer"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issuing Body *
            </label>
            <input
              type="text"
              value={formData.issuingBody}
              onChange={(e) => handleChange('issuingBody', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#114373] ${
                errors.issuingBody ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Amazon Web Services"
            />
            {errors.issuingBody && <p className="text-red-500 text-sm mt-1">{errors.issuingBody}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year of Completion *
              </label>
              <select
                value={formData.yearOfCompletion}
                onChange={(e) => handleChange('yearOfCompletion', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#114373] ${
                  errors.yearOfCompletion ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select Year</option>
                {Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  );
                })}
              </select>
              {errors.yearOfCompletion && <p className="text-red-500 text-sm mt-1">{errors.yearOfCompletion}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Validity Period
              </label>
              <select
                value={formData.validity || ''}
                onChange={(e) => handleChange('validity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#114373]"
              >
                <option value="">Select Validity</option>
                <option value="Lifetime">Lifetime</option>
                {Array.from({ length: 101 }, (_, i) => {
                  const year = 1950 + i;
                  return (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#114373] text-white rounded-md hover:bg-[#0d3559] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {certification ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                certification ? 'Update Certification' : 'Add Certification'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
