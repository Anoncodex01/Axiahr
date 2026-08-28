'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: any;
  onSave: (languageData: any) => void;
}

export default function LanguageModal({ isOpen, onClose, language, onSave }: LanguageModalProps) {
  const [formData, setFormData] = useState({
    languageName: '',
    proficiencyLevel: 'beginner',
    certification: '',
    isNative: false
  });
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Common languages list
  const commonLanguages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
    'Chinese (Mandarin)', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Swahili',
    'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish', 'Czech',
    'Turkish', 'Greek', 'Hebrew', 'Thai', 'Vietnamese', 'Indonesian', 'Malay',
    'Tagalog', 'Bengali', 'Punjabi', 'Tamil', 'Telugu', 'Gujarati', 'Marathi',
    'Kannada', 'Malayalam', 'Odia', 'Assamese', 'Nepali', 'Sinhala', 'Burmese'
  ];

  const proficiencyLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'elementary', label: 'Elementary' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'upper-intermediate', label: 'Upper Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'native', label: 'Native' }
  ];

  useEffect(() => {
    if (isOpen) {
      if (language) {
        setFormData({
          languageName: language.language_name || '',
          proficiencyLevel: language.proficiency_level || 'beginner',
          certification: language.certification || '',
          isNative: language.is_native || false
        });
      } else {
        setFormData({
          languageName: '',
          proficiencyLevel: 'beginner',
          certification: '',
          isNative: false
        });
      }
      setErrors({});
      setShowSuggestions(false);
    } else {
      // Reset form when modal is closed
      setFormData({
        languageName: '',
        proficiencyLevel: 'beginner',
        certification: '',
        isNative: false
      });
      setErrors({});
      setShowSuggestions(false);
    }
  }, [language, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { [k: string]: string } = {};

    if (!formData.languageName.trim()) {
      nextErrors.languageName = 'Language name is required';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await onSave(formData);
      // The modal will be closed by the parent component after successful save
      // No need to reset form data here as the modal will be unmounted
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const handleLanguageSelect = (language: string) => {
    setFormData(prev => ({ ...prev, languageName: language }));
    setShowSuggestions(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {language ? 'Edit Language' : 'Add Language'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Language Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language *
            </label>
            <input
              type="text"
              value={formData.languageName}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, languageName: e.target.value }));
                setShowSuggestions(e.target.value.length > 0);
              }}
              onFocus={() => setShowSuggestions(formData.languageName.length > 0)}
              onBlur={() => {
                // Small delay to allow click on suggestion to register
                setTimeout(() => setShowSuggestions(false), 150);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              placeholder="Enter language name"
              required
            />
            {errors.languageName && <p className="text-red-500 text-sm mt-1">{errors.languageName}</p>}
            
            {/* Common Languages Suggestions */}
            {showSuggestions && formData.languageName.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                {commonLanguages
                  .filter(lang => 
                    lang.toLowerCase().includes(formData.languageName.toLowerCase())
                  )
                  .slice(0, 5)
                  .map((lang, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleLanguageSelect(lang)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm text-gray-900 font-medium"
                    >
                      {lang}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Proficiency Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proficiency Level *
            </label>
            <select
              value={formData.proficiencyLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, proficiencyLevel: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              required
            >
              {proficiencyLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Certification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certification (Optional)
            </label>
            <input
              type="text"
              value={formData.certification}
              onChange={(e) => setFormData(prev => ({ ...prev, certification: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              placeholder="e.g., TOEFL, IELTS, DELE, etc."
            />
          </div>

          {/* Native Language */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isNative"
              checked={formData.isNative}
              onChange={(e) => setFormData(prev => ({ ...prev, isNative: e.target.checked }))}
              className="h-4 w-4 text-[#114373] focus:ring-[#114373] border-gray-300 rounded"
            />
            <label htmlFor="isNative" className="ml-2 block text-sm text-gray-700">
              This is my native language
            </label>
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
              className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559]"
            >
              {language ? 'Update Language' : 'Add Language'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
