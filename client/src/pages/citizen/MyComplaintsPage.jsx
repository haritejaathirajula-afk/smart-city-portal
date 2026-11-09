import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Building2, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  PlusCircle, 
  ExternalLink,
  MessageSquare,
  ArrowRight,
  Clock,
  CheckCircle2,
  RefreshCw,
  X,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import Button from '../../components/ui/Button';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import AlertBanner from '../../components/ui/AlertBanner';

export default function MyComplaintsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('id') || searchParams.get('search') || '';

  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedWard, setSelectedWard] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');

  const wards = Array.from({ length: 24 }, (_, i) => `Ward-${String(i + 1).padStart(2, '0')}`);

  // Fetch departments metadata for filtering
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await api.get('/complaints/meta');
        if (res.data?.success) {
          setDepartments(res.data.data.departments || []);
        }
      } catch (err) {
        console.warn('Failed to load departments:', err.message);
      }
    }
    loadMeta();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (selectedDept !== 'ALL') params.department_id = selectedDept;
      if (selectedWard !== 'ALL') params.ward_no = selectedWard;
      if (selectedPriority !== 'ALL') params.priority = selectedPriority;

      const res = await api.get('/complaints', { params });
      if (res.data?.success) {
        setComplaints(res.data.data || []);
        setTotalCount(res.data.total ?? (res.data.data?.length || 0));
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch complaints from municipal database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, selectedDept, selectedWard, selectedPriority]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComplaints();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setSelectedDept('ALL');
    setSelectedWard('ALL');
    setSelectedPriority('ALL');
    setSearchParams({});
  };

  const statusOptions = [
    { id: 'ALL', label: 'All Statuses' },
    { id: 'REPORTED', label: 'Reported' },
    { id: 'ASSIGNED', label: 'Assigned' },
    { id: 'IN_PROGRESS', label: 'In Progress' },
    { id: 'RESOLVED', label: 'Resolved' },
    { id: 'VERIFIED', label: 'Verified' },
    { id: 'CLOSED', label: 'Closed' },
    { id: 'REOPENED', label: 'Reopened' },
    { id: 'REJECTED', label: 'Rejected' },
  ];

  const hasActiveFilters = 
    searchQuery.trim() !== '' || 
    statusFilter !== 'ALL' || 
    selectedDept !== 'ALL' || 
    selectedWard !== 'ALL' || 
    selectedPriority !== 'ALL';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-2xl p-6 sm:p-8 text-white shadow-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Civic Redressal Registry</span>
              <span className="text-navy-400">&bull;</span>
              <span>6-Stage Lifecycle Tracking</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Grievance Tracking & Status Registry
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Search, filter, and inspect real-time progress for all municipal grievances. 
              Click any record to inspect the chronological audit history, verify resolutions, or reopen unresolved tickets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/report">
              <Button size="md" variant="teal" icon={PlusCircle} className="shadow-sm whitespace-nowrap">
                Report Grievance
              </Button>
            </Link>
            <Link to="/citizen/dashboard">
              <Button size="md" variant="outline" className="bg-navy-900/60 text-white border-navy-700 hover:bg-navy-800 whitespace-nowrap">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Error notification if fetch fails */}
      {error && (
        <AlertBanner
          type="error"
          title="Unable to load grievances"
          message={error}
          onClose={() => setError(null)}
          action={
            <Button size="sm" variant="outline" onClick={fetchComplaints} icon={RefreshCw}>
              Retry Query
            </Button>
          }
        />
      )}

      {/* Comprehensive Search & Multi-Filter Control Box */}
      <Card className="border-slate-200 shadow-card">
        <CardBody className="p-4 sm:p-5 space-y-4">
          {/* Row 1: Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by Tracking Code (e.g. CMP-2026-00104), Issue Title, Ward, Landmark, or Department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button type="submit" size="sm" variant="teal" icon={Search} className="w-full sm:w-auto">
                Search
              </Button>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  icon={X}
                  className="text-xs whitespace-nowrap"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </form>

          {/* Row 2: Secondary Dropdowns (Department, Ward, Priority) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
            {/* Department Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Department Wing
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Ward Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Municipal Ward
              </label>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="ALL">All 24 Wards</option>
                {wards.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Urgency Priority
              </label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
          </div>

          {/* Row 3: Status Filter Pills */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-semibold text-[11px] mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-teal-600" /> Lifecycle Status:
            </span>
            {statusOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setStatusFilter(opt.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all text-xs ${
                  statusFilter === opt.id
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Results Counter & Active Criteria */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Showing <strong className="text-navy-900">{complaints.length}</strong> of{' '}
          <strong className="text-navy-900">{totalCount}</strong> grievances in registry
        </div>
        <button
          onClick={fetchComplaints}
          className="inline-flex items-center gap-1 hover:text-teal-600 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Complaints Feed Grid */}
      {loading ? (
        <LoadingState message="Retrieving grievance records from municipal database..." />
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No Matching Grievances Found"
          description={
            hasActiveFilters
              ? 'No complaints match your active filter criteria. Try resetting your search filters.'
              : 'There are currently no complaints recorded in the system.'
          }
          actionLabel={hasActiveFilters ? 'Reset Filters' : 'Report an Issue'}
          onAction={hasActiveFilters ? handleResetFilters : () => (window.location.href = '/report')}
          actionIcon={hasActiveFilters ? RefreshCw : PlusCircle}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complaints.map((c) => (
            <Card key={c.id} hover className="flex flex-col justify-between border-slate-200">
              <div className="p-5 space-y-3">
                {/* Top tracking line */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-navy-900 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
                      {c.tracking_code}
                    </span>
                    <PriorityBadge priority={c.priority} size="sm" />
                  </div>
                  <StatusBadge status={c.status} size="sm" />
                </div>

                {/* Photo thumbnail & title layout */}
                <div className="flex items-start gap-3">
                  {c.photo_url ? (
                    <img
                      src={c.photo_url}
                      alt={c.title}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 border border-slate-200">
                      <AlertTriangle className="w-6 h-6 text-teal-600" />
                    </div>
                  )}

                  <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-navy-900 leading-snug hover:text-teal-600 transition-colors line-clamp-2">
                      <Link to={`/complaints/${c.tracking_code}`}>
                        {c.title}
                      </Link>
                    </h3>
                    <div className="text-[11px] text-slate-500 font-medium truncate">
                      {c.department_name} &bull; <span className="text-slate-700">{c.category_name}</span>
                    </div>
                  </div>
                </div>

                {/* Location & timestamp */}
                <div className="space-y-1 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.location_address} ({c.ward_no})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Reported: {new Date(c.created_at).toLocaleDateString()} at{' '}
                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Latest status history remark snippet */}
                {c.latest_remark && (
                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-start gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
                    <span className="line-clamp-2 italic">
                      "{c.latest_remark}"
                    </span>
                  </div>
                )}

                {/* Rejection reason callout if rejected */}
                {c.status === 'REJECTED' && c.rejection_reason && (
                  <div className="text-[11px] text-rose-800 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    <strong>Rejection reason:</strong> {c.rejection_reason}
                  </div>
                )}
              </div>

              {/* Bottom footer button */}
              <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  Citizen: <strong className="text-slate-700 font-medium">{c.citizen_name || 'Resident'}</strong>
                </span>
                <Link to={`/complaints/${c.tracking_code}`}>
                  <Button size="sm" variant="outline" className="text-xs" icon={ExternalLink}>
                    Track Timeline
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
