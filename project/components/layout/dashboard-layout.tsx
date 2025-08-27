'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  BookOpen, 
  Home, 
  Search, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Users,
  BarChart3,
  PlusCircle,
  FileText,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: 'admin' | 'librarian' | 'member';
}

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getNavigationItems = () => {
    const commonItems = [
      { href: `/dashboard/${userRole}`, label: 'Dashboard', icon: Home },
      { href: '/catalog', label: 'Book Catalog', icon: Search },
    ];

    switch (userRole) {
      case 'admin':
        return [
          ...commonItems,
          { href: '/dashboard/admin/users', label: 'User Management', icon: Users },
          { href: '/dashboard/admin/books', label: 'Book Management', icon: BookOpen },
          { href: '/dashboard/admin/reports', label: 'Reports', icon: BarChart3 },
          { href: '/dashboard/admin/settings', label: 'System Settings', icon: Settings },
        ];
      
      case 'librarian':
        return [
          ...commonItems,
          { href: '/dashboard/librarian/books', label: 'Manage Books', icon: BookOpen },
          { href: '/dashboard/librarian/transactions', label: 'Transactions', icon: FileText },
          { href: '/dashboard/librarian/members', label: 'Member Info', icon: Users },
          { href: '/dashboard/librarian/overdue', label: 'Overdue Books', icon: AlertTriangle },
        ];
      
      case 'member':
        return [
          ...commonItems,
          { href: '/dashboard/member/borrowed', label: 'My Books', icon: BookOpen },
          { href: '/dashboard/member/history', label: 'Reading History', icon: Calendar },
          { href: '/dashboard/member/profile', label: 'Profile', icon: User },
        ];
      
      default:
        return commonItems;
    }
  };

  const navigationItems = getNavigationItems();

  const Sidebar = () => (
    <div className="h-full bg-white shadow-lg">
      <div className="p-6 border-b">
        <Link href="/" className="flex items-center space-x-2">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">LibraryDn</span>
        </Link>
      </div>
      
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isRootDashboard = item.href === `/dashboard/${userRole}`;
            const isActive = pathname && (
              isRootDashboard
                ? pathname === item.href
                : (pathname === item.href || pathname.startsWith(item.href + '/'))
            );
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-3 rounded-lg transition-colors duration-200 group border-l-4 ${
                  isActive
                    ? 'text-blue-700 bg-blue-50 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-transparent'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-700' : 'group-hover:text-blue-600'}`} />
                <span className={`font-medium ${isActive ? 'text-blue-800' : ''}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500 capitalize">{userRole}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-64 relative">
          <Sidebar />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-gray-900">LibraryDn</span>
            </div>
            <div className="w-8" /> {/* Spacer */}
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}