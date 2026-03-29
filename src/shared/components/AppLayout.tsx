import React, { type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Brain,
  Bell,
  Settings,
  LogOut,
  Menu,
  Activity,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { ROUTES } from '../constants/routes';
import { cn } from '../utils/formatters';

const GRAD = { background: 'linear-gradient(135deg, #524CDE, #AD6FD8)' } as React.CSSProperties;

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: ROUTES.DASHBOARD },
  { label: 'Patients', icon: Users, path: ROUTES.PATIENTS },
  { label: 'Analytics', icon: BarChart3, path: ROUTES.ANALYTICS },
  { label: 'Second Brain', icon: Brain, path: ROUTES.SECOND_BRAIN },
];

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={toggleSidebar} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-white border-r border-gray-100 z-30 flex flex-col transition-all duration-200 shadow-sm',
          sidebarOpen ? 'w-64' : 'w-16',
          'lg:relative lg:translate-x-0',
          !sidebarOpen && '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={GRAD}
          >
            <Activity className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <span className="font-semibold text-gray-900 text-base tracking-tight">HealthTech</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ label, icon: Icon, path }) => {
            const active =
              path === ROUTES.DASHBOARD
                ? location.pathname === path || location.pathname === '/'
                : location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                  active ? 'text-white font-medium shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                )}
                style={active ? GRAD : undefined}
                title={!sidebarOpen ? label : undefined}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-white' : 'text-gray-400')} />
                {sidebarOpen && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 pt-3 border-t border-gray-100 space-y-1">
          <Link
            to={ROUTES.SETTINGS}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
          >
            <Settings className="w-4 h-4 flex-shrink-0 text-gray-400" />
            {sidebarOpen && <span>Settings</span>}
          </Link>

          {sidebarOpen && user && (
            <div className="flex items-center gap-2.5 px-3 py-2.5 mt-1 bg-gray-50 rounded-xl">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-sm"
                style={GRAD}
              >
                {user.displayName?.charAt(0) ?? user.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">
                  {user.displayName ?? user.email}
                </p>
                <p className="text-xs text-gray-400 capitalize">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function Header() {
  const { toggleSidebar, notifications } = useAppStore();
  const { user } = useAuthStore();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const location = useLocation();

  const pageTitle = navItems.find((n) =>
    location.pathname === '/'
      ? n.path === ROUTES.DASHBOARD
      : location.pathname.startsWith(n.path)
  )?.label ?? 'Dashboard';

  return (
    <header className="bg-white border-b border-gray-100 px-6 h-16 flex items-center gap-4 flex-shrink-0 shadow-sm">
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-4 h-4" />
      </button>

      <span className="text-base font-semibold text-gray-900">{pageTitle}</span>

      <div className="ml-auto flex items-center gap-3">
        <button className="relative p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={GRAD}
            />
          )}
        </button>
        {user && (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm cursor-default"
            style={GRAD}
          >
            {user.displayName?.charAt(0) ?? user.email.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F8F9FC' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

