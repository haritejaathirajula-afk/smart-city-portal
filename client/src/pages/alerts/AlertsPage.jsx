import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Flame,
  Radio,
  Bell,
  Search,
  Plus,
  RefreshCw,
  Phone,
  ShieldAlert,
  Clock,
  MapPin,
  CheckCircle2,
  X,
  Volume2,
  Info,
  Calendar,
  Layers,
  Building2,
  Trash2,
  Check,
  CheckCheck,
  Inbox,
  Filter,
  Eye,
  ArrowRight,
  ExternalLink,
  Timer
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useLocation, Link } from 'react-router-dom';

export default function AlertsPage() {
  const { user, isAuthenticated, isOfficer, isAdmin } = useAuth();
  const location = useLocation();

  // Tab State: 'alerts' | 'announcements' | 'notifications' | 'helplines'
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'alerts';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Data collections
  const [alerts, setAlerts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Loading & refresh states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [alertStatusFilter, setAlertStatusFilter] = useState('active'); // 'active' | 'expired' | 'all'
  const [notifReadFilter, setNotifReadFilter] = useState('all'); // 'all' | 'unread'

  // Modal State for Officer/Admin Publishing
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishType, setPublishType] = useState('alert'); // 'alert' | 'announcement'
  const [newAlert, setNewAlert] = useState({
    title: '',
    severity: 'WARNING',
    target_ward: 'ALL',
    message: '',
    action_instructions: '',
    expiry_option: '24', // '6' | '12' | '24' | '48' | '168' | 'none' | 'custom'
    custom_expiry: '',
  });
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    category: 'CIVIC_WORK',
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [alertsRes, annRes, notifRes] = await Promise.all([
        api.get(`/alerts?status=${alertStatusFilter}`).catch(() => ({ data: { success: false } })),
        api.get('/announcements').catch(() => ({ data: { success: false } })),
        isAuthenticated
          ? api.get('/notifications').catch(() => ({ data: { success: false } }))
          : Promise.resolve({ data: { success: false } }),
      ]);

      if (alertsRes.data?.success) setAlerts(alertsRes.data.data);
      if (annRes.data?.success) setAnnouncements(annRes.data.data);
      if (notifRes.data?.success) {
        setNotifications(notifRes.data.data.notifications || []);
        setUnreadNotifCount(notifRes.data.data.unreadCount || 0);
      }

      if (isManual) showToast('City alerts & notifications refreshed!');
    } catch (err) {
      console.error('Error fetching alerts/announcements:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated, alertStatusFilter]);

  // Handle Publish Alert / Announcement
  const handlePublish = async (e) => {
    e.preventDefault();
    setFormError('');

    if (publishType === 'alert') {
      if (!newAlert.title || newAlert.title.trim().length < 5) {
        setFormError('Alert headline must be at least 5 characters long.');
        return;
      }
      if (!newAlert.message || newAlert.message.trim().length < 10) {
        setFormError('Emergency message must be at least 10 characters long.');
        return;
      }

      let expiresAt = null;
      if (newAlert.expiry_option === 'custom') {
        if (!newAlert.custom_expiry) {
          setFormError('Please select a custom expiry date and time.');
          return;
        }
        if (new Date(newAlert.custom_expiry).getTime() <= Date.now()) {
          setFormError('Custom expiry time must be in the future.');
          return;
        }
        expiresAt = newAlert.custom_expiry;
      } else if (newAlert.expiry_option !== 'none') {
        const hours = Number(newAlert.expiry_option);
        expiresAt = new Date(Date.now() + hours * 3600000).toISOString();
      }

      setSubmitting(true);
      try {
        const res = await api.post('/alerts', {
          title: newAlert.title.trim(),
          severity: newAlert.severity,
          target_ward: newAlert.target_ward.trim() || 'ALL',
          message: newAlert.message.trim(),
          action_instructions: newAlert.action_instructions.trim() || undefined,
          expires_at: expiresAt || undefined,
        });

        if (res.data?.success) {
          showToast('Emergency alert broadcasted to city network!');
          setPublishModalOpen(false);
          setNewAlert({
            title: '',
            severity: 'WARNING',
            target_ward: 'ALL',
            message: '',
            action_instructions: '',
            expiry_option: '24',
            custom_expiry: '',
          });
          fetchData();
        }
      } catch (err) {
        setFormError(err.message || err.response?.data?.message || 'Failed to broadcast alert');
      } finally {
        setSubmitting(false);
      }
    } else {
      if (!newAnnouncement.title || newAnnouncement.title.trim().length < 5) {
        setFormError('Announcement title must be at least 5 characters long.');
        return;
      }
      if (!newAnnouncement.content || newAnnouncement.content.trim().length < 10) {
        setFormError('Notice content must be at least 10 characters long.');
        return;
      }

      setSubmitting(true);
      try {
        const res = await api.post('/announcements', {
          title: newAnnouncement.title.trim(),
          category: newAnnouncement.category,
          content: newAnnouncement.content.trim(),
        });

        if (res.data?.success) {
          showToast('Municipal civic notice published successfully!');
          setPublishModalOpen(false);
          setNewAnnouncement({ title: '', category: 'CIVIC_WORK', content: '' });
          fetchData();
        }
      } catch (err) {
        setFormError(err.message || err.response?.data?.message || 'Failed to publish announcement');
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Handle Deactivate Alert
  const handleDeactivateAlert = async (alertId) => {
    if (!window.confirm('Mark this emergency alert as resolved and deactivate broadcast?')) return;
    try {
      await api.patch(`/alerts/${alertId}/deactivate`);
      showToast('Emergency alert deactivated');
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to deactivate alert', 'error');
    }
  };

  // Handle Delete Announcement
  const handleDeleteAnnouncement = async (annId) => {
    if (!window.confirm('Delete this announcement permanently?')) return;
    try {
      await api.delete(`/announcements/${annId}`);
      showToast('Announcement deleted');
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to delete announcement', 'error');
    }
  };

  // Notification Operations
  const handleMarkNotificationRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadNotifCount((prev) => Math.max(0, prev - 1));
      showToast('Notification marked as read');
    } catch (err) {
      showToast(err.message || 'Failed to mark notification as read', 'error');
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadNotifCount(0);
      showToast('All notifications marked as read');
    } catch (err) {
      showToast(err.message || 'Failed to mark all as read', 'error');
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      showToast('Notification removed');
    } catch (err) {
      showToast(err.message || 'Failed to delete notification', 'error');
    }
  };

  // Helplines Data
  const emergencyHelplines = [
    { title: 'National Emergency Response', number: '112', desc: 'Single unified emergency line (Police, Fire, Medical)', icon: Radio, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
    { title: 'Police Emergency Response', number: '100', desc: 'Law enforcement, security, immediate disturbance assistance', icon: ShieldAlert, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    { title: 'Fire & Disaster Rescue', number: '101', desc: 'Active fire outbreaks, building collapses, gas leaks', icon: Flame, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
    { title: 'Ambulance & Trauma Service', number: '102 / 108', desc: 'Critical medical care and hospital paramedic transit', icon: Phone, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { title: 'Disaster Management Cell', number: '1077', desc: 'Flash flood, storm surges, cloudburst relief center', icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { title: 'Municipal 24x7 Control Room', number: '1800-11-2026', desc: 'Toll-free municipal utility dispatch and grievance control', icon: Building2, color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
  ];

  // Filtering Logic
  const filteredAlerts = alerts.filter((a) => {
    const matchesSearch =
      !searchQuery ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.target_ward.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = !severityFilter || a.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch =
      !searchQuery ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredNotifications = notifications.filter((n) => {
    if (notifReadFilter === 'unread') return !n.is_read;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Connecting to City Emergency Broadcast Network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-medium animate-bounce ${
            toast.type === 'error'
              ? 'bg-rose-900/95 border-rose-600 text-white'
              : 'bg-emerald-900/95 border-emerald-600 text-white'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-300" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border-b border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  Public Alert & Notification System (PANS)
                </span>
                <span className="text-xs text-slate-400">• Official Broadcasts & In-App Alerts</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Emergency Alerts & Civic Notices
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Real-time critical safety broadcasts, weather warnings, municipal maintenance notices, citizen in-app updates, and emergency helplines.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition-all shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-rose-400' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>

              {(isOfficer || isAdmin) && (
                <button
                  onClick={() => {
                    setPublishModalOpen(true);
                    setFormError('');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-all shadow-lg shadow-rose-600/20"
                >
                  <Plus className="w-4 h-4" />
                  Broadcast Alert / Notice
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto gap-2 mt-6 pt-4 border-t border-slate-800/80">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === 'alerts'
                  ? 'bg-rose-600 text-white font-semibold shadow-md shadow-rose-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Emergency Broadcasts ({alerts.length})
            </button>

            <button
              onClick={() => setActiveTab('announcements')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === 'announcements'
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Bell className="w-4 h-4" />
              Civic Announcements ({announcements.length})
            </button>

            {isAuthenticated && (
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === 'notifications'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Inbox className="w-4 h-4" />
                My In-App Inbox
                {unreadNotifCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                    {unreadNotifCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setActiveTab('helplines')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === 'helplines'
                  ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Phone className="w-4 h-4" />
              Emergency Helplines
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

        {/* ===================== TAB 1: EMERGENCY ALERTS ===================== */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter emergency alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <select
                  value={alertStatusFilter}
                  onChange={(e) => setAlertStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                >
                  <option value="active">Active Broadcasts Only</option>
                  <option value="expired">Expired Alerts Archive</option>
                  <option value="all">All Alerts (Active & Expired)</option>
                </select>

                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                >
                  <option value="">All Severities</option>
                  <option value="DISASTER">DISASTER</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="WARNING">WARNING</option>
                  <option value="INFO">INFO</option>
                </select>

                <span className="text-xs text-slate-400 whitespace-nowrap">
                  Showing {filteredAlerts.length} alerts
                </span>
              </div>
            </div>

            {/* Alerts List */}
            {filteredAlerts.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">No Emergency Alerts Matching Filters</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {alertStatusFilter === 'expired'
                    ? 'No expired emergency broadcasts recorded.'
                    : 'All municipal sectors operating normally with no active disaster alerts.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => {
                  const isDisaster = alert.severity === 'DISASTER';
                  const isCritical = alert.severity === 'CRITICAL';
                  const isWarning = alert.severity === 'WARNING';

                  const badgeClass = isDisaster
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                    : isCritical
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                    : isWarning
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40';

                  const borderClass = isDisaster
                    ? 'border-rose-600/80 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 shadow-rose-900/10'
                    : isCritical
                    ? 'border-orange-600/60 bg-gradient-to-r from-orange-950/30 via-slate-900 to-slate-900'
                    : 'border-slate-800 bg-slate-900';

                  const isExpired = alert.is_expired || (alert.expires_at && new Date(alert.expires_at).getTime() <= Date.now());

                  return (
                    <div
                      key={alert.id}
                      className={`rounded-2xl border p-6 shadow-xl transition-all ${borderClass}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border flex items-center gap-1.5 ${badgeClass}`}>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {alert.severity}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            Target: <strong className="text-white">{alert.target_ward || 'ALL WARDS'}</strong>
                          </span>
                          {isExpired && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                              Expired Broadcast
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 flex items-center gap-3">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {new Date(alert.created_at).toLocaleString()}
                          </span>
                          {alert.expires_at && (
                            <span className="flex items-center gap-1 text-amber-400">
                              <Timer className="w-3.5 h-3.5" />
                              {isExpired ? 'Expired' : `Expires: ${new Date(alert.expires_at).toLocaleDateString()}`}
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                        {alert.title}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {alert.message}
                      </p>

                      {alert.action_instructions && (
                        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                          <Volume2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-0.5">
                              Citizen Action Protocol
                            </span>
                            <p className="text-xs text-slate-300 leading-normal">
                              {alert.action_instructions}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Issued by <strong className="text-slate-400">{alert.author_name || 'Emergency Authority'}</strong>
                        </span>

                        {(isOfficer || isAdmin) && alert.is_active && !isExpired && (
                          <button
                            onClick={() => handleDeactivateAlert(alert.id)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors inline-flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            Resolve & Deactivate
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 2: PUBLIC ANNOUNCEMENTS ===================== */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="CIVIC_WORK">Civic Works & Roads</option>
                  <option value="PUBLIC_HEALTH">Public Health & Sanitation</option>
                  <option value="TRAFFIC">Traffic & Road Diversions</option>
                  <option value="COMMUNITY">Community & Welfare</option>
                  <option value="GENERAL">General Notice</option>
                </select>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  Showing {filteredAnnouncements.length} notices
                </span>
              </div>
            </div>

            {/* Announcements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {ann.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(ann.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-2 leading-snug">
                      {ann.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {ann.content}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Author: <strong className="text-slate-300">{ann.author_name}</strong>
                    </span>

                    {(isOfficer || isAdmin) && (
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-rose-500/10 transition-colors"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB 3: IN-APP NOTIFICATIONS ===================== */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {!isAuthenticated ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto">
                <Inbox className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">Login to View In-App Notifications</h3>
                <p className="text-xs text-slate-400 mt-1 mb-6">
                  Access your personal complaint tracking updates, service bookings, and direct city advisories.
                </p>
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20"
                >
                  Sign In to Portal
                </Link>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Inbox className="w-4 h-4 text-amber-400" />
                      In-App Notification Stream ({notifications.length})
                    </h3>
                    <p className="text-xs text-slate-400">Real-time alerts, grievance progress, and dispatch notices</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
                      <button
                        onClick={() => setNotifReadFilter('all')}
                        className={`px-3 py-1 rounded-md font-medium transition-all ${
                          notifReadFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setNotifReadFilter('unread')}
                        className={`px-3 py-1 rounded-md font-medium transition-all ${
                          notifReadFilter === 'unread' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Unread Only ({unreadNotifCount})
                      </button>
                    </div>

                    {unreadNotifCount > 0 && (
                      <button
                        onClick={handleMarkAllNotificationsRead}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Mark All Read
                      </button>
                    )}
                  </div>
                </div>

                {filteredNotifications.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm">
                      {notifReadFilter === 'unread'
                        ? 'You have caught up with all notifications!'
                        : 'No in-app notifications found.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/60">
                    {filteredNotifications.map((notif) => {
                      const isUnread = !notif.is_read;
                      const typeClass =
                        notif.type === 'ALERT'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : notif.type === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : notif.type === 'WARNING'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/30';

                      return (
                        <div
                          key={notif.id}
                          className={`p-4 transition-colors flex items-start justify-between gap-4 ${
                            isUnread ? 'bg-slate-800/30 hover:bg-slate-800/50' : 'hover:bg-slate-800/20'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {isUnread ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 block animate-pulse"></span>
                              ) : (
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-700 block"></span>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${typeClass}`}>
                                  {notif.type}
                                </span>
                                {notif.entity_type && (
                                  <span className="text-[11px] font-mono text-slate-400">
                                    {notif.entity_type} {notif.entity_id ? `#${notif.entity_id}` : ''}
                                  </span>
                                )}
                                <span className="text-[11px] text-slate-500">
                                  {new Date(notif.created_at).toLocaleString()}
                                </span>
                              </div>

                              <h4 className={`text-sm font-bold ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                                {notif.title}
                              </h4>
                              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                                {notif.message}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {isUnread && (
                              <button
                                onClick={() => handleMarkNotificationRead(notif.id)}
                                title="Mark as read"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteNotification(notif.id)}
                              title="Delete notification"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 4: EMERGENCY HELPLINES ===================== */}
        {activeTab === 'helplines' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {emergencyHelplines.map((line, idx) => {
                const Icon = line.icon;
                return (
                  <div
                    key={idx}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${line.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <a
                          href={`tel:${line.number}`}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                        >
                          <Phone className="w-3.5 h-3.5" /> Call Now
                        </a>
                      </div>

                      <h3 className="text-base font-bold text-white">{line.title}</h3>
                      <div className="text-xl font-extrabold text-amber-400 font-mono mt-1 mb-2">
                        {line.number}
                      </div>
                      <p className="text-xs text-slate-400">{line.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ===================== MODAL: PUBLISH ALERT / ANNOUNCEMENT ===================== */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Broadcast Alert or Public Notice</h3>
              <button onClick={() => setPublishModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            {/* Type selector */}
            <div className="flex gap-2 mt-4 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setPublishType('alert');
                  setFormError('');
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  publishType === 'alert' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                🚨 Emergency Broadcast
              </button>
              <button
                type="button"
                onClick={() => {
                  setPublishType('announcement');
                  setFormError('');
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  publishType === 'announcement' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                📢 Public Civic Notice
              </button>
            </div>

            <form onSubmit={handlePublish} className="mt-4 space-y-3 text-xs">
              {publishType === 'alert' ? (
                <>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Alert Headline * (min 5 chars)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Flash Flood Risk Warning for Low-Lying Wards"
                      value={newAlert.title}
                      onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Severity Tier *</label>
                      <select
                        value={newAlert.severity}
                        onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
                      >
                        <option value="INFO">INFO (Advisory Notice)</option>
                        <option value="WARNING">WARNING (Precautionary)</option>
                        <option value="CRITICAL">CRITICAL (High Hazard)</option>
                        <option value="DISASTER">DISASTER (Emergency Order)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Target Ward(s) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. ALL or Ward 12, Ward 14"
                        value={newAlert.target_ward}
                        onChange={(e) => setNewAlert({ ...newAlert, target_ward: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Broadcast Expiry Schedule</label>
                    <select
                      value={newAlert.expiry_option}
                      onChange={(e) => setNewAlert({ ...newAlert, expiry_option: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
                    >
                      <option value="6">6 Hours (Flash Hazard)</option>
                      <option value="12">12 Hours (Half-Day Precaution)</option>
                      <option value="24">24 Hours (1 Day Default)</option>
                      <option value="48">48 Hours (2 Days)</option>
                      <option value="168">7 Days (Weekly Maintenance)</option>
                      <option value="none">No Expiry (Manual Deactivation Only)</option>
                      <option value="custom">Custom Date & Time</option>
                    </select>
                  </div>

                  {newAlert.expiry_option === 'custom' && (
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Custom Expiry Date & Time *</label>
                      <input
                        type="datetime-local"
                        required
                        value={newAlert.custom_expiry}
                        onChange={(e) => setNewAlert({ ...newAlert, custom_expiry: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Emergency Message * (min 10 chars)</label>
                    <textarea
                      rows="3"
                      required
                      placeholder="Detailed emergency broadcast briefing..."
                      value={newAlert.message}
                      onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Citizen Safety Protocol / Action Instructions</label>
                    <textarea
                      rows="2"
                      placeholder="e.g. Move vehicles to higher ground, avoid flooded underpasses..."
                      value={newAlert.action_instructions}
                      onChange={(e) => setNewAlert({ ...newAlert, action_instructions: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
                    ></textarea>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Announcement Title * (min 5 chars)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Smart LED Streetlight Upgrade on Ring Road Junction"
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Category</label>
                    <select
                      value={newAnnouncement.category}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="CIVIC_WORK">Civic Works & Roads</option>
                      <option value="PUBLIC_HEALTH">Public Health & Sanitation</option>
                      <option value="TRAFFIC">Traffic & Road Diversions</option>
                      <option value="COMMUNITY">Community & Welfare</option>
                      <option value="GENERAL">General Notice</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Notice Content * (min 10 chars)</label>
                    <textarea
                      rows="4"
                      required
                      placeholder="Full public announcement text..."
                      value={newAnnouncement.content}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    ></textarea>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPublishModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 font-semibold rounded-lg transition-all text-white ${
                    publishType === 'alert'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20'
                  }`}
                >
                  {submitting ? 'Broadcasting...' : publishType === 'alert' ? 'Broadcast Emergency Alert' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
