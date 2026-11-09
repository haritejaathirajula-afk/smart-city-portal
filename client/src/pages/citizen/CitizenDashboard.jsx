import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  PlusCircle, 
  Search, 
  MapPin, 
  Radio, 
  FileText, 
  Truck, 
  Calendar, 
  ArrowRight, 
  ChevronRight, 
  Filter, 
  RefreshCw, 
  Eye, 
  MessageSquare, 
  ShieldAlert,
  Sparkles,
  Inbox,
  Bell,
  CheckCheck,
  Check,
  Info,
  PhoneCall,
  Map,
  Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import Button from '../../components/ui/Button';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import AlertBanner from '../../components/ui/AlertBanner';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('complaints'); // 'complaints' | 'notifications'
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVE | RESOLVED | REOPENED | REJECTED
  const [notificationFilter, setNotificationFilter] = useState('ALL'); // ALL | UNREAD
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/citizen/dashboard');
      if (response.data?.success) {
        setData(response.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load citizen dashboard data from municipal server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Mark single notification as read
  const handleMarkAsRead = async (notificationId) => {
    setActionLoadingId(notificationId);
    try {
      await api.patch(`/citizen/notifications/${notificationId}/read`);
      setData((prev) => {
        if (!prev) return prev;
        const updatedNotifications = (prev.notifications || []).map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        );
        const unreadCount = updatedNotifications.filter((n) => !n.is_read).length;
        return {
          ...prev,
          notifications: updatedNotifications,
          stats: {
            ...prev.stats,
            unreadNotifications: unreadCount,
          },
        };
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    setMarkingAllRead(true);
    try {
      await api.patch('/citizen/notifications/mark-all-read');
      setData((prev) => {
        if (!prev) return prev;
        const updatedNotifications = (prev.notifications || []).map((n) => ({
          ...n,
          is_read: true,
        }));
        return {
          ...prev,
          notifications: updatedNotifications,
          stats: {
            ...prev.stats,
            unreadNotifications: 0,
          },
        };
      });
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Filter complaints based on status and search query
  const filteredComplaints = (data?.complaints || []).filter((complaint) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (complaint.title || '').toLowerCase().includes(q) ||
      (complaint.tracking_code || '').toLowerCase().includes(q) ||
      (complaint.location_address || '').toLowerCase().includes(q) ||
      (complaint.department_name || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') {
      return ['REPORTED', 'ASSIGNED', 'IN_PROGRESS'].includes(complaint.status);
    }
    if (statusFilter === 'RESOLVED') {
      return ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(complaint.status);
    }
    if (statusFilter === 'REOPENED') {
      return complaint.status === 'REOPENED';
    }
    if (statusFilter === 'REJECTED') {
      return complaint.status === 'REJECTED';
    }
    return true;
  });

  // Filter notifications
  const filteredNotifications = (data?.notifications || []).filter((notif) => {
    if (notificationFilter === 'UNREAD') {
      return !notif.is_read;
    }
    return true;
  });

  const unreadCount = data?.stats?.unreadNotifications ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Error notification if backend probe fails */}
        {error && (
          <AlertBanner
            type="error"
            title="Unable to connect to Municipal API"
            message={error}
            onClose={() => setError(null)}
            action={
              <Button size="sm" variant="outline" onClick={fetchDashboardData} icon={RefreshCw}>
                Retry Connection
              </Button>
            }
          />
        )}

        {/* 1. Welcome & Citizen Header */}
        <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-2xl p-6 sm:p-8 text-white shadow-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-3">
                <Building2 className="w-3.5 h-3.5" />
                <span>Verified Resident Gateway</span>
                <span className="text-navy-400">&bull;</span>
                <span className="text-white font-bold">{user?.ward_no || 'Ward-12'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {user?.name || 'Resident Citizen'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                Track live civic grievance resolution, book essential municipal utilities, and inspect real-time updates from your municipal ward.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="md"
                variant="outline"
                icon={RefreshCw}
                onClick={fetchDashboardData}
                disabled={loading}
                className="bg-navy-900/60 text-white border-navy-700 hover:bg-navy-800"
                title="Refresh dashboard data"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Link to="/report">
                <Button size="md" variant="teal" icon={AlertTriangle} className="shadow-sm">
                  Report New Issue
                </Button>
              </Link>
              <Link to="/services">
                <Button size="md" variant="outline" icon={Truck} className="bg-navy-900/60 text-white border-navy-700 hover:bg-navy-800">
                  Book Utility Service
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 2. Emergency Broadcast Alert Ribbon (If Active) */}
        {data?.alerts && data.alerts.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 text-[10px] font-bold uppercase tracking-wider">
                      {data.alerts[0].severity}
                    </span>
                    <span className="text-xs text-rose-700 font-medium">
                      Target Ward: {data.alerts[0].target_ward}
                    </span>
                    <span className="text-[10px] text-rose-500">
                      &bull; {new Date(data.alerts[0].created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-rose-950">
                    {data.alerts[0].title}
                  </h3>
                  <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                    {data.alerts[0].message}
                  </p>
                  {data.alerts[0].action_instructions && (
                    <p className="text-xs font-semibold text-rose-900 mt-2 bg-rose-100/70 p-2.5 rounded-lg border border-rose-200 flex items-start gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                      <span><strong>Citizen Advisory:</strong> {data.alerts[0].action_instructions}</span>
                    </p>
                  )}
                </div>
              </div>
              <Link to="/alerts" className="self-end sm:self-center shrink-0">
                <Button size="sm" variant="danger" className="text-xs whitespace-nowrap">
                  View All Alerts
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* 3. Metric KPI Cards (5 Cards including Notifications) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card hover>
            <CardBody className="flex items-center gap-3.5 p-4">
              <div className="w-11 h-11 rounded-xl bg-navy-50 text-navy-900 flex items-center justify-center shrink-0 border border-navy-100">
                <FileText className="w-5 h-5 text-navy-800" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Grievances Filed</span>
                <div className="text-xl sm:text-2xl font-extrabold text-navy-900">
                  {data?.stats?.totalComplaints ?? 0}
                </div>
              </div>
            </CardBody>
          </Card>

          <Card hover>
            <CardBody className="flex items-center gap-3.5 p-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">In Progress</span>
                <div className="text-xl sm:text-2xl font-extrabold text-amber-600">
                  {data?.stats?.activeComplaints ?? 0}
                </div>
              </div>
            </CardBody>
          </Card>

          <Card hover>
            <CardBody className="flex items-center gap-3.5 p-4">
              <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Resolved</span>
                <div className="text-xl sm:text-2xl font-extrabold text-teal-600">
                  {data?.stats?.resolvedComplaints ?? 0}
                </div>
              </div>
            </CardBody>
          </Card>

          <Card hover>
            <CardBody className="flex items-center gap-3.5 p-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Services</span>
                <div className="text-xl sm:text-2xl font-extrabold text-blue-600">
                  {data?.stats?.activeServices ?? 0}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* 5th KPI Card: Unread Notifications */}
          <Card 
            hover 
            onClick={() => setActiveTab('notifications')}
            className={`cursor-pointer transition-all ${
              activeTab === 'notifications' ? 'ring-2 ring-teal-500 bg-teal-50/20' : ''
            }`}
          >
            <CardBody className="flex items-center gap-3.5 p-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                unreadCount > 0 
                  ? 'bg-rose-50 text-rose-600 border-rose-200' 
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-500'}`} />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Notifications</span>
                <div className={`text-xl sm:text-2xl font-extrabold ${unreadCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {unreadCount}
                  {unreadCount > 0 && <span className="text-xs font-semibold ml-1 text-rose-500">new</span>}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* 4. Tab Navigation: Grievance Tracking vs Notifications Inbox */}
        <div className="flex items-center border-b border-slate-200 gap-2">
          <button
            onClick={() => setActiveTab('complaints')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'complaints'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-navy-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>My Grievances</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {data?.complaints?.length ?? 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'notifications'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-navy-900'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications Inbox</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* 5. Main Content Grid (8 Columns Left Feed + 4 Columns Right Widgets) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main 8 Columns: Dynamic Tab Content */}
          <div className="lg:col-span-8 space-y-4">
            {/* TAB 1: COMPLAINTS / GRIEVANCES FEED */}
            {activeTab === 'complaints' && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-navy-900">
                      My Submitted Grievances
                    </h2>
                    <p className="text-xs text-slate-500">
                      Live status lifecycle with verified audit history and location coordinates
                    </p>
                  </div>

                  {/* Status Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1 bg-slate-200/60 p-1 rounded-xl text-xs">
                    {['ALL', 'ACTIVE', 'RESOLVED', 'REOPENED', 'REJECTED'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setStatusFilter(filter)}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                          statusFilter === filter
                            ? 'bg-white text-navy-900 shadow-sm'
                            : 'text-slate-600 hover:text-navy-900'
                        }`}
                      >
                        {filter === 'ALL'
                          ? 'All'
                          : filter === 'ACTIVE'
                          ? 'Active'
                          : filter === 'RESOLVED'
                          ? 'Resolved'
                          : filter === 'REOPENED'
                          ? 'Reopened'
                          : 'Rejected'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by Tracking Code, Issue Title, Ward, or Department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-card"
                  />
                </div>

                {/* Complaints Feed List */}
                {loading ? (
                  <LoadingState message="Retrieving municipal grievances from database..." />
                ) : filteredComplaints.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No Grievances Found"
                    description={
                      searchQuery
                        ? 'No complaints match your active search filters.'
                        : 'You have not submitted any grievances in this category yet.'
                    }
                    actionLabel="Report a Grievance"
                    onAction={() => (window.location.href = '/report')}
                    actionIcon={PlusCircle}
                  />
                ) : (
                  <div className="space-y-3">
                    {filteredComplaints.map((complaint) => (
                      <Card key={complaint.id} hover className="border-slate-200">
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5 flex-1">
                            {complaint.photo_url ? (
                              <img
                                src={complaint.photo_url}
                                alt={complaint.title}
                                className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 border border-slate-200">
                                <AlertTriangle className="w-6 h-6 text-teal-600" />
                              </div>
                            )}

                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold text-navy-900 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
                                  {complaint.tracking_code}
                                </span>
                                <PriorityBadge priority={complaint.priority} size="sm" />
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {complaint.department_name}
                                </span>
                              </div>

                              <h4 className="text-sm font-bold text-navy-900 leading-snug">
                                {complaint.title}
                              </h4>

                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-md">{complaint.location_address}</span>
                              </p>

                              {complaint.latest_remark && (
                                <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-start gap-1.5 mt-2">
                                  <MessageSquare className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
                                  <span className="line-clamp-1 italic">
                                    Latest update: {complaint.latest_remark}
                                  </span>
                                </div>
                              )}

                              {complaint.status === 'REJECTED' && complaint.rejection_reason && (
                                <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 mt-2">
                                  <strong>Rejection reason:</strong> {complaint.rejection_reason}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Status & Action Button */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 sm:gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                            <StatusBadge status={complaint.status} size="sm" />
                            <Link to={`/complaints/${complaint.tracking_code}`}>
                              <Button size="sm" variant="outline" className="text-xs" icon={Eye}>
                                Track Lifecycle
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* TAB 2: NOTIFICATIONS INBOX */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-navy-900">
                      Notifications & Alerts Inbox
                    </h2>
                    <p className="text-xs text-slate-500">
                      Real-time updates regarding grievance status changes and municipal announcements
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Unread filter toggle */}
                    <div className="flex items-center bg-slate-200/60 p-1 rounded-xl text-xs">
                      <button
                        onClick={() => setNotificationFilter('ALL')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                          notificationFilter === 'ALL'
                            ? 'bg-white text-navy-900 shadow-sm'
                            : 'text-slate-600 hover:text-navy-900'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setNotificationFilter('UNREAD')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                          notificationFilter === 'UNREAD'
                            ? 'bg-white text-navy-900 shadow-sm'
                            : 'text-slate-600 hover:text-navy-900'
                        }`}
                      >
                        Unread ({unreadCount})
                      </button>
                    </div>

                    {unreadCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={CheckCheck}
                        onClick={handleMarkAllAsRead}
                        disabled={markingAllRead}
                        className="text-xs"
                      >
                        {markingAllRead ? 'Marking...' : 'Mark All Read'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Notifications List */}
                {loading ? (
                  <LoadingState message="Retrieving notifications..." />
                ) : filteredNotifications.length === 0 ? (
                  <EmptyState
                    icon={Inbox}
                    title="No Notifications"
                    description={
                      notificationFilter === 'UNREAD'
                        ? 'You have caught up with all notifications.'
                        : 'No notifications recorded for your citizen profile yet.'
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {filteredNotifications.map((notif) => {
                      const isUnread = !notif.is_read;
                      return (
                        <Card
                          key={notif.id}
                          className={`border transition-all ${
                            isUnread
                              ? 'border-teal-200 bg-teal-50/20'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="p-4 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              {/* Type Icon */}
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                notif.type === 'ALERT'
                                  ? 'bg-rose-100 text-rose-600'
                                  : notif.type === 'WARNING'
                                  ? 'bg-amber-100 text-amber-600'
                                  : notif.type === 'SUCCESS'
                                  ? 'bg-teal-100 text-teal-600'
                                  : 'bg-blue-100 text-blue-600'
                              }`}>
                                {notif.type === 'ALERT' ? (
                                  <ShieldAlert className="w-4 h-4" />
                                ) : notif.type === 'WARNING' ? (
                                  <AlertTriangle className="w-4 h-4" />
                                ) : notif.type === 'SUCCESS' ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <Info className="w-4 h-4" />
                                )}
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-navy-900">
                                    {notif.title}
                                  </h4>
                                  {isUnread && (
                                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                                  )}
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {new Date(notif.created_at).toLocaleString()}
                                  </span>
                                </div>

                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {notif.message}
                                </p>

                                {notif.entity_type === 'COMPLAINT' && (
                                  <div className="pt-1">
                                    <Link
                                      to="/complaints"
                                      className="inline-flex items-center gap-1 text-xs text-teal-600 font-semibold hover:underline"
                                    >
                                      <span>View Related Complaint</span>
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Mark as read button if unread */}
                            {isUnread && (
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={Check}
                                onClick={() => handleMarkAsRead(notif.id)}
                                disabled={actionLoadingId === notif.id}
                                className="text-xs text-slate-500 hover:text-teal-600 shrink-0"
                                title="Mark as read"
                              >
                                {actionLoadingId === notif.id ? 'Updating...' : 'Mark Read'}
                              </Button>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right 4 Columns: Services, Circulars & Ward Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Booked Municipal Services */}
            <Card>
              <CardHeader
                title="Booked Utility Services"
                subtitle="Scheduled doorstep requests"
                action={
                  <Link to="/services" className="text-xs text-teal-600 font-semibold hover:underline">
                    Book Service
                  </Link>
                }
              />
              <CardBody className="p-4 space-y-3">
                {data?.serviceRequests && data.serviceRequests.length > 0 ? (
                  data.serviceRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs hover:border-slate-200 transition-colors"
                    >
                      <div>
                        <span className="font-mono text-[10px] text-slate-400 block">{req.request_code}</span>
                        <h5 className="font-semibold text-navy-900">{req.service_name}</h5>
                        <p className="text-[11px] text-slate-500 mt-0.5">{req.preferred_slot}</p>
                      </div>
                      <StatusBadge status={req.status} size="sm" />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No active utility services booked.
                  </p>
                )}
              </CardBody>
            </Card>

            {/* Ward Announcements / Circulars */}
            <Card>
              <CardHeader
                title="Municipal Circulars"
                subtitle="Official notices and civic schedules"
              />
              <CardBody className="p-4 space-y-3">
                {data?.announcements && data.announcements.length > 0 ? (
                  data.announcements.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 hover:border-slate-200 transition-colors">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                      <h5 className="text-xs font-bold text-navy-900 leading-snug">{item.title}</h5>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No new circulars published.</p>
                )}
              </CardBody>
            </Card>

            {/* Quick Citizen Assistance Card */}
            <Card className="bg-gradient-to-br from-navy-900 to-navy-950 text-white border-navy-800">
              <CardBody className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                  <PhoneCall className="w-4 h-4" />
                  <span>Citizen Assistance</span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  Need Immediate Municipal Support?
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  For urgent public emergencies or water pipeline bursts, dial the Central Municipal Control Room directly.
                </p>
                <div className="p-3 bg-navy-800/80 rounded-xl border border-navy-700 space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">Toll-Free Control Room</div>
                  <div className="text-base font-extrabold text-teal-400">1800-11-2026</div>
                  <div className="text-[10px] text-slate-400">Operating 24/7 &bull; All 24 Municipal Wards</div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link to="/map">
                    <button className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg bg-navy-800 text-slate-200 hover:text-white hover:bg-navy-700 text-xs font-semibold transition-colors">
                      <Map className="w-3.5 h-3.5 text-teal-400" />
                      <span>City GIS Map</span>
                    </button>
                  </Link>
                  <Link to="/feedback">
                    <button className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg bg-navy-800 text-slate-200 hover:text-white hover:bg-navy-700 text-xs font-semibold transition-colors">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <span>Rate Service</span>
                    </button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
