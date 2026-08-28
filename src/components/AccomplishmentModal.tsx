'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Accomplishment {
  id?: string;
  type: string;
  title: string;
  description: string;
  year: string;
}

interface AccomplishmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  accomplishment?: Accomplishment | null;
  onSave: (accomplishmentData: Accomplishment) => void;
}

export default function AccomplishmentModal({ isOpen, onClose, accomplishment, onSave }: AccomplishmentModalProps) {
  const [formData, setFormData] = useState<Accomplishment>({
    type: '',
    title: '',
    description: '',
    year: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset when modal closes
      setFormData({
        type: 'award',
        title: '',
        description: '',
        year: ''
      });
      setErrors({});
      return;
    }

    // If no accomplishment provided, reset form to empty values
    if (!accomplishment) {
      setFormData({
        type: '',
        title: '',
        description: '',
        year: ''
      });
      setErrors({});
      return;
    }

    // Populate form with accomplishment data
    setFormData({
      type: accomplishment.type || '',
      title: accomplishment.title || '',
      description: accomplishment.description || '',
      year: accomplishment.year || ''
    });
    setErrors({});
  }, [accomplishment, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.year.trim()) {
      newErrors.year = 'Year is required';
    }

    if (!formData.type.trim()) {
      newErrors.type = 'Type is required';
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

  const handleChange = (field: keyof Accomplishment, value: string) => {
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
            {accomplishment ? 'Edit Accomplishment' : 'Add Accomplishment'}
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
              Type *
            </label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#114373] ${
                errors.type ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Award, Certification, Publication, Patent"
              list="accomplishment-types"
            />
            <datalist id="accomplishment-types">
              <option value="Award" />
              <option value="Certification" />
              <option value="Publication" />
              <option value="Patent" />
            </datalist>
            {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#114373] ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter accomplishment title"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year *
            </label>
            <select
              value={formData.year}
              onChange={(e) => handleChange('year', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#114373] ${
                errors.year ? 'border-red-500' : 'border-gray-300'
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
            {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#114373]"
              placeholder="Describe the accomplishment, its significance, and any relevant details"
            />
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
                  {accomplishment ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                accomplishment ? 'Update Accomplishment' : 'Add Accomplishment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
