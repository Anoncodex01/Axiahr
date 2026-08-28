'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'super_admin' | 'admin' | 'hr_manager' | 'recruiter' | 'candidate_manager' | 'employer_manager' | 'content_moderator';
  permissions: string[];
  department: string;
  avatar?: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  canAccess: (path: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    // Return a default context to prevent crashes
    return {
      user: null,
      isLoading: true,
      login: () => {},
      logout: () => {},
      hasPermission: () => false,
      hasRole: () => false,
      canAccess: () => false
    };
  }
  return context;
};

// Role-based navigation configuration
const roleBasedNavigation = {
  super_admin: [
    'Dashboard',
    'User Management',
    'Jobs',
    'Candidates',
    'Employers',
    'Applications',
    'Interviews',
    'Finance',
    'Analytics',
    'Settings'
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
    'Applications'
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

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token and verify it silently in background
    const verifyAndLoadUser = async () => {
      const token = localStorage.getItem('adminAuthToken');
      const storedUser = localStorage.getItem('admin_user');

      // If we have stored user data, set it immediately (optimistic)
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsLoading(false); // Allow UI to render immediately
        } catch (e) {
          // Invalid stored data, continue with verification
        }
      } else {
        setIsLoading(false); // No stored user, allow UI to render
      }

      // Verify token in background (silently)
      if (token) {
        // Run verification in background without blocking UI
        fetch('/api/admin/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        })
          .then(response => {
          if (response.ok) {
              return response.json();
            }
            throw new Error('Verification failed');
          })
          .then(data => {
            if (data.success && data.user) {
              setUser(data.user);
              // Update stored user data
              localStorage.setItem('admin_user', JSON.stringify(data.user));
            } else {
              // Invalid token, clear storage
              localStorage.removeItem('adminAuthToken');
              localStorage.removeItem('admin_user');
              setUser(null);
            }
          })
          .catch(error => {
            console.error('Error verifying token:', error);
            // On error, clear storage only if we don't have valid stored user
            if (!storedUser) {
            localStorage.removeItem('adminAuthToken');
            localStorage.removeItem('admin_user');
              setUser(null);
            }
          });
      } else {
        // No token, clear any partial data
        if (!storedUser) {
          localStorage.removeItem('admin_user');
        }
        setUser(null);
      }
    };

    verifyAndLoadUser();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('admin_user', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('admin_user');
    localStorage.removeItem('adminAuthToken');
    
    // Optionally call logout API to invalidate token on server
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error during logout:', error);
      // Don't fail logout if API call fails
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.permissions.includes('all')) return true;
    return user.permissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  const canAccess = (path: string): boolean => {
    if (!user) return false;
    
    // Super admin can access everything
    if (user.role === 'super_admin') return true;
    
    // Map paths to navigation items
    const pathToNav: { [key: string]: string } = {
      '/admin/dashboard': 'Dashboard',
      '/admin/user-management': 'User Management',
      '/admin/job-posting': 'Jobs',
      '/admin/job-reviews': 'Jobs',
      '/admin/job-requirements': 'Jobs',
      '/admin/jobs': 'Jobs',
      '/admin/candidates': 'Candidates',
      '/admin/candidate-profiles': 'Candidates',
      '/admin/candidate-reviews': 'Candidates',
      '/admin/employers': 'Employers',
      '/admin/employer-profiles': 'Employers',
      '/admin/employer-reviews': 'Employers',
      '/admin/application-management': 'Applications',
      '/admin/pending-applications': 'Applications',
      '/admin/application-reviews': 'Applications',
      '/admin/interviews': 'Interviews',
      '/admin/schedule-interviews': 'Interviews',
      '/admin/interview-calendar': 'Interviews',
      '/admin/interview-feedback': 'Interviews',
      '/admin/finance': 'Finance',
      '/admin/revenue-dashboard': 'Finance',
      '/admin/billing-management': 'Finance',
      '/admin/payment-tracking': 'Finance',
      '/admin/analytics': 'Analytics',
      '/admin/performance-metrics': 'Analytics',
      '/admin/user-analytics': 'Analytics',
      '/admin/job-analytics': 'Analytics',
      '/admin/settings': 'Settings',
      '/admin/system-settings': 'Settings',
      '/admin/email-templates': 'Settings',
      '/admin/notification-settings': 'Settings'
    };
    
    const navItem = pathToNav[path];
    
    // If path is not in our mapping, allow access (for unimplemented pages)
    if (!navItem) return true;
    
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
      'Settings': ['settings', 'all']
    };
    
    // Helper function to check permissions
    const hasPermission = (permission: string): boolean => {
      if (user.permissions.includes('all')) return true;
      return user.permissions.includes(permission);
    };
    
    // Check permissions first
    const requiredPermissions = navToPermission[navItem] || [];
    const hasRequiredPermission = requiredPermissions.some(perm => hasPermission(perm));
    
    // If user has 'all' permission, check role-based access
    if (hasPermission('all')) {
      const allowedNav = roleBasedNavigation[user.role] || [];
      return allowedNav.includes(navItem);
    }
    
    // If user has specific permissions set, use those
    const hasExplicitPermissions = user.permissions && user.permissions.length > 0;
    
    if (hasExplicitPermissions) {
      // User has explicit permissions - only allow if they have the required permission
      return hasRequiredPermission;
    }
    
    // Fallback to role-based access if no explicit permissions are set
    const allowedNav = roleBasedNavigation[user.role] || [];
    return allowedNav.includes(navItem);
  };

  const value: UserContextType = {
    user,
    isLoading,
    login,
    logout,
    hasPermission,
    hasRole,
    canAccess
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
