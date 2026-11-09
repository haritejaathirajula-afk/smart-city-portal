import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, 
  LogIn, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  HardHat, 
  Shield 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card, { CardBody } from '../components/ui/Card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const demoAccounts = [
    {
      role: 'Citizen',
      email: 'citizen@smartcity.gov',
      password: 'Citizen@123',
      label: 'Resident Citizen (Aarav Mehta)',
      badge: 'bg-teal-50 text-teal-800 border-teal-200',
      icon: User,
    },
    {
      role: 'Officer',
      email: 'officer.roads@smartcity.gov',
      password: 'Officer@123',
      label: 'Municipal Officer (PWD)',
      badge: 'bg-navy-50 text-navy-900 border-navy-200',
      icon: HardHat,
    },
    {
      role: 'Administrator',
      email: 'admin@smartcity.gov',
      password: 'Admin@123',
      label: 'City Administrator',
      badge: 'bg-navy-900 text-white border-navy-950',
      icon: Shield,
    },
  ];

  const handleDemoFill = (demo) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in both your email address and password.');
      return;
    }

    setIsLoading(true);

    try {
      const loggedInUser = await login(email, password);
      // Direct user based on role if no specific redirect target
      if (from === '/') {
        const userRole = loggedInUser.role?.toLowerCase();
        if (userRole === 'admin') navigate('/admin');
        else if (userRole === 'officer') navigate('/officer');
        else navigate('/citizen/dashboard');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-civic-600 flex items-center justify-center text-white shadow-glow">
            <Building2 className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Portal Secure Sign-In
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Official Single Sign-On for Citizens, Officers, and Municipal Administrators
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Demo Accounts Quick-Fill Panel */}
        <div className="mb-5 bg-white border border-civic-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-civic-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-civic-600" />
              1-Click Demo Login
            </span>
            <span className="text-[10px] text-slate-400">Click to autofill</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {demoAccounts.map((demo) => {
              const Icon = demo.icon;
              return (
                <button
                  key={demo.role}
                  type="button"
                  onClick={() => handleDemoFill(demo)}
                  className="p-2 text-left rounded-lg border border-slate-200 hover:border-civic-400 hover:bg-civic-50/50 transition-colors text-xs flex flex-col justify-between"
                >
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-800 mb-1">
                    <Icon className="w-3.5 h-3.5 text-civic-600" />
                    <span>{demo.role}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate block">
                    {demo.email.split('@')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Login Card */}
        <Card className="shadow-lg border-slate-200">
          <CardBody>
            {error && (
              <div className="mb-4 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@smartcity.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Password
                  </label>
                  <a href="#forgot" className="text-xs text-civic-600 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  size="md"
                  variant="primary"
                  isLoading={isLoading}
                  icon={LogIn}
                  className="w-full"
                >
                  Sign In to Portal
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Are you a resident citizen without an account?{' '}
                <Link to="/register" className="font-semibold text-civic-600 hover:underline">
                  Register as Citizen
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
