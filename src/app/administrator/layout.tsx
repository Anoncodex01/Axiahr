'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Server,
  FileText,
  AlertTriangle,
  Database,
  Settings,
  Shield,
  HardDrive,
  Network,
  LogOut,
  Menu,
  X,
  BarChart3,
  Activity,
  Lock,
  RefreshCw,
  FileSearch,
  Bell,
  ChevronDown,
  ChevronRight,
  Wifi,
  Terminal,
  Bug,
  Globe,
  Archive,
  Zap,
  Info
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  submenu?: { name: string; href: string }[];
}

export default function AdministratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const handleLogout = () => {
    document.cookie = 'administratorAuthToken=; path=/; max-age=0';
    router.push('/login');
  };

  const toggleSubmenu = (name: string) => {
    setOpenSubmenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/administrator', icon: LayoutDashboard },
    { 
      name: 'Security', 
      href: '/administrator/security', 
      icon: Shield,
      submenu: [
        { name: 'Firewall & Network', href: '/administrator/security/firewall' },
        { name: 'SSH Security', href: '/administrator/security/ssh' },
        { name: 'Malware Protection', href: '/administrator/security/malware' },
        { name: 'Nginx DDoS Protection', href: '/administrator/security/nginx' },
      ]
    },
    { 
      name: 'System Maintenance', 
      href: '/administrator/maintenance', 
      icon: RefreshCw,
      submenu: [
        { name: 'Automatic Updates', href: '/administrator/maintenance/updates' },
        { name: 'Disk Monitoring', href: '/administrator/maintenance/disk' },
        { name: 'Resource Monitoring', href: '/administrator/maintenance/resources' },
      ]
    },
    { name: 'Backups', href: '/administrator/backups', icon: HardDrive },
    { name: 'Maintenance Mode', href: '/administrator/maintenance', icon: Settings },
    { 
      name: 'Monitoring', 
      href: '/administrator/monitoring', 
      icon: Activity,
      submenu: [
        { name: 'PM2 Monitoring', href: '/administrator/monitoring/pm2' },
        { name: 'Health Checks', href: '/administrator/monitoring/health' },
        { name: 'Error Logs', href: '/administrator/monitoring/logs' },
      ]
    },
    { name: 'SSL & HTTPS', href: '/administrator/ssl', icon: Lock },
    { name: 'DNS Management', href: '/administrator/dns', icon: Globe },
    { name: 'Logs & Audit', href: '/administrator/logs', icon: FileText },
    { name: 'Incident Response', href: '/administrator/incidents', icon: AlertTriangle },
    { name: 'Deployment', href: '/administrator/deployment', icon: Server },
    { name: 'Performance', href: '/administrator/performance', icon: BarChart3 },
    { name: 'Database', href: '/administrator/database', icon: Database },
    { name: 'System Info', href: '/administrator/system-info', icon: Info },
    { name: 'Settings', href: '/administrator/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/administrator') {
      return pathname === '/administrator' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const isSubmenuActive = (submenu: { name: string; href: string }[]) => {
    return submenu.some(item => pathname.startsWith(item.href));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo & Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#114373] rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900">Administrator</h1>
                <p className="text-xs text-gray-500">System Control</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const hasSubmenu = item.submenu && item.submenu.length > 0;
                const submenuOpen = openSubmenus[item.name] || (hasSubmenu && isSubmenuActive(item.submenu!));

                return (
                  <div key={item.name}>
                    {hasSubmenu ? (
                      <>
                        <button
                          onClick={() => toggleSubmenu(item.name)}
                          className={`
                            w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors
                            ${active || submenuOpen
                              ? 'bg-[#114373] text-white'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-[#114373]'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5" />
                            {item.name}
                          </div>
                          {submenuOpen ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        {submenuOpen && (
                          <div className="ml-4 mt-1 space-y-1">
                            {item.submenu!.map((subItem) => {
                              const subActive = pathname.startsWith(subItem.href);
                              return (
                                <Link
                                  key={subItem.name}
                                  href={subItem.href}
                                  onClick={() => setSidebarOpen(false)}
                                  className={`
                                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                                    ${subActive
                                      ? 'bg-[#114373]/10 text-[#114373] font-medium'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-[#114373]'
                                    }
                                  `}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                  {subItem.name}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${active
                            ? 'bg-[#114373] text-white'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-[#114373]'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5" />
                        {item.name}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                System Administrator Dashboard
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
