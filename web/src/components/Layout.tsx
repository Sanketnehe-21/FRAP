import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Users,
  User,
  Receipt,
  Target,
  FileText,
  Store,
  MessageSquare,
  BarChart3,
  Settings,
  ShieldCheck,
  History,
  LogOut,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const sessionStr = localStorage.getItem('admin-session');
  let adminName = 'Administrator';
  let adminRole = 'PLATFORM_ADMIN';

  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      adminName = session.fullName || 'Admin';
      adminRole = session.systemRole || 'PLATFORM_ADMIN';
    } catch (err) {
      console.error(err);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin-session');
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/families', label: 'Families', icon: Users },
    { to: '/users', label: 'Users', icon: User },
    { to: '/transactions', label: 'Transactions', icon: Receipt },
    { to: '/goals', label: 'Goals', icon: Target },
    { to: '/documents', label: 'Documents', icon: FileText },
    { to: '/merchant-registry', label: 'Merchant Registry', icon: Store },
    { to: '/feedback', label: 'Feedback', icon: MessageSquare },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  // Platform admin only navigation items
  if (adminRole === 'PLATFORM_ADMIN') {
    navItems.push(
      { to: '/admins', label: 'Admin Users', icon: ShieldCheck },
      { to: '/audit-logs', label: 'Audit Logs', icon: History }
    );
  }

  const linkActiveStyle = "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-sm";
  const linkInactiveStyle = "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent transition-all duration-200";

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-45 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex flex-col gap-8 flex-1 overflow-y-auto">
          {/* Logo Brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">FRAP Admin</h1>
                <p className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase">Platform Portal</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden text-zinc-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) => (isActive ? linkActiveStyle : linkInactiveStyle)}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Profile & Logout */}
        <div className="p-4 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col overflow-hidden max-w-[140px]">
              <span className="text-sm font-semibold truncate text-zinc-800 dark:text-zinc-200">{adminName}</span>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 px-1.5 py-0.5 rounded uppercase self-start truncate mt-1">
                {adminRole.replace('_ADMIN', '')}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 font-semibold text-sm transition-all duration-250 shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header (Top Nav) */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-6 lg:justify-end">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden text-zinc-600 dark:text-zinc-400"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            <span>Server Time: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <section className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </section>
      </main>
    </div>
  );
};
