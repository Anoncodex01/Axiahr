'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  FileText,
  Target,
  TrendingUp,
  Briefcase,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Search,
  RefreshCw
} from 'lucide-react';

interface Resource {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  content_type: string;
  display_order: number;
  is_active: boolean;
  target_audience: string;
  link_url: string | null;
  link_text: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  created_by_name: string | null;
  created_by_surname: string | null;
}

export default function ResourcesManagementPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAudience, setFilterAudience] = useState<string>('all');

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminAuthToken');
      const response = await fetch('/api/admin/resources', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setResources(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      const token = localStorage.getItem('adminAuthToken');
      const response = await fetch(`/api/admin/resources/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.success) {
        await fetchResources();
      } else {
        alert(result.error || 'Failed to delete resource');
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete resource');
    }
  };

  const handleToggleActive = async (resource: Resource) => {
    try {
      const token = localStorage.getItem('adminAuthToken');
      const response = await fetch(`/api/admin/resources/${resource.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !resource.is_active })
      });

      const result = await response.json();
      if (result.success) {
        await fetchResources();
      }
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  const handleMoveOrder = async (id: number, direction: 'up' | 'down') => {
    const resource = resources.find(r => r.id === id);
    if (!resource) return;

    const currentIndex = resources.findIndex(r => r.id === id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= resources.length) return;

    const targetResource = resources[newIndex];
    const newOrder = targetResource.display_order;
    const targetNewOrder = resource.display_order;

    try {
      const token = localStorage.getItem('adminAuthToken');
      
      // Update both resources
      await Promise.all([
        fetch(`/api/admin/resources/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ display_order: newOrder })
        }),
        fetch(`/api/admin/resources/${targetResource.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ display_order: targetNewOrder })
        })
      ]);

      await fetchResources();
    } catch (error) {
      console.error('Error moving resource:', error);
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || resource.content_type === filterType;
    const matchesAudience = filterAudience === 'all' || resource.target_audience === filterAudience;
    return matchesSearch && matchesType && matchesAudience;
  });

  const contentTypeOptions = [
    { value: 'general', label: 'General', icon: FileText },
    { value: 'career_tips', label: 'Career Tips', icon: Target },
    { value: 'job_opportunities', label: 'Job Opportunities', icon: Briefcase },
    { value: 'professional_development', label: 'Professional Development', icon: TrendingUp },
    { value: 'success_stories', label: 'Success Stories', icon: CheckCircle }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resources & Hub Management</h1>
            <p className="mt-2 text-gray-600">Manage resources displayed on candidate dashboards</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchResources}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <Link
              href="/admin/resources/new"
              className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Resource
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
          >
            <option value="all">All Content Types</option>
            {contentTypeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={filterAudience}
            onChange={(e) => setFilterAudience(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
          >
            <option value="all">All Audiences</option>
            <option value="candidates">Candidates</option>
            <option value="employers">Employers</option>
            <option value="both">Both</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Resources List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#114373] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resources...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No resources found</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first resource.</p>
          <Link
            href="/admin/resources/new"
            className="px-6 py-3 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Add Resource
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource, index) => (
            <div
              key={resource.id}
              className={`bg-white rounded-lg border-2 overflow-hidden transition-all hover:shadow-lg ${
                resource.is_active ? 'border-gray-200' : 'border-gray-300 opacity-60'
              }`}
            >
              {/* Image */}
              <div className="relative w-full h-48 bg-gray-100">
                {resource.image_url ? (
                  <Image
                    src={resource.image_url}
                    alt={resource.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => handleToggleActive(resource)}
                    className={`p-2 rounded-full backdrop-blur-sm ${
                      resource.is_active
                        ? 'bg-green-500/80 text-white'
                        : 'bg-gray-500/80 text-white'
                    }`}
                    title={resource.is_active ? 'Active' : 'Inactive'}
                  >
                    {resource.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{resource.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{resource.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {contentTypeOptions.find(o => o.value === resource.content_type)?.label || resource.content_type}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                    {resource.target_audience}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMoveOrder(resource.id, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-500">Order: {resource.display_order}</span>
                    <button
                      onClick={() => handleMoveOrder(resource.id, 'down')}
                      disabled={index === filteredResources.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/resources/${resource.id}/edit`}
                      className="p-2 text-[#114373] hover:bg-[#114373]/10 rounded-lg"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

