import React, { useState, useEffect } from 'react';
import {
  Truck,
  Droplets,
  Trash2,
  Bug,
  Trees,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  MapPin,
  ArrowRight,
  Plus,
  RefreshCw,
  Search,
  X,
  FileText,
  Building2,
  Ban,
  PhoneCall,
  Eye,
  Copy,
  Check,
  Wrench,
  ShieldAlert,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Link } from 'react-router-dom';

export default function ServicesPage() {
  const { user, isAuthenticated, isOfficer, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'my-requests' | 'officer-queue'
  const [catalog, setCatalog] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  // Search & Filters
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogDeptFilter, setCatalogDeptFilter] = useState('ALL');
  const [queueSearch, setQueueSearch] = useState('');
  const [queueStatusFilter, setQueueStatusFilter] = useState('ALL');

  // Booking Modal State
  const [bookingService, setBookingService] = useState(null);
  const [formData, setFormData] = useState({
    details: '',
    address: '',
    ward_no: 'Ward-01',
    preferred_slot: 'Morning (09:00 AM - 12:00 PM)',
  });
  const [submitting, setSubmitting] = useState(false);

  // Officer Update Modal
  const [updatingRequest, setUpdatingRequest] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('APPROVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updateError, setUpdateError] = useState('');

  // Request Details Inspection Modal
  const [inspectingRequest, setInspectingRequest] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Cancellation Modal State
  const [cancellingRequest, setCancellingRequest] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getServiceIcon = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('water') || n.includes('tanker')) return Droplets;
    if (n.includes('garbage') || n.includes('waste') || n.includes('debris')) return Trash2;
    if (n.includes('fogging') || n.includes('mosquito') || n.includes('pest') || n.includes('sanitation')) return Bug;
    if (n.includes('tree') || n.includes('pruning') || n.includes('park')) return Trees;
    if (n.includes('streetlight') || n.includes('electric') || n.includes('pole')) return Zap;
    if (n.includes('asphalt') || n.includes('road') || n.includes('pothole') || n.includes('trench')) return Wrench;
    return Truck;
  };

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [catalogRes, requestsRes] = await Promise.all([
        api.get('/services/catalog').catch(() => ({ data: { success: false } })),
        isAuthenticated
          ? api.get('/services/requests').catch(() => ({ data: { success: false } }))
          : Promise.resolve({ data: { success: false } }),
      ]);

      if (catalogRes.data?.success) {
        setCatalog(catalogRes.data.data);
      }
      if (requestsRes.data?.success) {
        setRequests(requestsRes.data.data);
      }

      if (isManual) showToast('Services data refreshed!');
    } catch (err) {
      console.error('Error fetching service data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  const handleOpenBooking = (service) => {
    if (!isAuthenticated) {
      showToast('Please login to book a municipal service', 'error');
      return;
    }
    setBookingService(service);
    setFormData({
      details: '',
      address: user?.address || '42, Green Avenue, Ward 12',
      ward_no: user?.ward_no || 'Ward-12',
      preferred_slot: 'Morning (09:00 AM - 12:00 PM)',
    });
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!bookingService) return;

    if (!formData.details || formData.details.trim().length < 5) {
      showToast('Please enter at least 5 characters for instructions / details', 'error');
      return;
    }
    if (!formData.address || formData.address.trim().length < 3) {
      showToast('Please enter a valid street address', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/services/requests', {
        service_category_id: bookingService.id,
        department_id: bookingService.department_id,
        details: formData.details.trim(),
        address: formData.address.trim(),
        ward_no: formData.ward_no,
        preferred_slot: formData.preferred_slot,
      });

      if (res.data?.success) {
        showToast(`Service Request ${res.data.data.request_code} submitted successfully!`);
        setBookingService(null);
        setActiveTab('my-requests');
        fetchData();
      }
    } catch (err) {
      showToast(err.message || err.response?.data?.message || 'Failed to submit service request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancellingRequest) return;
    try {
      const res = await api.patch(`/services/requests/${cancellingRequest.id}/cancel`, {
        reason: cancelReason.trim() || undefined,
      });
      if (res.data?.success) {
        showToast(`Service request ${cancellingRequest.request_code} cancelled`);
        setCancellingRequest(null);
        setCancelReason('');
        fetchData();
      }
    } catch (err) {
      showToast(err.message || err.response?.data?.message || 'Failed to cancel request', 'error');
    }
  };

  const handleOfficerUpdateStatus = async (e) => {
    e.preventDefault();
    if (!updatingRequest) return;
    setUpdateError('');

    if (updateStatus === 'REJECTED' && (!resolutionNotes || resolutionNotes.trim().length < 5)) {
      setUpdateError('Resolution notes (min 5 characters) are required when rejecting a request.');
      return;
    }

    try {
      const res = await api.patch(`/services/requests/${updatingRequest.id}/status`, {
        status: updateStatus,
        resolution_notes: resolutionNotes.trim() || undefined,
      });
      if (res.data?.success) {
        showToast(`Request ${updatingRequest.request_code} marked as ${updateStatus}`);
        setUpdatingRequest(null);
        setResolutionNotes('');
        fetchData();
      }
    } catch (err) {
      setUpdateError(err.message || err.response?.data?.message || 'Failed to update request status');
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'APPROVED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'IN_PROGRESS':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'UNDER_REVIEW':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'SUBMITTED':
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  // Filtered catalog
  const filteredCatalog = catalog.filter((svc) => {
    const matchesSearch =
      !catalogSearch ||
      svc.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      svc.description.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      svc.department_name.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchesDept =
      catalogDeptFilter === 'ALL' ||
      svc.department_code === catalogDeptFilter ||
      svc.department_id === Number(catalogDeptFilter);
    return matchesSearch && matchesDept;
  });

  // Filtered requests (for Citizen view or Officer view)
  const citizenRequests = requests.filter((r) => r.citizen_id === user?.id);
  const queueRequests = requests.filter((r) => {
    const matchesSearch =
      !queueSearch ||
      r.request_code.toLowerCase().includes(queueSearch.toLowerCase()) ||
      r.details.toLowerCase().includes(queueSearch.toLowerCase()) ||
      r.address.toLowerCase().includes(queueSearch.toLowerCase()) ||
      (r.citizen_name && r.citizen_name.toLowerCase().includes(queueSearch.toLowerCase()));
    const matchesStatus = queueStatusFilter === 'ALL' || r.status === queueStatusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Loading Municipal Service Directory...</p>
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
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-b border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  <Truck className="w-3.5 h-3.5" />
                  On-Demand Municipal Services
                </span>
                <span className="text-xs text-slate-400">• Scheduled Civic Utility Booking</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Municipal Services & Utility Bookings
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Book municipal drinking water tankers, bulk debris pickup, vector fogging, arborist branch pruning, and emergency pothole restoration directly to your neighborhood.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition-all shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Navigation Tab Bar */}
          <div className="flex overflow-x-auto gap-2 mt-6 pt-4 border-t border-slate-800/80">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === 'catalog'
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Truck className="w-4 h-4" />
              Service Catalog ({catalog.length})
            </button>

            {isAuthenticated && (
              <button
                onClick={() => setActiveTab('my-requests')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === 'my-requests'
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <FileText className="w-4 h-4" />
                My Requests ({citizenRequests.length})
              </button>
            )}

            {(isOfficer || isAdmin) && (
              <button
                onClick={() => setActiveTab('officer-queue')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === 'officer-queue'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Department Dispatch Queue ({requests.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

        {/* ===================== TAB 1: SERVICE CATALOG ===================== */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search utility services or department..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400 whitespace-nowrap">Filter Dept:</span>
                <select
                  value={catalogDeptFilter}
                  onChange={(e) => setCatalogDeptFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 w-full sm:w-auto"
                >
                  <option value="ALL">All Departments</option>
                  <option value="WSS">Water Supply (WSS)</option>
                  <option value="SWM">Waste Management (SWM)</option>
                  <option value="HLT">Health & Sanitation (HLT)</option>
                  <option value="PRK">Parks & Horticulture (PRK)</option>
                  <option value="PWD">Roads & PWD (PWD)</option>
                  <option value="ELE">Electrical & Lighting (ELE)</option>
                </select>
              </div>
            </div>

            {/* Catalog Grid */}
            {filteredCatalog.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                <Info className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">No Municipal Services Found</h3>
                <p className="text-xs text-slate-400 mt-1">Try clearing your search query or selecting "All Departments".</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCatalog.map((service) => {
                  const Icon = getServiceIcon(service.name);
                  const feeText = Number(service.fee) > 0 ? `₹${service.fee}` : 'Free Civic Service';

                  return (
                    <div
                      key={service.id}
                      className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Icon className="w-6 h-6" />
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              Number(service.fee) > 0
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {feeText}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
                          {service.department_name}
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                          {service.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                          {service.description}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-800/80">
                        <div className="flex items-center justify-between mb-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            Turnaround: <strong className="text-slate-200">{service.estimated_days} Days</strong>
                          </span>
                          <span className="text-emerald-400 font-medium">All Wards Eligible</span>
                        </div>

                        <button
                          onClick={() => handleOpenBooking(service)}
                          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Book Service Request
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 2: MY REQUESTS (CITIZEN) ===================== */}
        {activeTab === 'my-requests' && (
          <div className="space-y-6">
            {citizenRequests.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">No Service Requests Logged</h3>
                <p className="text-xs text-slate-400 mt-1 mb-6">
                  You haven't requested any municipal tankers, waste clearance, or pest fogging services yet.
                </p>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20"
                >
                  Browse Service Catalog
                </button>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">My Submitted Service Bookings ({citizenRequests.length})</h3>
                  <span className="text-xs text-slate-400">Real-time status updates from municipal dispatch</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950/60 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-5 py-3">Tracking Code</th>
                        <th className="px-5 py-3">Service & Department</th>
                        <th className="px-5 py-3">Slot & Address</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {citizenRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-xs font-bold text-blue-400">{req.request_code}</span>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {new Date(req.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs">
                            <div className="font-semibold text-white">{req.service_name}</div>
                            <div className="text-slate-400">{req.department_name}</div>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-300">
                            <div className="font-medium text-slate-200">{req.preferred_slot || 'Anytime'}</div>
                            <div className="text-slate-400 truncate max-w-xs">{req.address} ({req.ward_no})</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(req.status)}`}>
                              {req.status}
                            </span>
                            {req.resolution_notes && (
                              <div className="text-[11px] text-slate-400 mt-1 max-w-xs truncate italic">
                                "{req.resolution_notes}"
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-2">
                            <button
                              onClick={() => setInspectingRequest(req)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> Details
                            </button>
                            {['SUBMITTED', 'UNDER_REVIEW'].includes(req.status) && (
                              <button
                                onClick={() => setCancellingRequest(req)}
                                className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium rounded-lg border border-rose-500/30 transition-colors inline-flex items-center gap-1"
                              >
                                <Ban className="w-3.5 h-3.5" /> Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 3: OFFICER / ADMIN QUEUE ===================== */}
        {activeTab === 'officer-queue' && (isOfficer || isAdmin) && (
          <div className="space-y-6">
            {/* Search and Status Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search code, citizen, or address..."
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400 whitespace-nowrap">Filter Status:</span>
                <select
                  value={queueStatusFilter}
                  onChange={(e) => setQueueStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500 w-full sm:w-auto"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Department Service Dispatch Queue</h3>
                  <p className="text-xs text-slate-400">Review incoming requests, schedule municipal crews, and record completions</p>
                </div>
                <span className="text-xs font-mono text-slate-400">Showing {queueRequests.length} requests</span>
              </div>

              {queueRequests.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Truck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm">No service requests matching current queue criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950/60 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-5 py-3">Ticket</th>
                        <th className="px-5 py-3">Service & Citizen</th>
                        <th className="px-5 py-3">Slot & Address</th>
                        <th className="px-5 py-3">Details</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {queueRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-xs font-bold text-amber-400">{req.request_code}</span>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {new Date(req.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs">
                            <div className="font-semibold text-white">{req.service_name}</div>
                            <div className="text-slate-400">
                              {req.citizen_name || 'Citizen'} • {req.citizen_phone || 'N/A'}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-300">
                            <div className="font-medium text-slate-200">{req.preferred_slot}</div>
                            <div className="text-slate-400 truncate max-w-[200px]">{req.address} ({req.ward_no})</div>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-400 max-w-[220px] truncate">
                            {req.details}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(req.status)}`}>
                              {req.status}
                            </span>
                            {req.completed_at && (
                              <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Fulfilled
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-2">
                            <button
                              onClick={() => setInspectingRequest(req)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => {
                                setUpdatingRequest(req);
                                setUpdateStatus(req.status === 'SUBMITTED' ? 'APPROVED' : 'COMPLETED');
                                setResolutionNotes(req.resolution_notes || '');
                                setUpdateError('');
                              }}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all"
                            >
                              Update Status
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ===================== MODAL: BOOK SERVICE ===================== */}
      {bookingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Book Municipal Service</h3>
                <p className="text-xs text-slate-400">{bookingService.name}</p>
              </div>
              <button onClick={() => setBookingService(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBooking} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block">Department Jurisdiction</span>
                  <strong className="text-slate-200 text-sm">{bookingService.department_name}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Municipal Fee</span>
                  <strong className="text-emerald-400 text-sm font-mono">
                    {Number(bookingService.fee) > 0 ? `₹${bookingService.fee}` : 'Free'}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Preferred Time Slot *</label>
                <select
                  value={formData.preferred_slot}
                  onChange={(e) => setFormData({ ...formData, preferred_slot: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Morning (09:00 AM - 12:00 PM)">Morning (09:00 AM - 12:00 PM)</option>
                  <option value="Afternoon (12:00 PM - 03:00 PM)">Afternoon (12:00 PM - 03:00 PM)</option>
                  <option value="Evening (03:00 PM - 06:00 PM)">Evening (03:00 PM - 06:00 PM)</option>
                  <option value="Immediate Emergency Dispatch">Immediate Emergency Dispatch</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">Service Address / Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="House, Street, Colony, Landmark"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Ward *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ward-12"
                    value={formData.ward_no}
                    onChange={(e) => setFormData({ ...formData, ward_no: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Specific Instructions / Requirements * (min 5 characters)
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Describe volume, access conditions, landmarks, or specific requests..."
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setBookingService(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all shadow-md shadow-blue-600/20"
                >
                  {submitting ? 'Submitting...' : 'Confirm & Request Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: OFFICER UPDATE STATUS ===================== */}
      {updatingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Update Service Dispatch Status</h3>
                <p className="text-xs font-mono text-amber-400">{updatingRequest.request_code}</p>
              </div>
              <button onClick={() => setUpdatingRequest(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {updateError && (
              <div className="mt-3 p-3 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
                {updateError}
              </div>
            )}

            <form onSubmit={handleOfficerUpdateStatus} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Status Transition</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="UNDER_REVIEW">UNDER_REVIEW - Department reviewing availability</option>
                  <option value="APPROVED">APPROVED - Crew and equipment scheduled</option>
                  <option value="IN_PROGRESS">IN_PROGRESS - Municipal team on ground</option>
                  <option value="COMPLETED">COMPLETED - Service successfully fulfilled</option>
                  <option value="REJECTED">REJECTED - Cannot fulfill request (Requires note)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Dispatch Remarks / Resolution Notes {updateStatus === 'REJECTED' && <span className="text-rose-400">*</span>}
                </label>
                <textarea
                  rows="3"
                  placeholder={
                    updateStatus === 'REJECTED'
                      ? 'Mandatory: explain why this service request cannot be fulfilled...'
                      : 'e.g. Tipper truck vehicle MH-04-1294 assigned under supervisor Ramesh.'
                  }
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
                ></textarea>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Citizens receive this update instantly via portal notifications.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setUpdatingRequest(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-all shadow-md shadow-amber-500/20"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: DETAILS INSPECTION ===================== */}
      {inspectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-blue-400">{inspectingRequest.request_code}</span>
                <button
                  onClick={() => handleCopyCode(inspectingRequest.request_code)}
                  title="Copy tracking code"
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button onClick={() => setInspectingRequest(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 block text-[11px]">Service & Department</span>
                <strong className="text-sm text-white block">{inspectingRequest.service_name}</strong>
                <span className="text-slate-400">{inspectingRequest.department_name}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">Current Status</span>
                  <span className={`inline-flex mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(inspectingRequest.status)}`}>
                    {inspectingRequest.status}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">Preferred Time Slot</span>
                  <strong className="text-slate-200 block mt-1">{inspectingRequest.preferred_slot || 'Anytime'}</strong>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 block text-[11px]">Location & Ward</span>
                <p className="text-slate-200 font-medium">{inspectingRequest.address}</p>
                <span className="text-slate-400">Ward: {inspectingRequest.ward_no || 'Ward-01'}</span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-400 block text-[11px]">Applicant Requirements / Instructions</span>
                <p className="text-slate-300 whitespace-pre-wrap">{inspectingRequest.details}</p>
              </div>

              {inspectingRequest.resolution_notes && (
                <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl space-y-1">
                  <span className="text-blue-300 block text-[11px] font-semibold">Department Dispatch Remarks</span>
                  <p className="text-slate-200 italic">{inspectingRequest.resolution_notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
                <span>Submitted: {new Date(inspectingRequest.created_at).toLocaleString()}</span>
                {inspectingRequest.completed_at && (
                  <span className="text-emerald-400">Completed: {new Date(inspectingRequest.completed_at).toLocaleString()}</span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-slate-800">
              <button
                onClick={() => setInspectingRequest(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: CITIZEN CANCEL REQUEST ===================== */}
      {cancellingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Cancel Service Request</h3>
                <p className="text-xs font-mono text-rose-400">{cancellingRequest.request_code}</p>
              </div>
              <button onClick={() => setCancellingRequest(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="mt-4 space-y-4 text-xs">
              <p className="text-slate-300">
                Are you sure you want to cancel your request for <strong>{cancellingRequest.service_name}</strong>?
              </p>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Reason for Cancellation (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Issue resolved by local society maintenance team..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCancellingRequest(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors"
                >
                  Keep Request
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg transition-all shadow-md shadow-rose-600/20"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
