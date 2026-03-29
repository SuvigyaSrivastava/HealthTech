import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, Moon, Sun } from 'lucide-react';
import { useAppStore } from '../../../store/appStore';
import { cn } from '../../utils/formatters';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/patients': 'Patient Management',
  '/analytics': 'Analytics',
  '/second-brain': 'Second Brain',
  '/settings': 'Settings',
};

export const TopBar: React.FC = () => {
  const { theme, toggleTheme, notifications, sidebarOpen } = useAppStore();
  const location = useLocation();
  const unread = notifications.filter((n) => !n.read).length;

  const title =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith('/patients/') ? 'Patient Details' : 'HealthTech');

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-30 transition-all duration-300',
        sidebarOpen ? 'left-64' : 'left-16'
      )}
    >
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search size={16} className="absolute left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Quick search..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
          />
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="Notifications">
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
