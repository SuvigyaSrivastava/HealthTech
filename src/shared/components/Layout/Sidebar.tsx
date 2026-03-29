import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Brain,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Settings,
} from 'lucide-react';
import { useAppStore } from '../../../store/appStore';
import { useAuthStore } from '../../../store/authStore';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../utils/formatters';

const navItems = [
  { to: ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
  { to: ROUTES.PATIENTS, icon: Users, label: 'Patients' },
  { to: ROUTES.ANALYTICS, icon: BarChart3, label: 'Analytics' },
  { to: ROUTES.SECOND_BRAIN, icon: Brain, label: 'Second Brain' },
];

export const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar, notifications } = useAppStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 z-40',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-700 h-16">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <Stethoscope size={18} />
        </div>
        {sidebarOpen && (
          <span className="font-bold text-lg whitespace-nowrap">HealthTech</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors mb-1',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <Icon size={20} className="flex-shrink-0" />
            {sidebarOpen && <span className="whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-slate-700 py-2">
        <button
          onClick={() => {}}
          className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-slate-300 hover:bg-slate-800 w-full relative"
        >
          <Bell size={20} className="flex-shrink-0" />
          {sidebarOpen && <span>Notifications</span>}
          {unread > 0 && (
            <span className="absolute top-2 left-6 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        <button
          onClick={() => {}}
          className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-slate-300 hover:bg-slate-800 w-full"
        >
          <Settings size={20} className="flex-shrink-0" />
          {sidebarOpen && <span>Settings</span>}
        </button>

        {/* User info */}
        {sidebarOpen && user && (
          <div className="px-4 py-3 mx-2 mt-1 rounded-lg bg-slate-800">
            <p className="text-sm font-medium truncate">{user.displayName}</p>
            <p className="text-xs text-slate-400 capitalize">{user.role}</p>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-slate-300 hover:bg-red-900 hover:text-red-200 w-full"
        >
          <LogOut size={20} className="flex-shrink-0" />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 bg-slate-700 hover:bg-slate-600 rounded-full p-1 border-2 border-slate-900"
        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </aside>
  );
};
