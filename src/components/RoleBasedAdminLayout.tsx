'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3,
  Briefcase,
  Users,
  UserCheck,
  Building2,
  FileText,
  Calendar,
  DollarSign,
  PieChart,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  Shield,
  Crown,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MessageCircle,
  Download,
  Upload,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Target,
  Zap,
  RefreshCw,
  Archive,
  Share2,
  Copy,
  ExternalLink,
  Activity,
  TrendingUp,
  TrendingDown,
  MapPin,
  GraduationCap,
  Star,
  CheckSquare,
  Square,
  ThumbsUp,
  ThumbsDown,
  MessageSquare as MessageSquareIcon,
  Building,
  AlertTriangle,
  Key,
  Lock,
  Unlock,
  UserCog,
  Server,
  BookOpen
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactElement;
  current: boolean;
  submenu: { name: string; href: string; current?: boolean }[];
}

export default function RoleBasedAdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, canAccess, isLoading } = useUser();

  // Initialize expanded menus based on current path
  const getInitialExpandedMenus = () => {
    const menus = ['Dashboard'];
    if (pathname.startsWith('/admin/cv-orders') || 
        pathname.startsWith('/admin/career-counselling') ||
        pathname.startsWith('/admin/billing-management') || 
        pathname.startsWith('/admin/payment-tracking') ||
        pathname.startsWith('/admin/finance')) {
      menus.push('Finance');
    }
    if (pathname.startsWith('/admin/job')) {
      menus.push('Jobs');
    }
    if (pathname.startsWith('/admin/candidates')) {
      menus.push('Candidates');
    }
    if (pathname.startsWith('/admin/employers')) {
      menus.push('Employers');
    }
    if (pathname.startsWith('/admin/interview')) {
      menus.push('Interviews');
    }
    return menus;
  };

  const [expandedMenus, setExpandedMenus] = useState<string[]>(getInitialExpandedMenus());

  // Auto-expand Finance menu if on CV Orders, Career Counselling or other finance pages
  useEffect(() => {
    if (pathname.startsWith('/admin/cv-orders') || 
        pathname.startsWith('/admin/career-counselling') ||
        pathname.startsWith('/admin/billing-management') || 
        pathname.startsWith('/admin/payment-tracking') ||
        pathname.startsWith('/admin/finance')) {
      if (!expandedMenus.includes('Finance')) {
        setExpandedMenus(prev => [...prev, 'Finance']);
      }
    }
  }, [pathname]);

  // Redirect to login if no user (but not if already on login page)
  useEffect(() => {
    if (!isLoading && !user && pathname !== '/admin/login') {
      router.push('/admin/login');
      return;
    }
  }, [user, router, pathname, isLoading]);

  // Check if user can access current path
  useEffect(() => {
    if (user && !canAccess(pathname) && pathname !== '/admin/login') {
      router.push('/admin/dashboard');
    }
  }, [user, pathname, canAccess, router]);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuName)
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  // Get navigation items based on user role and permissions
  const getNavigationItems = (): NavigationItem[] => {
    if (!user) return [];

    // Helper function to check if user has permission
    // Maps legacy permission names to new permission names
    const permissionAliases: { [key: string]: string[] } = {
      'dashboard': ['dashboard', 'view_dashboard'],
      'user_management': ['user_management', 'manage_users'],
      'jobs': ['jobs', 'manage_jobs'],
      'candidates': ['candidates', 'manage_candidates'],
      'employers': ['employers', 'manage_employers'],
      'applications': ['applications', 'manage_applications'],
      'interviews': ['interviews', 'manage_interviews'],
      'finance': ['finance', 'manage_finance', 'view_reports'],
      'analytics': ['analytics', 'view_reports', 'view_analytics'],
      'settings': ['settings', 'edit_settings', 'manage_settings'],
      'system_admin': ['system_admin', 'admin'],
      'all': ['all']
    };
    
    const hasPermission = (permission: string): boolean => {
      if (!user.permissions || !Array.isArray(user.permissions)) return false;
      if (user.permissions.includes('all')) return true;
      
      // Check for the permission and its aliases
      const aliases = permissionAliases[permission] || [permission];
      return aliases.some(alias => user.permissions.includes(alias));
    };

    // Map navigation items to permissions
    const navToPermission: { [key: string]: string[] } = {
      'Dashboard': ['dashboard', 'all'],
      'User Management': ['user_management', 'all'],
      'Jobs': ['jobs', 'all'],
      'Candidates': ['candidates', 'all'],
      'Employers': ['employers', 'all'],
      'Applications': ['applications', 'all'],
      'Interviews': ['interviews', 'all'],
      'Finance': ['finance', 'all'],
      'Analytics': ['analytics', 'all'],
      'Settings': ['settings', 'all'],
      'System Admin': ['system_admin', 'all']
    };

    const allNavigationItems: NavigationItem[] = [
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
        icon: <UserCheck className="w-5 h-5" />,
        current: pathname.startsWith('/admin/candidates'),
        submenu: [
          { name: 'All Candidates', href: '/admin/candidates' }
        ]
      },
      {
        name: 'Employers',
        href: '/admin/employers',
        icon: <Building2 className="w-5 h-5" />,
        current: pathname.startsWith('/admin/employers'),
        submenu: [
          { name: 'All Employers', href: '/admin/employers' }
        ]
      },
      {
        name: 'Applications',
        href: '/admin/application-management',
        icon: <FileText className="w-5 h-5" />,
        current: pathname.startsWith('/admin/application'),
        submenu: [
          { name: 'All Applications', href: '/admin/application-management' }
        ]
      },
      {
        name: 'Interviews',
        href: '/admin/interviews',
        icon: <Calendar className="w-5 h-5" />,
        current: pathname.startsWith('/admin/interview') || pathname.startsWith('/admin/schedule-interviews') || pathname.startsWith('/admin/interviews'),
        submenu: [
          { name: 'Schedule Interviews', href: '/admin/schedule-interviews' },
          { name: 'Interview Calendar', href: '/admin/interview-calendar' },
          { name: 'Interview Feedback', href: '/admin/interview-feedback' }
        ]
      },
      {
        name: 'Employer Tracking',
        href: '/admin/employer-tracking',
        icon: <Activity className="w-5 h-5" />,
        current: pathname.startsWith('/admin/employer-tracking'),
        submenu: []
      },
      {
        name: 'Finance',
        href: '/admin/finance',
        icon: <DollarSign className="w-5 h-5" />,
        current: pathname.startsWith('/admin/finance') || pathname.startsWith('/admin/cv-orders') || pathname.startsWith('/admin/career-counselling') || pathname.startsWith('/admin/billing-management') || pathname.startsWith('/admin/payment-tracking'),
        submenu: [
          { name: 'Revenue Dashboard', href: '/admin/revenue-dashboard' },
          { name: 'Billing Management', href: '/admin/billing-management' },
          { name: 'Payment Tracking', href: '/admin/payment-tracking' },
          { name: 'CV Orders', href: '/admin/cv-orders', current: pathname.startsWith('/admin/cv-orders') },
          { name: 'Career Counselling', href: '/admin/career-counselling', current: pathname.startsWith('/admin/career-counselling') }
        ]
      },
      // Hidden: Analytics
      // {
      //   name: 'Analytics',
      //   href: '/admin/analytics',
      //   icon: <PieChart className="w-5 h-5" />,
      //   current: pathname.startsWith('/admin/analytics'),
      //   submenu: [
      //     { name: 'Performance Metrics', href: '/admin/performance-metrics' },
      //     { name: 'User Analytics', href: '/admin/user-analytics' },
      //     { name: 'Job Analytics', href: '/admin/job-analytics' }
      //   ]
      // },
      // Hidden: Settings
      // {
      //   name: 'Settings',
      //   href: '/admin/settings',
      //   icon: <Settings className="w-5 h-5" />,
      //   current: pathname.startsWith('/admin/settings'),
      //   submenu: [
      //     { name: 'System Settings', href: '/admin/system-settings' },
      //     { name: 'Email Templates', href: '/admin/email-templates' },
      //     { name: 'Notification Settings', href: '/admin/notification-settings' }
      //   ]
      // },
      {
        name: 'Resources & Hub',
        href: '/admin/resources',
        icon: <BookOpen className="w-5 h-5" />,
        current: pathname.startsWith('/admin/resources'),
        submenu: []
      },
      {
        name: 'System Admin',
        href: '/admin/system-admin',
        icon: <Server className="w-5 h-5" />,
        current: pathname.startsWith('/admin/system-admin'),
        submenu: []
      }
    ];

    // Filter navigation based on user role AND permissions
    // First, check role-based defaults
    const roleBasedNav: { [key: string]: string[] } = {
      super_admin: [
        'Dashboard',
        'User Management',
        'Jobs',
        'Candidates',
        'Employers',
        'Applications',
        'Interviews',
        'Employer Tracking',
        'Finance',
        'Analytics',
        'Settings',
      'Resources & Hub',
        'System Admin'
      ],
      admin: [
        'Dashboard',
        'Jobs',
        'Candidates',
        'Employers',
        'Applications',
        'Interviews',
        'Analytics'
      ],
      hr_manager: [
        'Dashboard',
        'Jobs',
        'Candidates',
        'Applications',
        'Interviews'
      ],
      recruiter: [
        'Dashboard',
        'Jobs',
        'Candidates',
        'Applications',
        'Interviews'
      ],
      candidate_manager: [
        'Dashboard',
        'Candidates',
        'Applications'
      ],
      employer_manager: [
        'Dashboard',
        'Employers',
        'Jobs'
      ],
      content_moderator: [
        'Dashboard',
        'Jobs',
        'Content'
      ]
    };

    // Get role-based allowed items
    const roleAllowedNav = roleBasedNav[user.role] || [];
    
    // Filter by permissions - prioritize permissions over role if permissions are set
    // If user has 'all' permission, show all role-based items
    // Otherwise, check each item's required permissions
    const filteredItems = allNavigationItems.filter(item => {
      // Check permissions first
      const requiredPermissions = navToPermission[item.name] || [];
      const hasRequiredPermission = requiredPermissions.some(perm => hasPermission(perm));
      
      // If user has 'all' permission, show all role-based items
      if (hasPermission('all')) {
        return roleAllowedNav.includes(item.name);
      }
      
      // If user has specific permissions set (and not just empty array), use those
      // This allows custom permission-based access regardless of role
      const hasExplicitPermissions = user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0;
      
      if (hasExplicitPermissions) {
        // User has explicit permissions - show items they have permission for OR role-based items
        // This ensures users don't lose access due to permission name mismatches
        return hasRequiredPermission || roleAllowedNav.includes(item.name);
      }
      
      // Fallback to role-based access if no explicit permissions are set
      return roleAllowedNav.includes(item.name);
    });
    
    // Ensure at least Dashboard is always accessible
    if (filteredItems.length === 0) {
      const dashboardItem = allNavigationItems.find(item => item.name === 'Dashboard');
      if (dashboardItem) return [dashboardItem];
    }
    
    return filteredItems;
  };

  const navigation = getNavigationItems();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#114373] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if no user and not on login page
  if (!user && pathname !== '/admin/login') {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#114373]">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-[#114373] font-bold text-sm">A</span>
                </div>
                <span className="ml-2 text-xl font-bold text-white">Axia Admin</span>
              </div>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <div key={item.name}>
                  {item.submenu.length > 0 ? (
                    <div>
                      <button
                        onClick={() => {
                          if (expandedMenus.includes(item.name)) {
                            setExpandedMenus(expandedMenus.filter(menu => menu !== item.name));
                          } else {
                            setExpandedMenus([...expandedMenus, item.name]);
                          }
                        }}
                        className={`${
                          item.current
                            ? 'bg-white/20 text-white'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        } group flex items-center justify-between w-full px-2 py-2 text-base font-medium rounded-md`}
                      >
                        <div className="flex items-center">
                          {item.icon}
                          <span className="ml-3">{item.name}</span>
                        </div>
                        {expandedMenus.includes(item.name) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      {expandedMenus.includes(item.name) && (
                        <div className="ml-8 mt-1 space-y-1">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className={`${
                                pathname === subItem.href
                                  ? 'bg-white/20 text-white'
                                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                              } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`${
                        item.current
                          ? 'bg-white/20 text-white'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                    >
                      {item.icon}
                      <span className="ml-3">{item.name}</span>
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-[#114373] border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-[#114373] font-bold text-sm">A</span>
                </div>
                <span className="ml-2 text-xl font-bold text-white">Axia Admin</span>
              </div>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <div key={item.name}>
                  {item.submenu.length > 0 ? (
                    <div>
                      <button
                        onClick={() => {
                          if (expandedMenus.includes(item.name)) {
                            setExpandedMenus(expandedMenus.filter(menu => menu !== item.name));
                          } else {
                            setExpandedMenus([...expandedMenus, item.name]);
                          }
                        }}
                        className={`${
                          item.current
                            ? 'bg-white/20 text-white'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        } group flex items-center justify-between w-full px-2 py-2 text-sm font-medium rounded-md`}
                      >
                        <div className="flex items-center">
                          {item.icon}
                          <span className="ml-3">{item.name}</span>
                        </div>
                        {expandedMenus.includes(item.name) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      {expandedMenus.includes(item.name) && (
                        <div className="ml-8 mt-1 space-y-1">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className={`${
                                pathname === subItem.href
                                  ? 'bg-white/20 text-white'
                                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                              } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`${
                        item.current
                          ? 'bg-white/20 text-white'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                    >
                      {item.icon}
                      <span className="ml-3">{item.name}</span>
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>
          {user && (
            <div className="flex-shrink-0 flex border-t border-white/20 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-white/70 capitalize">{user.role.replace('_', ' ')}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-auto p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-md"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#114373]"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <main className="flex-1">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
