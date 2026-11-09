import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Menu, 
  X, 
  Home, 
  AlertTriangle, 
  FileText, 
  Truck, 
  Radio, 
  Star, 
  MapPin, 
  BarChart3, 
  User, 
  LogOut, 
  ChevronRight, 
  Shield, 
  HardHat, 
  Layers, 
  Users, 
  Activity, 
  ClipboardList,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

export default function DashboardLayout({ children, activeTab, onTabChange }) {
  const { user, role, logout, isCitizen, isOfficer, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define navigation lists tailored to active role
  const getNavItems = () => {
    if (isAdmin) {
      return [
        { label: 'Admin Overview', path: '/admin', tab: 'overview', icon: Shield },
        { label: 'Citizen & Staff Users', path: '/admin', tab: 'users', icon: Users },
        { label: 'Departments & SLAs', path: '/admin', tab: 'departments', icon: Building2 },
        { label: 'Complaint Triage', path: '/admin', tab: 'complaints', icon: Layers },
        { label: 'Security Audit Logs', path: '/admin', tab: 'audit', icon: Activity },
        { label: 'City Geospatial GIS', path: '/map', icon: MapPin },
        { label: 'City Analytics', path: '/analytics', icon: BarChart3 },
        { label: 'Emergency Alerts', path: '/alerts', icon: Radio },
      ];
    }

    if (isOfficer) {
      return [
        { label: 'Officer Queue', path: '/officer', tab: 'queue', icon: HardHat },
        { label: 'Field Worker Tasks', path: '/officer', tab: 'tasks', icon: ClipboardList },
        { label: 'City Geospatial GIS', path: '/map', icon: MapPin },
        { label: 'Municipal Services', path: '/services', icon: Truck },
        { label: 'Emergency Alerts', path: '/alerts', icon: Radio },
        { label: 'Citizen Ratings', path: '/feedback', icon: Star },
      ];
    }

    // Default: Citizen navigation
    return [
      { label: 'Citizen Dashboard', path: '/citizen/dashboard', icon: Home },
      { label: 'Report Grievance', path: '/report', icon: AlertTriangle, highlight: true },
      { label: 'My Complaints', path: '/complaints', icon: FileText },
      { label: 'Municipal Services', path: '/services', icon: Truck },
      { label: 'Emergency Alerts', path: '/alerts', icon: Radio },
      { label: 'Citizen Ratings', path: '/feedback', icon: Star },
      { label: 'City GIS Map', path: '/map', icon: MapPin },
      { label: 'City Analytics', path: '/analytics', icon: BarChart3 },
    ];
  };

  const navItems = getNavItems();

  const getRoleHeaderInfo = () => {
    if (isAdmin) {
      return {
        badge: 'City Administrator',
        badgeClass: 'bg-navy-950 text-white border-navy-700',
        subtext: 'Central Municipal Governance System',
      };
    }
    if (isOfficer) {
      return {
        badge: user?.officer?.departmentName || 'Municipal Officer',
        badgeClass: 'bg-teal-900/60 text-teal-300 border-teal-700/60',
        subtext: `Badge: ${user?.officer?.badgeNumber || 'PWD-OFF'}`,
      };
    }
    return {
      badge: user?.ward_no || 'Resident Citizen',
      badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      subtext: user?.address || 'Municipal Ward Resident',
    };
  };

  const roleInfo = getRoleHeaderInfo();

  return (
    <div className="min-h-screen bg-canvas flex flex-col lg:flex-row">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Responsive Municipal Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-navy-900 text-white flex flex-col transition-all duration-300 ease-in-out border-r border-navy-800 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-navy-800 bg-navy-950/50">
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-teal-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="font-bold text-sm text-white tracking-tight block">Smart City Portal</span>
                <span className="text-[10px] text-teal-400 font-medium block">Municipal Governance</span>
              </div>
            )}
          </Link>

          {/* Desktop collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Card in Sidebar */}
        {!collapsed && (
          <div className="p-4 border-b border-navy-800 bg-navy-950/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-navy-800 border border-navy-700 flex items-center justify-center text-teal-400 font-bold text-sm shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden flex-1">
                <div className="text-sm font-semibold text-white truncate">{user?.name || 'Authorized User'}</div>
                <div className={`mt-0.5 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${roleInfo.badgeClass}`}>
                  {roleInfo.badge}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isTabActive = item.tab && activeTab === item.tab;
            const isPathActive = location.pathname === item.path && (!item.tab || !activeTab);
            const isActive = isTabActive || isPathActive;

            const handleClick = () => {
              if (item.tab && onTabChange) {
                onTabChange(item.tab);
              }
              setSidebarOpen(false);
            };

            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={handleClick}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-teal-500 text-white font-semibold shadow-sm'
                    : item.highlight
                    ? 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-teal-400' : 'text-slate-400'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-navy-800 bg-navy-950/40 space-y-1">
          <Link
            to="/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-navy-800 transition-colors"
            title={collapsed ? 'Profile' : undefined}
          >
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            {!collapsed && <span className="truncate">My Account Profile</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-rose-300 hover:text-rose-100 hover:bg-rose-950/50 transition-colors"
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Operational Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-navy-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-navy-900 capitalize">{role || 'Municipal'} Portal</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Dashboard Overview</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isCitizen && (
              <Link to="/report">
                <Button size="sm" variant="teal" icon={AlertTriangle}>
                  Report Grievance
                </Button>
              </Link>
            )}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              <span className="text-slate-600 font-medium">{roleInfo.subtext}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Dynamic View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

