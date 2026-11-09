import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Menu, 
  X, 
  Shield, 
  LogIn, 
  UserPlus, 
  Activity, 
  User, 
  LogOut, 
  HardHat, 
  Globe,
  LayoutDashboard,
  Bell
} from 'lucide-react';
import api, { checkApiHealth } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ServerConfigModal from './ServerConfigModal';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [serverModalOpen, setServerModalOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking'); // checking | online | offline
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isAdmin, isOfficer, isCitizen } = useAuth();
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotifCount(0);
      return;
    }
    let isMounted = true;
    const fetchUnread = () => {
      api.get('/notifications?is_read=false')
        .then((res) => {
          if (isMounted && res.data?.success) {
            setUnreadNotifCount(res.data.data.unreadCount || 0);
          }
        })
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    let isMounted = true;
    checkApiHealth()
      .then(() => {
        if (isMounted) setApiStatus('online');
      })
      .catch(() => {
        if (isMounted) setApiStatus('offline');
      });

    const interval = setInterval(() => {
      checkApiHealth()
        .then(() => {
          if (isMounted) setApiStatus('online');
        })
        .catch(() => {
          if (isMounted) setApiStatus('offline');
        });
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Report Grievance', path: '/report' },
    { name: 'Complaints', path: '/complaints' },
    { name: 'Services', path: '/services' },
    { name: 'Alerts', path: '/alerts' },
    { name: 'Ratings', path: '/feedback' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'City Map', path: '/map' },
  ];

  // Dynamically add role-specific dashboard link
  if (isAuthenticated) {
    if (isAdmin) {
      navLinks.splice(1, 0, { name: 'Admin Console', path: '/admin', highlight: true });
    } else if (isOfficer) {
      navLinks.splice(1, 0, { name: 'Officer Terminal', path: '/officer', highlight: true });
    } else {
      navLinks.splice(1, 0, { name: 'Citizen Dashboard', path: '/citizen/dashboard', highlight: true });
    }
  }

  const getRoleBadgeStyle = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-navy-950 text-white border-navy-700';
      case 'officer':
        return 'bg-teal-900/40 text-teal-300 border-teal-700/50';
      default:
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-navy-900 text-white border-b border-navy-800 shadow-md">
      {/* Top micro-bar for system status */}
      <div className="bg-navy-950 px-4 py-1 text-xs text-slate-400 border-b border-navy-800/80 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span className="font-medium text-slate-300">Official Municipal Redressal Portal</span>
          <span className="hidden sm:inline text-navy-700">|</span>
          <span className="hidden sm:inline text-slate-400">Smart City Service Portal v1.0</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setServerModalOpen(true)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-navy-800 transition-colors cursor-pointer group border border-transparent hover:border-navy-700 text-xs"
            title="Configure Network & Backend Server URL"
          >
            <Activity className="w-3 h-3 text-slate-400 group-hover:text-teal-400" />
            <span className="text-slate-400">Server:</span>
            {apiStatus === 'checking' && (
              <span className="text-amber-400">Checking...</span>
            )}
            {apiStatus === 'online' && (
              <span className="text-teal-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span> Online (MySQL 8)
              </span>
            )}
            {apiStatus === 'offline' && (
              <span className="text-rose-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Standby
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                Smart City <span className="text-teal-400">Portal</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider block text-slate-400 font-medium">
                Municipal Services & Redressal
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-navy-800 text-teal-400 shadow-sm border border-navy-700'
                      : link.highlight
                      ? 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800/80'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/alerts?tab=notifications"
                  className="relative p-2 text-slate-300 hover:text-white hover:bg-navy-800 rounded-lg transition-colors"
                  title="In-App Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm">
                      {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-lg bg-navy-950/80 hover:bg-navy-800 border border-navy-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded-md bg-teal-600 flex items-center justify-center text-white font-bold text-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-white leading-tight max-w-[120px] truncate">
                      {user?.name}
                    </div>
                    <span className={`inline-block text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(user?.role)}`}>
                      {user?.role}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-navy-800 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-navy-800 rounded-lg transition-colors border border-navy-700"
                >
                  <LogIn className="w-4 h-4 text-teal-400" />
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-500 hover:bg-teal-600 rounded-lg shadow-sm transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-navy-800 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-navy-950 border-t border-navy-800 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-navy-800"
            >
              {link.name}
            </Link>
          ))}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setServerModalOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-navy-900 text-slate-200 text-xs font-medium border border-navy-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-teal-400" />
                <span>Network & Server Setup</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                apiStatus === 'online' 
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' 
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {apiStatus === 'online' ? 'Online' : 'Setup URL'}
              </span>
            </button>
          </div>

          <div className="pt-4 border-t border-navy-800">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to="/alerts?tab=notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-200 bg-navy-900 rounded-lg"
                >
                  <span className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-teal-400" />
                    <span>In-App Notifications</span>
                  </span>
                  {unreadNotifCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                      {unreadNotifCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-slate-200 bg-navy-900 rounded-lg"
                >
                  My Profile ({user?.name})
                </Link>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-rose-400 hover:bg-navy-900 rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-semibold text-slate-200 border border-navy-700 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-semibold text-white bg-teal-500 rounded-lg"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Network & Server Connection Modal */}
      <ServerConfigModal 
        isOpen={serverModalOpen} 
        onClose={() => setServerModalOpen(false)} 
        onConfigSaved={() => {
          setApiStatus('checking');
          checkApiHealth()
            .then(() => setApiStatus('online'))
            .catch(() => setApiStatus('offline'));
        }} 
      />
    </header>
  );
}
