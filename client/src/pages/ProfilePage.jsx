import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  HardHat, 
  Building2,
  Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card, { CardBody, CardHeader } from '../components/ui/Card';

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();

  const [activeTab, setActiveTab] = useState('details'); // details | password
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    ward_no: user?.ward_no || 'Ward-01',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const wards = Array.from({ length: 24 }, (_, i) => `Ward-${String(i + 1).padStart(2, '0')}`);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);
    setIsSaving(true);

    try {
      await updateProfile(profileData);
      setStatusMessage('Profile details updated successfully.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    if (passwordData.newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    setIsSaving(true);

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setStatusMessage('Password updated successfully.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to change password.');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-navy-900 text-white border border-navy-950 shadow-sm';
      case 'officer':
        return 'bg-navy-700 text-white border border-navy-800 shadow-sm';
      default:
        return 'bg-teal-600 text-white border border-teal-700 shadow-sm';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header Profile Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-civic-100 text-civic-700 flex items-center justify-center font-bold text-2xl shadow-inner">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getRoleBadge(user?.role)}`}>
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {user?.email}
            </p>
          </div>
        </div>

        {/* Extended Officer Credentials If Officer */}
        {user?.officer && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <HardHat className="w-4 h-4 text-indigo-600" />
              <span>{user.officer.designation}</span>
            </div>
            <div className="text-[11px] text-indigo-700">
              Department: {user.officer.departmentName}
            </div>
            <div className="text-[10px] font-mono text-indigo-600">
              Badge: {user.officer.badgeNumber}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 space-x-4">
        <button
          onClick={() => { setActiveTab('details'); setStatusMessage(null); setErrorMessage(null); }}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'details'
              ? 'text-civic-600 border-b-2 border-civic-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Profile Details
        </button>
        <button
          onClick={() => { setActiveTab('password'); setStatusMessage(null); setErrorMessage(null); }}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'password'
              ? 'text-civic-600 border-b-2 border-civic-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Security & Password
        </button>
      </div>

      {/* Status alerts */}
      {statusMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tab: Details */}
      {activeTab === 'details' && (
        <Card>
          <CardHeader title="Account Details" subtitle="Update your contact information and municipal ward" />
          <CardBody>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email Address (Immutable)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-100 text-slate-500 rounded-lg cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Designated Ward
                  </label>
                  <select
                    value={profileData.ward_no}
                    onChange={(e) => setProfileData({ ...profileData, ward_no: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-500 focus:outline-none bg-white"
                  >
                    {wards.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Residential / Office Address
                </label>
                <textarea
                  rows={2}
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" isLoading={isSaving} icon={Save}>
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Tab: Change Password */}
      {activeTab === 'password' && (
        <Card>
          <CardHeader title="Security Credentials" subtitle="Update your authentication password" />
          <CardBody>
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  New Password (min 6 characters) *
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-civic-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" isLoading={isSaving} icon={KeyRound}>
                  Update Password
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
