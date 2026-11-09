import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  HardHat, 
  Building2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  UserCheck, 
  UserPlus, 
  Send, 
  RotateCcw, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Phone, 
  ExternalLink,
  MessageSquare,
  Shield,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  Sliders,
  ClipboardList,
  Flame,
  X,
  Upload,
  Image as ImageIcon
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

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'tasks'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [dispatchModalComplaint, setDispatchModalComplaint] = useState(null);
  const [statusModalComplaint, setStatusModalComplaint] = useState(null);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  const [modalSuccessMsg, setModalSuccessMsg] = useState(null);

  // Dispatch Form
  const [dispatchForm, setDispatchForm] = useState({
    field_worker_id: '',
    title: '',
    description: '',
    due_date: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
  });

  // Status Update Form
  const [statusForm, setStatusForm] = useState({
    status: 'IN_PROGRESS',
    remarks: '',
    photo_proof_url: '',
  });

  // Action states
  const [assigningId, setAssigningId] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const currentOfficerId = user?.officer?.id || user?.officer_id || 1;

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/officer/dashboard');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load officer dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter complaints in queue
  const filteredQueue = (data?.queue || []).filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (item.title || '').toLowerCase().includes(q) ||
      (item.tracking_code || '').toLowerCase().includes(q) ||
      (item.location_address || '').toLowerCase().includes(q) ||
      (item.citizen_name || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ASSIGNED_ME') return item.assigned_officer_id === (user?.officer?.id || 1);
    if (statusFilter === 'IN_PROGRESS') return item.status === 'IN_PROGRESS';
    if (statusFilter === 'REOPENED') return item.status === 'REOPENED';
    if (statusFilter === 'REJECTED') return item.status === 'REJECTED';
    if (statusFilter === 'RESOLVED') return ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(item.status);
    return true;
  });

  // Handle Dispatch Worker Submit
  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingModal(true);
    setError(null);

    try {
      const res = await api.post('/officer/tasks', {
        complaint_id: dispatchModalComplaint.id,
        field_worker_id: parseInt(dispatchForm.field_worker_id, 10),
        title: dispatchForm.title,
        description: dispatchForm.description,
        due_date: dispatchForm.due_date,
      });

      if (res.data?.success) {
        setModalSuccessMsg('Field technician dispatched successfully!');
        setDispatchModalComplaint(null);
        setDispatchForm({ field_worker_id: '', title: '', description: '', due_date: '' });
        fetchDashboardData();
      }
    } catch (err) {
      setError(err.message || 'Failed to dispatch field worker.');
    } finally {
      setIsSubmittingModal(false);
    }
  };

  // Handle Status Update Submit
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingModal(true);
    setError(null);

    try {
      const res = await api.patch(`/officer/complaints/${statusModalComplaint.id}/status`, {
        status: statusForm.status,
        remarks: statusForm.remarks,
        photo_proof_url: statusForm.photo_proof_url,
      });

      if (res.data?.success) {
        setModalSuccessMsg(`Complaint status updated to ${statusForm.status}!`);
        setStatusModalComplaint(null);
        setStatusForm({ status: 'IN_PROGRESS', remarks: '', photo_proof_url: '' });
        fetchDashboardData();
      }
    } catch (err) {
      setError(err.message || 'Failed to update status.');
    } finally {
      setIsSubmittingModal(false);
    }
  };

  // Handle Ticket Self-Assignment
  const handleAssignToMe = async (complaintId) => {
    setAssigningId(complaintId);
    setError(null);
    try {
      const res = await api.patch(`/officer/complaints/${complaintId}/assign`);
      if (res.data?.success) {
        setModalSuccessMsg('Ticket ownership claimed successfully. Status updated to ASSIGNED.');
        fetchDashboardData();
      }
    } catch (err) {
      setError(err.message || 'Failed to assign complaint to your queue.');
    } finally {
      setAssigningId(null);
    }
  };

  // Handle Task Status Update (Field worker tasks)
  const handleUpdateTaskStatus = async (taskId, nextStatus) => {
    setUpdatingTaskId(taskId);
    setError(null);
    try {
      const res = await api.patch(`/officer/tasks/${taskId}/status`, { status: nextStatus });
      if (res.data?.success) {
        setModalSuccessMsg(`Field task marked as ${nextStatus}.`);
        fetchDashboardData();
      }
    } catch (err) {
      setError(err.message || 'Failed to update field task status.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Handle Photo Proof Upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await api.post('/complaints/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data?.data?.photo_url) {
        setStatusForm((prev) => ({ ...prev, photo_proof_url: res.data.data.photo_url }));
        setModalSuccessMsg('Resolution proof photograph uploaded successfully!');
      }
    } catch (err) {
      setError(err.message || 'Failed to upload photo proof.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-6">
        {/* Error notification */}
        {error && (
          <AlertBanner
            type="error"
            title="Officer Terminal Error"
            message={error}
            onClose={() => setError(null)}
            action={
              <Button size="sm" variant="outline" onClick={fetchDashboardData} icon={RefreshCw}>
                Retry
              </Button>
            }
          />
        )}

        {/* Success notification */}
        {modalSuccessMsg && (
          <AlertBanner
            type="success"
            title="Operation Succeeded"
            message={modalSuccessMsg}
            onClose={() => setModalSuccessMsg(null)}
          />
        )}

        {/* 1. Officer Command Header */}
        <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-2xl p-6 sm:p-8 text-white shadow-card border border-navy-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center shrink-0 shadow-sm">
                <HardHat className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Municipal Department Officer
                  </span>
                  <span className="text-slate-400 text-xs font-mono">
                    Badge: {user?.officer?.badgeNumber || 'PWD-OFF-101'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {user?.name || 'Officer Portal'} &bull; <span className="text-teal-400">{user?.officer?.departmentName || 'Roads & Infrastructure (PWD)'}</span>
                </h1>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {user?.officer?.designation || 'Executive Engineer'} &bull; Manage departmental grievance queues, dispatch field technician crews, and file resolution audit proof.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDashboardData}
                icon={RefreshCw}
                className="bg-navy-900 text-white border-navy-700 hover:bg-navy-800 text-xs"
              >
                Refresh Queue
              </Button>
            </div>
          </div>
        </div>

        {/* 2. Department KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Card hover>
            <CardBody className="p-4">
              <span className="text-[11px] text-slate-500 font-semibold block">Assigned to Me</span>
              <div className="text-2xl font-extrabold text-navy-900 mt-1">
                {data?.stats?.assignedToMe ?? 0}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Direct dispatch queue</span>
            </CardBody>
          </Card>

          <Card hover>
            <CardBody className="p-4">
              <span className="text-[11px] text-slate-500 font-semibold block">Dept Active Queue</span>
              <div className="text-2xl font-extrabold text-navy-900 mt-1">
                {data?.stats?.deptTotal ?? 0}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Total grievances</span>
            </CardBody>
          </Card>

          <Card hover>
            <CardBody className="p-4">
              <span className="text-[11px] text-slate-500 font-semibold block">Work In Progress</span>
              <div className="text-2xl font-extrabold text-amber-600 mt-1">
                {data?.stats?.deptInProgress ?? 0}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Field crews active</span>
            </CardBody>
          </Card>

          <Card hover className="border-rose-200 bg-rose-50/20">
            <CardBody className="p-4">
              <span className="text-[11px] text-rose-700 font-bold block flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Reopened Cases
              </span>
              <div className="text-2xl font-extrabold text-rose-600 mt-1">
                {data?.stats?.deptReopened ?? 0}
              </div>
              <span className="text-[10px] text-rose-500 mt-0.5 block">Citizen rejected fix</span>
            </CardBody>
          </Card>

          <Card hover>
            <CardBody className="p-4">
              <span className="text-[11px] text-slate-500 font-semibold block">Field Technicians</span>
              <div className="text-2xl font-extrabold text-teal-600 mt-1">
                {data?.stats?.availableWorkers ?? 0}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Staff on roster</span>
            </CardBody>
          </Card>
        </div>

        {/* Tab Navigation between Queue and Tasks */}
        <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('queue')}
            className={`pb-3 transition-colors relative flex items-center gap-2 ${
              activeTab === 'queue'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-slate-500 hover:text-navy-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Department Grievance Queue ({filteredQueue.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`pb-3 transition-colors relative flex items-center gap-2 ${
              activeTab === 'tasks'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-slate-500 hover:text-navy-900'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Dispatched Field Tasks ({data?.tasks?.length || 0})</span>
          </button>
        </div>

        {activeTab === 'queue' ? (
          /* Grievance Queue Section */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter by Code, Title, Address, or Citizen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-card"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-200/60 p-1 rounded-xl text-xs">
                {['ALL', 'ASSIGNED_ME', 'IN_PROGRESS', 'REOPENED', 'RESOLVED'].map((filter) => (
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
                      : filter === 'ASSIGNED_ME'
                      ? 'My Queue'
                      : filter === 'IN_PROGRESS'
                      ? 'In Progress'
                      : filter === 'REOPENED'
                      ? 'Reopened'
                      : 'Resolved'}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <LoadingState message="Loading department grievance queue..." />
            ) : filteredQueue.length === 0 ? (
              <EmptyState
                icon={HardHat}
                title="Department Queue Clear"
                description="No complaints matching your active filter criteria."
              />
            ) : (
              <div className="space-y-3">
                {filteredQueue.map((item) => (
                  <Card key={item.id} hover className="border-slate-200">
                    <div className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {item.photo_url ? (
                          <img
                            src={item.photo_url}
                            alt={item.title}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 border border-slate-200">
                            <AlertTriangle className="w-7 h-7 text-amber-500" />
                          </div>
                        )}

                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-navy-900 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
                              {item.tracking_code}
                            </span>
                            <PriorityBadge priority={item.priority} size="sm" />
                            <StatusBadge status={item.status} size="sm" />
                            <span className="text-[11px] text-slate-500 font-medium">
                              Ward {item.ward_no || '12'} &bull; SLA: {item.sla_hours || 48}h
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-navy-900">{item.title}</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{item.location_address}</span>
                          </p>

                          <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-3 pt-1">
                            <span>Citizen: <strong className="text-navy-900">{item.citizen_name}</strong></span>
                            <span>Phone: <span className="font-mono">{item.citizen_phone || 'N/A'}</span></span>
                            {item.assigned_officer_id === currentOfficerId && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <UserCheck className="w-3 h-3" /> Assigned to You
                              </span>
                            )}
                          </div>

                          {/* Rejection notice callout if rejected */}
                          {item.status === 'REJECTED' && item.rejection_reason && (
                            <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Official Rejection Grounds:</span>{' '}
                                <span>{item.rejection_reason}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2 w-full lg:w-auto border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                        <div className="flex flex-wrap items-center gap-2">
                          {(item.status === 'REPORTED' || !item.assigned_officer_id) && (
                            <Button
                              size="sm"
                              variant="outline"
                              icon={UserCheck}
                              isLoading={assigningId === item.id}
                              onClick={() => handleAssignToMe(item.id)}
                              className="text-teal-700 border-teal-300 hover:bg-teal-50"
                            >
                              Assign to Me
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="navy"
                            icon={UserPlus}
                            onClick={() => {
                              setDispatchModalComplaint(item);
                              setDispatchForm({
                                field_worker_id: data?.fieldWorkers?.[0]?.id || '',
                                title: `Fix: ${item.title.substring(0, 50)}`,
                                description: `Site address: ${item.location_address}. Please carry necessary replacement parts and tools.`,
                                due_date: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
                              });
                            }}
                          >
                            Dispatch Crew
                          </Button>

                          <Button
                            size="sm"
                            variant="teal"
                            icon={CheckCircle2}
                            onClick={() => {
                              setStatusModalComplaint(item);
                              setStatusForm({
                                status: item.status === 'REPORTED' || item.status === 'ASSIGNED' ? 'IN_PROGRESS' : 'RESOLVED',
                                remarks: '',
                                photo_proof_url: '',
                              });
                            }}
                          >
                            Update Status
                          </Button>
                        </div>

                        <Link to={`/complaints/${item.tracking_code}`} className="text-[11px] text-teal-600 hover:underline flex items-center gap-1 font-semibold">
                          View Lifecycle Details <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Dispatched Tasks Table */
          <div className="space-y-4">
            {(!data?.tasks || data.tasks.length === 0) ? (
              <EmptyState
                icon={ClipboardList}
                title="No Active Field Work Orders"
                description="Dispatch a field crew from the grievance queue above to generate work orders."
              />
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Task ID</th>
                        <th className="px-4 py-3">Complaint Ref</th>
                        <th className="px-4 py-3">Field Worker</th>
                        <th className="px-4 py-3">Work Order Title</th>
                        <th className="px-4 py-3">Due Date</th>
                        <th className="px-4 py-3">Task Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.tasks.map((task) => (
                        <tr key={task.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-navy-900">TSK-{String(task.id).padStart(4, '0')}</td>
                          <td className="px-4 py-3 font-mono text-teal-700 font-semibold">{task.tracking_code}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-navy-900">{task.worker_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{task.worker_phone}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-navy-900">{task.title}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">{task.description}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={task.status} size="sm" />
                          </td>
                          <td className="px-4 py-3 text-right">
                            {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                {task.status === 'PENDING' && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                                    disabled={updatingTaskId === task.id}
                                    className="px-2 py-1 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                                  >
                                    Start
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED')}
                                  disabled={updatingTaskId === task.id}
                                  className="px-2 py-1 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                >
                                  Complete
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Closed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Modal 1: Dispatch Field Worker */}
      {dispatchModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-navy-900 text-white">
              <div className="flex items-center gap-2">
                <HardHat className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm">Dispatch Municipal Technician</h3>
              </div>
              <button onClick={() => setDispatchModalComplaint(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="font-mono font-bold text-navy-900 block">{dispatchModalComplaint.tracking_code}</span>
                <p className="font-semibold text-navy-900">{dispatchModalComplaint.title}</p>
                <p className="text-slate-500">{dispatchModalComplaint.location_address}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Field Worker / Technician *</label>
                <select
                  value={dispatchForm.field_worker_id}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, field_worker_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                >
                  <option value="">-- Choose Field Worker --</option>
                  {(data?.fieldWorkers || []).map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.skills || 'General Technician'}) &bull; {w.ward_assigned || 'Ward-12'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Order Title *</label>
                <input
                  type="text"
                  value={dispatchForm.title}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instructions / Safety Brief *</label>
                <textarea
                  rows={3}
                  value={dispatchForm.description}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Completion Target Date *</label>
                <input
                  type="date"
                  value={dispatchForm.due_date}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, due_date: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDispatchModalComplaint(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="teal" size="sm" isLoading={isSubmittingModal}>
                  Confirm Dispatch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Update Grievance Status */}
      {statusModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-navy-900 text-white">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm">Update Grievance Status</h3>
              </div>
              <button onClick={() => setStatusModalComplaint(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="font-mono font-bold text-navy-900 block">{statusModalComplaint.tracking_code}</span>
                <p className="font-semibold text-navy-900">{statusModalComplaint.title}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-slate-500">Current Status:</span>
                  <StatusBadge status={statusModalComplaint.status} size="sm" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Status Transition *</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                >
                  <option value="IN_PROGRESS">IN_PROGRESS (Crew on-site)</option>
                  <option value="RESOLVED">RESOLVED (Repairs finished, citizen to verify)</option>
                  <option value="REJECTED">REJECTED (Invalid / Not in municipal jurisdiction)</option>
                </select>
                {statusForm.status === 'REJECTED' && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    * Rejection reason will be permanently archived and presented to the complainant.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {statusForm.status === 'REJECTED' ? 'Mandatory Grounds for Rejection *' : 'Official Remarks & Action Report *'}
                </label>
                <textarea
                  rows={3}
                  value={statusForm.remarks}
                  onChange={(e) => setStatusForm({ ...statusForm, remarks: e.target.value })}
                  placeholder={statusForm.status === 'REJECTED' ? 'Specify why this grievance cannot be serviced by municipality...' : 'Describe resolution details, parts replaced, or on-site actions...'}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Photo Proof (Recommended for RESOLVED state)
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors">
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span>{isUploadingPhoto ? 'Uploading...' : 'Upload On-Site Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingPhoto}
                        onChange={handlePhotoUpload}
                      />
                    </label>
                    <span className="text-slate-400 text-xs font-medium">or paste direct image URL</span>
                  </div>

                  <input
                    type="url"
                    value={statusForm.photo_proof_url}
                    onChange={(e) => setStatusForm({ ...statusForm, photo_proof_url: e.target.value })}
                    placeholder="https://... or uploaded image path"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />

                  {statusForm.photo_proof_url && (
                    <div className="relative mt-2 inline-block border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <img
                        src={statusForm.photo_proof_url.startsWith('/') ? `http://localhost:5000${statusForm.photo_proof_url}` : statusForm.photo_proof_url}
                        alt="Resolution Proof"
                        className="h-24 w-40 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setStatusForm((prev) => ({ ...prev, photo_proof_url: '' }))}
                        className="absolute top-1 right-1 bg-navy-950/80 text-white rounded-full p-1 hover:bg-rose-600 transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setStatusModalComplaint(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="teal" size="sm" isLoading={isSubmittingModal}>
                  Save Status
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
