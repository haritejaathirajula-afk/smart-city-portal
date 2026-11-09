import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card, { CardBody } from '../components/ui/Card';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    ward_no: 'Ward-01',
    address: '',
  });

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const wards = Array.from({ length: 24 }, (_, i) => `Ward-${String(i + 1).padStart(2, '0')}`);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        ward_no: formData.ward_no,
        address: formData.address,
      });

      navigate('/complaints');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-civic-600 flex items-center justify-center text-white shadow-glow">
            <Building2 className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Citizen Portal Registration
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Create your verified citizen account to submit grievances and track civic services
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <Card className="shadow-lg border-slate-200">
          <CardBody>
            {error && (
              <div className="mb-4 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Aarav Mehta"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="aarav@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Password (min 6 characters) *
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone & Ward Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+91-98765-00000"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Municipal Ward No. *
                  </label>
                  <select
                    name="ward_no"
                    value={formData.ward_no}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-500 focus:outline-none bg-white"
                  >
                    {wards.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Residential Address */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Residential Address
                </label>
                <textarea
                  name="address"
                  rows={2}
                  placeholder="Apartment/House No., Street Name, Landmark"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  size="md"
                  variant="primary"
                  isLoading={isLoading}
                  icon={UserPlus}
                  className="w-full"
                >
                  Create Citizen Account
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Already registered?{' '}
                <Link to="/login" className="font-semibold text-civic-600 hover:underline">
                  Sign In to your account
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
