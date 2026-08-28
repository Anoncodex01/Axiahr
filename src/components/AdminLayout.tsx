'use client';

import { FC, ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  FileText,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Building2,
  Briefcase,
  Award,
  BookOpen,
  Eye,
  Download,
  Plus,
  CheckCircle,
  Clock,
  MapPin,
  DollarSign,
  Star,
  ChevronRight,
  BarChart3,
  Users,
  TrendingUp,
  Target,
  Shield,
  MessageSquare,
  Phone,
  Mail,
  FileCheck,
  Receipt,
  PieChart,
  Activity,
  UserCheck,
  UserX,
  UserPlus,
  TrendingDown,
  AlertCircle,
  CheckSquare,
  XCircle,
  ExternalLink,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Archive,
  Share2,
  Copy,
  Send,
  Save,
  RefreshCw,
  Zap,
  AlertTriangle,
  Info,
  HelpCircle,
  Lock,
  Database,
  Server,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Wifi,
  WifiOff,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  Volume2,
  Volume1,
  VolumeX,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Camera,
  CameraOff,
  Image,
  ImageOff,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FileX,
  FilePlus,
  FileMinus,
  FileEdit,
  FileSearch,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  FolderEdit,
  FolderSearch,
  HardDrive,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudOff,
  CloudDownload,
  CloudUpload
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Dashboard']);
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: <BarChart3 className="w-5 h-5" />,
      current: pathname === '/admin/dashboard',
      submenu: []
    },
    {
      name: 'User Management',
      href: '/admin/user-management',
      icon: <Users className="w-5 h-5" />,
      current: pathname.startsWith('/admin/user-management'),
      submenu: []
    },
    {
      name: 'Jobs',
      href: '/admin/job-posting',
      icon: <Briefcase className="w-5 h-5" />,
      current: pathname.startsWith('/admin/job'),
        submenu: [
          { name: 'Post New Job', href: '/admin/job-posting' },
          { name: 'Job Reviews', href: '/admin/job-reviews' },
          { name: 'All Jobs', href: '/admin/jobs' }
        ]
    },
    {
      name: 'Candidates',
      href: '/admin/candidates',
      icon: <Users className="w-5 h-5" />,
      current: pathname.startsWith('/admin/candidate'),
      submenu: [
        { name: 'All Candidates', href: '/admin/candidates' },
        { name: 'Enhanced Search', href: '/admin/enhanced-search' },
        { name: 'Candidate Search', href: '/admin/candidate-search' },
        { name: 'Saved Searches', href: '/admin/saved-searches' }
      ]
    },
    {
      name: 'Employers',
      href: '/admin/employers',
      icon: <Building2 className="w-5 h-5" />,
      current: pathname.startsWith('/admin/employer'),
      submenu: [
        { name: 'All Employers', href: '/admin/employers' },
        { name: 'Employer Verification', href: '/admin/employer-verification' }
      ]
    },
    {
      name: 'Interviews',
      href: '/admin/interviews',
      icon: <Calendar className="w-5 h-5" />,
      current: pathname.startsWith('/admin/interview') || pathname.startsWith('/admin/placement'),
      submenu: [
        { name: 'All Interviews', href: '/admin/interviews' },
        { name: 'Interview Evaluation', href: '/admin/interview-evaluation' },
        { name: 'Placements', href: '/admin/placements' }
      ]
    },
    {
      name: 'Finance',
      href: '/admin/invoices',
      icon: <DollarSign className="w-5 h-5" />,
      current: pathname.startsWith('/admin/invoice') || pathname.startsWith('/admin/billing'),
      submenu: [
        { name: 'Generate Invoice', href: '/admin/invoices' },
        { name: 'Payment History', href: '/admin/payment-history' },
        { name: 'Billing Management', href: '/admin/billing' }
      ]
    },
    // Hidden: Analytics
    // {
    //   name: 'Analytics',
    //   href: '/admin/reports',
    //   icon: <PieChart className="w-5 h-5" />,
    //   current: pathname.startsWith('/admin/reports'),
    //   submenu: [
    //     { name: 'Dashboard Reports', href: '/admin/reports' },
    //     { name: 'Performance Analytics', href: '/admin/performance' },
    //     { name: 'System Reports', href: '/admin/reports' }
    //   ]
    // },
    {
      name: 'Communication',
      href: '/admin/communications',
      icon: <MessageSquare className="w-5 h-5" />,
      current: pathname.startsWith('/admin/communications'),
      submenu: [
        { name: 'Message Center', href: '/admin/communications' },
        { name: 'Email Templates', href: '/admin/communications' },
        { name: 'Support System', href: '/admin/communications' }
      ]
    },
    // Hidden: Settings
    // {
    //   name: 'Settings',
    //   href: '/admin/settings',
    //   icon: <Settings className="w-5 h-5" />,
    //   current: pathname.startsWith('/admin/settings'),
    //   submenu: [
    //     { name: 'General Settings', href: '/admin/settings' },
    //     { name: 'User Management', href: '/admin/settings' },
    //     { name: 'System Configuration', href: '/admin/settings' }
    //   ]
    // }
  ];

  const handleLogout = () => {
    window.location.href = '/admin/login';
  };

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const isMenuExpanded = (menuName: string) => expandedMenus.includes(menuName);

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#114373] to-[#0d3559] shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:z-auto lg:flex-shrink-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Admin Portal</h1>
                <p className="text-xs text-white/70">Axia HR Advisory</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.submenu && item.submenu.length > 0 ? (
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      item.current
                        ? 'bg-white text-[#114373] shadow-lg'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      {item.name}
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isMenuExpanded(item.name) ? 'rotate-90' : ''}`} />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      item.current
                        ? 'bg-white text-[#114373] shadow-lg'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      {item.name}
                    </div>
                  </Link>
                )}
                
                {/* Submenu */}
                {item.submenu && item.submenu.length > 0 && isMenuExpanded(item.name) && (
                  <div className="ml-6 mt-2 space-y-1">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className="block px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Quick Actions */}
          <div className="px-4 py-4 border-t border-white/10 space-y-2">
            <Link
              href="/admin/candidates/add"
              className="flex items-center gap-3 px-3 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Add Candidate
            </Link>
            <Link
              href="/admin/employers/add"
              className="flex items-center gap-3 px-3 py-2 bg-white text-[#114373] rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Employer
            </Link>
          </div>

          {/* User section */}
          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">AD</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Admin User</p>
                <p className="text-xs text-white/70">admin@axiahr.com</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-white/80 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Top Menu / Quick Access */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/admin/enhanced-search"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                <Search className="w-4 h-4" />
                Candidate Search
              </Link>
              <Link
                href="/admin/job-posting"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Post a Job
              </Link>
              <Link
                href="/admin/communications"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Messages
              </Link>
              <Link
                href="/admin/settings"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
                <Clock className="w-4 h-4" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              {/* Admin Profile */}
              <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-[#114373] to-[#0d3559] rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">AD</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Admin User</span>
                  <p className="text-xs text-gray-500">System Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content - scrollable */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
