import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FileCode,
  Building2,
  MapPin,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
  Check,
  Zap,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../../services/api';

const CATEGORY_COLORS = [
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#f97316', // Orange
];

export default function AnalyticsPage() {
  const [kpis, setKpis] = useState(null);
  const [trends, setTrends] = useState([]);
  const [slaData, setSlaData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  // Filters
  const [selectedDept, setSelectedDept] = useState('');
  const [wardSearch, setWardSearch] = useState('');
  const [exportFormat, setExportFormat] = useState('csv');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAnalytics = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const deptQuery = selectedDept ? `?department_id=${selectedDept}` : '';

      const [kpiRes, trendsRes, slaRes, catRes, wardsRes] = await Promise.all([
        api.get('/analytics/kpis').catch(() => ({ data: { success: false } })),
        api.get(`/analytics/trends${deptQuery}`).catch(() => ({ data: { success: false } })),
        api.get(`/analytics/sla${deptQuery}`).catch(() => ({ data: { success: false } })),
        api.get(`/analytics/categories${deptQuery}`).catch(() => ({ data: { success: false } })),
        api.get('/analytics/wards').catch(() => ({ data: { success: false } })),
      ]);

      if (kpiRes.data?.success) setKpis(kpiRes.data.data);
      if (trendsRes.data?.success) setTrends(trendsRes.data.data);
      if (slaRes.data?.success) setSlaData(slaRes.data.data);
      if (catRes.data?.success) setCategories(catRes.data.data);
      if (wardsRes.data?.success) setWards(wardsRes.data.data);

      if (isManual) showToast('City intelligence metrics refreshed!');
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedDept]);

  const handleExport = (format) => {
    const query = new URLSearchParams();
    query.set('format', format);
    if (selectedDept) query.set('department_id', selectedDept);

    const exportUrl = `/api/analytics/export?${query.toString()}`;
    window.open(exportUrl, '_blank');
    showToast(`Exporting official ${format.toUpperCase()} grievance report...`);
  };

  const filteredWards = wards.filter(
    (w) =>
      w.name?.toLowerCase().includes(wardSearch.toLowerCase()) ||
      w.ward_no?.toLowerCase().includes(wardSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Synthesizing Citywide Civic Intelligence...</p>
        </div>
      </div>
    );
  }

  // Format category data for PieChart
  const pieChartData = categories.slice(0, 6).map((cat) => ({
    name: cat.category_name,
    value: cat.count || Math.round(cat.percentage),
    percentage: cat.percentage,
    code: cat.department_code,
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-medium animate-bounce ${
            toast.type === 'error'
              ? 'bg-rose-900/90 border-rose-600 text-white'
              : 'bg-emerald-900/90 border-emerald-600 text-white'
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
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-b border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Civic Intelligence & Reporting (Phase 14)
                </span>
                <span className="text-xs text-slate-400">• Database-Driven Real-Time Metrics</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                City Grievance Analytics & SLA Performance
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Comprehensive empirical metrics on monthly complaint trajectories, departmental SLA compliance benchmarks, turnaround speeds, and ward-level municipal efficiency.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => fetchAnalytics(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>

              <button
                onClick={() => handleExport('csv')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/20"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export CSV Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">

        {/* 1. Global KPI Scorecard Cards */}
        {kpis && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider">
                Total Grievances
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {kpis.total_grievances}
                </span>
                <span className="text-xs text-indigo-400 font-semibold">Citywide</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Active: <strong className="text-amber-400">{kpis.active_grievances}</strong> | Closed: <strong className="text-emerald-400">{kpis.resolved_grievances}</strong>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider">
                Resolution Rate
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                  {kpis.resolution_rate}%
                </span>
                <span className="text-xs text-slate-400">closed</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-400/80 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Empirical verification
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider">
                SLA Compliance
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">
                  {kpis.city_sla_compliance}%
                </span>
                <span className="text-xs text-slate-400">on-time</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Department target &gt; 90%
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider">
                Avg Resolution Speed
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">
                  {kpis.avg_turnaround_hours}h
                </span>
                <span className="text-xs text-slate-400">average</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                From lodging to resolution
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider">
                Critical Hazards
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">
                  {kpis.critical_emergencies}
                </span>
                <span className="text-xs text-rose-400/80 font-bold">EMERGENCY</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Instant dispatch priority
              </div>
            </div>
          </div>
        )}

        {/* 2. Trajectory Visual Charts (Area / Bar with Recharts) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                Monthly Grievance Trajectory & Resolution Trend
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Incoming citizen grievances versus verified municipal resolutions over time
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Departments</option>
                <option value="1">Roads & Infrastructure (PWD)</option>
                <option value="2">Solid Waste Management (SWM)</option>
                <option value="3">Water Supply & Sewerage (WSS)</option>
                <option value="4">Electricity & Street Lighting (ELE)</option>
                <option value="5">Parks & Horticulture (PRK)</option>
                <option value="6">Public Health & Sanitation (HLT)</option>
              </select>
            </div>
          </div>

          {/* Recharts Area / Bar Chart Container */}
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                  formatter={(value) => (
                    <span className="text-slate-300 font-medium capitalize">
                      {value === 'reported' ? 'Reported Complaints' : 'Resolved & Verified'}
                    </span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="reported"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorReported)"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorResolved)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Department SLA Performance Benchmarks & Leaderboard */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                Department SLA Compliance & Resolution Benchmarks
              </h3>
              <p className="text-xs text-slate-400">
                Benchmarked against target turnaround windows per municipal charter
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {slaData.map((dept) => (
              <div
                key={dept.department_id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono text-xs font-bold border border-purple-500/30">
                      {dept.department_code}
                    </span>
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {dept.compliance_rate}% SLA Target
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug min-h-[38px]">
                    {dept.department_name}
                  </h4>

                  <div className="grid grid-cols-2 gap-3 mt-4 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Avg Turnaround</span>
                      <strong className="text-white text-sm font-mono mt-0.5 block">
                        {dept.avg_resolution_hours || 24} Hours
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Total Volume</span>
                      <strong className="text-indigo-400 text-sm font-mono mt-0.5 block">
                        {dept.total_complaints || 0} Tickets
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>
                    On-Time: <strong className="text-emerald-400">{dept.on_time || 0}</strong>
                  </span>
                  <span>
                    Breached: <strong className="text-rose-400">{dept.breached || 0}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Category Breakdown & Ward Efficiency Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown (Donut Chart) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-amber-400" />
                  Category Concentration Breakdown
                </h3>
                <span className="text-xs text-slate-400">Total: {categories.length} Types</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Distribution of reported municipal infrastructure grievances
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Donut Chart */}
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                        color: '#f8fafc',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="space-y-2">
                {pieChartData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate max-w-[170px]">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                      ></span>
                      <span className="text-slate-300 truncate">{item.name}</span>
                    </div>
                    <span className="font-mono text-amber-400 font-bold">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ward Grievance Efficiency Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Ward Grievance Efficiency
                </h3>
                <input
                  type="text"
                  placeholder="Filter ward..."
                  value={wardSearch}
                  onChange={(e) => setWardSearch(e.target.value)}
                  className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 w-36"
                />
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Resolution efficiency and concentration across municipal sectors
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 font-semibold uppercase text-slate-400 border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="px-3 py-2">Ward & Sector</th>
                    <th className="px-3 py-2">Tickets</th>
                    <th className="px-3 py-2">Resolved</th>
                    <th className="px-3 py-2 text-right">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredWards.map((w, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="px-3 py-2.5">
                        <span className="font-bold text-white block">{w.ward_no}</span>
                        <span className="text-[10px] text-slate-500 truncate block">{w.name}</span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-300">{w.total_complaints}</td>
                      <td className="px-3 py-2.5 font-mono text-emerald-400">{w.resolved}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-indigo-400">
                        {w.resolution_rate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 5. Data Export & Governance Station */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-400" />
              Official Municipal Grievance Data Export
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate standardized data registers with complete audit trails, SLA compliance markers, and GPS locations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Download CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <FileCode className="w-4 h-4 text-indigo-400" />
              Export JSON
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
