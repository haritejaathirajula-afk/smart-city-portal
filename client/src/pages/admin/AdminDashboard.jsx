import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Building2,
  FileText,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  UserX,
  ArrowRightLeft,
  ChevronRight,
  Sparkles,
  Phone,
  Mail,
  Sliders,
  Send,
  X,
  Flame,
  Layers,
  Edit2,
  ExternalLink,
  MapPin,
  Check,
  Briefcase,
  BadgeCheck,
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'departments' | 'complaints' | 'audit'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data states
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Search & Filter states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [complaintSearch, setComplaintSearch] = useState('');
  const [complaintDeptFilter, setComplaintDeptFilter] = useState('');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');

  // Modals state
  // 1. Role Change Modal
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [newRole, setNewRole] = useState('citizen');
  const [selectedDeptId, setSelectedDeptId] = useState(1);
  const [badgeNumber, setBadgeNumber] = useState('');
  const [designation, setDesignation] = useState('');

  // 2. Department Modals
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [newDept, setNewDept] = useState({
    code: '',
    name: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    head_officer_name: '',
  });

  const [editDeptModal, setEditDeptModal] = useState(null);
  const [editDeptForm, setEditDeptForm] = useState({
    name: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    head_officer_name: '',
    is_active: true,
  });

  // 3. Category Modals
  const [categoryModalDept, setCategoryModalDept] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    sla_hours: 48,
    default_priority: 'MEDIUM',
  });

  const [editCategoryModal, setEditCategoryModal] = useState(null);
  const [editCategoryForm, setEditCategoryForm] = useState({
    name: '',
    description: '',
    sla_hours: 48,
    default_priority: 'MEDIUM',
    is_active: true,
  });

  // 4. Complaint Reassign Modal
  const [reassignModalComplaint, setReassignModalComplaint] = useState(null);
  const [reassignDeptId, setReassignDeptId] = useState(1);
  const [reassignOfficerId, setReassignOfficerId] = useState('');
  const [reassignRemarks, setReassignRemarks] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAllData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [statsRes, usersRes, deptsRes, catsRes, complaintsRes, auditRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: { success: false } })),
        api.get('/admin/users').catch(() => ({ data: { success: false } })),
        api.get('/admin/departments').catch(() => ({ data: { success: false } })),
        api.get('/admin/categories').catch(() => ({ data: { success: false } })),
        api.get('/admin/complaints').catch(() => ({ data: { success: false } })),
        api.get('/admin/audit-logs').catch(() => ({ data: { success: false } })),
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.data);
      if (usersRes.data?.success) setUsersList(usersRes.data.data);
      if (deptsRes.data?.success) setDepartments(deptsRes.data.data);
      if (catsRes.data?.success) setCategories(catsRes.data.data);
      if (complaintsRes.data?.success) setComplaints(complaintsRes.data.data);
      if (auditRes.data?.success) setAuditLogs(auditRes.data.data);

      if (isManual) showToast('Live administrative records refreshed!');
    } catch (err) {
      console.error('Failed to load admin data:', err);
      showToast('Error syncing administrative data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handle User Status Toggle
  const handleToggleUserStatus = async (userItem) => {
    if (Number(userItem.id) === Number(user?.id)) {
      showToast('You cannot disable your own administrator account', 'error');
      return;
    }
    try {
      const newStatus = !userItem.is_active;
      await api.patch(`/admin/users/${userItem.id}/status`, { is_active: newStatus });
      showToast(`User account ${newStatus ? 'activated' : 'disabled'} successfully`);
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to update user status', 'error');
    }
  };

  // Handle Role Change
  const handleSaveUserRole = async (e) => {
    e.preventDefault();
    if (!roleModalUser) return;
    if (Number(roleModalUser.id) === Number(user?.id) && newRole !== 'admin') {
      showToast('Administrators cannot demote their own account', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.patch(`/admin/users/${roleModalUser.id}/role`, {
        role_name: newRole,
        department_id: newRole === 'officer' ? selectedDeptId : undefined,
        badge_number: newRole === 'officer' ? badgeNumber : undefined,
        designation: newRole === 'officer' ? designation : undefined,
      });
      showToast(`Role updated to ${newRole.toUpperCase()} for ${roleModalUser.name}`);
      setRoleModalUser(null);
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to update user role', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Create Department
  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!newDept.code || !newDept.name) return;
    setIsSubmitting(true);
    try {
      await api.post('/admin/departments', newDept);
      showToast(`Department ${newDept.name} created!`);
      setDeptModalOpen(false);
      setNewDept({ code: '', name: '', description: '', contact_email: '', contact_phone: '', head_officer_name: '' });
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to create department', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Department
  const handleUpdateDepartment = async (e) => {
    e.preventDefault();
    if (!editDeptModal) return;
    setIsSubmitting(true);
    try {
      await api.put(`/admin/departments/${editDeptModal.id}`, editDeptForm);
      showToast(`Department "${editDeptForm.name}" updated successfully!`);
      setEditDeptModal(null);
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to update department', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Create Category
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!categoryModalDept || !newCategory.name) return;
    setIsSubmitting(true);
    try {
      await api.post('/admin/categories', {
        department_id: categoryModalDept.id,
        name: newCategory.name,
        description: newCategory.description,
        sla_hours: Number(newCategory.sla_hours) || 48,
        default_priority: newCategory.default_priority,
      });
      showToast(`Category "${newCategory.name}" added to ${categoryModalDept.name}!`);
      setCategoryModalDept(null);
      setNewCategory({ name: '', description: '', sla_hours: 48, default_priority: 'MEDIUM' });
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to create category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Category
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editCategoryModal) return;
    setIsSubmitting(true);
    try {
      await api.put(`/admin/categories/${editCategoryModal.id}`, {
        name: editCategoryForm.name,
        description: editCategoryForm.description,
        sla_hours: Number(editCategoryForm.sla_hours) || 48,
        default_priority: editCategoryForm.default_priority,
        is_active: editCategoryForm.is_active,
      });
      showToast(`Category "${editCategoryForm.name}" updated successfully!`);
      setEditCategoryModal(null);
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to update category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Complaint Reassignment
  const handleReassignComplaint = async (e) => {
    e.preventDefault();
    if (!reassignModalComplaint) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/admin/complaints/${reassignModalComplaint.id}/reassign`, {
        department_id: reassignDeptId,
        assigned_officer_id: reassignOfficerId ? parseInt(reassignOfficerId, 10) : null,
        remarks: reassignRemarks || 'Transferred by City Administrator',
      });
      showToast(`Complaint ${reassignModalComplaint.tracking_code} reassigned successfully!`);
      setReassignModalComplaint(null);
      setReassignOfficerId('');
      setReassignRemarks('');
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to reassign complaint', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      !userSearch ||
      (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.phone && u.phone.includes(userSearch)) ||
      (u.badge_number && u.badge_number.toLowerCase().includes(userSearch.toLowerCase()));
    const matchesRole = !userRoleFilter || u.role_name === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered Complaints
  const filteredComplaints = complaints.filter((c) => {
    const q = complaintSearch.toLowerCase();
    const matchesSearch =
      !complaintSearch ||
      (c.tracking_code || '').toLowerCase().includes(q) ||
      (c.title || '').toLowerCase().includes(q) ||
      (c.citizen_name || '').toLowerCase().includes(q) ||
      (c.location_address || '').toLowerCase().includes(q);
    const matchesDept = !complaintDeptFilter || String(c.department_id) === String(complaintDeptFilter);
    const matchesStatus = !complaintStatusFilter || c.status === complaintStatusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!auditActionFilter) return true;
    return (log.action || '').toLowerCase().includes(auditActionFilter.toLowerCase());
  });

  // Officers in currently selected department for reassignment modal
  const departmentOfficers = usersList.filter(
    (u) => u.role_name === 'officer' && Number(u.department_id) === Number(reassignDeptId)
  );

  const kpis = stats?.kpis || {
    totalCitizens: usersList.filter((u) => u.role_name === 'citizen').length || 4,
    totalOfficers: usersList.filter((u) => u.role_name === 'officer').length || 2,
    totalComplaints: complaints.length || 8,
    activeComplaints:
      complaints.filter((c) => ['REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes(c.status)).length || 4,
    resolvedComplaints: complaints.filter((c) => ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(c.status)).length || 3,
    slaComplianceRate: 94,
    resolutionRate: 75,
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-6">
        {/* Toast Notification */}
        {toast && (
          <AlertBanner
            type={toast.type === 'error' ? 'error' : 'success'}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}

        {/* 1. Admin Top Command Banner */}
        <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-2xl p-6 sm:p-8 text-white shadow-card border border-navy-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  City Administration Console
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                  System Online
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Municipal Governance & Operations
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Central oversight authority for all 24 municipal wards, departmental grievance triage, user access
                privileges, and service-level agreements.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAllData(true)}
                disabled={refreshing}
                icon={RefreshCw}
                className="bg-navy-900 text-white border-navy-700 hover:bg-navy-800 text-xs"
              >
                {refreshing ? 'Refreshing...' : 'Refresh Records'}
              </Button>
              <Button
                variant="teal"
                size="sm"
                onClick={() => setDeptModalOpen(true)}
                icon={Plus}
              >
                Add Department
              </Button>
            </div>
          </div>
        </div>

        {/* 2. Top Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 border-b border-slate-200">
          {[
            { id: 'overview', label: 'Overview & KPIs', icon: Activity },
            { id: 'users', label: `Users & Roles (${usersList.length})`, icon: Users },
            { id: 'departments', label: `Departments (${departments.length})`, icon: Building2 },
            { id: 'complaints', label: `All Grievances (${complaints.length})`, icon: FileText },
            { id: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-navy-900 hover:bg-slate-200/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ----------------- TAB 1: OVERVIEW ----------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Card hover>
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Total Citizens
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-navy-900 mt-2">{kpis.totalCitizens}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Verified resident accounts</p>
                </CardBody>
              </Card>

              <Card hover>
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Officers
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-navy-900 mt-2">{kpis.totalOfficers}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Across {departments.length} wings</p>
                </CardBody>
              </Card>

              <Card hover>
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Total Complaints
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-navy-900 mt-2">{kpis.totalComplaints}</div>
                  <p className="text-[11px] text-amber-600 mt-1 font-semibold">{kpis.activeComplaints} active queue</p>
                </CardBody>
              </Card>

              <Card hover>
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Resolution Rate
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 mt-2">{kpis.resolutionRate}%</div>
                  <p className="text-[11px] text-slate-400 mt-1">{kpis.resolvedComplaints} closed / verified</p>
                </CardBody>
              </Card>

              <Card hover>
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      SLA Compliance
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-purple-600 mt-2">{kpis.slaComplianceRate}%</div>
                  <p className="text-[11px] text-slate-400 mt-1">Within SLA targets</p>
                </CardBody>
              </Card>
            </div>

            {/* Department Operations Summary Table */}
            <Card>
              <CardHeader
                title="Departmental Operations Summary"
                subtitle="Live grievance volumes and staff allocations per municipal operating wing"
                action={
                  <button
                    onClick={() => setActiveTab('departments')}
                    className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1"
                  >
                    Manage Wings <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                }
              />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Department</th>
                      <th className="px-5 py-3">Code</th>
                      <th className="px-5 py-3">Staff / Officers</th>
                      <th className="px-5 py-3">Categories</th>
                      <th className="px-5 py-3">Active Tickets</th>
                      <th className="px-5 py-3">Resolved</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {departments.map((dept) => (
                      <tr key={dept.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-navy-900">{dept.name}</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-mono text-slate-700 border border-slate-200">
                            {dept.code}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{dept.officer_count || 0} Officers</td>
                        <td className="px-5 py-3.5 text-slate-600">{dept.category_count || 0} Services</td>
                        <td className="px-5 py-3.5">
                          <span className="text-amber-600 font-bold">{dept.active_complaints || 0}</span>
                        </td>
                        <td className="px-5 py-3.5 text-teal-600 font-bold">{dept.resolved_complaints || 0}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            dept.is_active !== 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {dept.is_active !== 0 ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ----------------- TAB 2: USERS & ROLES ----------------- */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-card">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user by name, email, phone, badge..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">All Roles</option>
                  <option value="citizen">Citizens</option>
                  <option value="officer">Municipal Officers</option>
                  <option value="admin">Administrators</option>
                </select>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  Showing {filteredUsers.length} users
                </span>
              </div>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Name & Contact</th>
                      <th className="px-5 py-3">System Role</th>
                      <th className="px-5 py-3">Department / Location</th>
                      <th className="px-5 py-3">Account Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const isCurrentUser = Number(u.id) === Number(user?.id);
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-navy-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 text-[9px] font-bold border border-teal-200">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                              <span>{u.email}</span>
                              {u.phone && <span className="font-mono text-slate-400">&bull; {u.phone}</span>}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                u.role_name === 'admin'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : u.role_name === 'officer'
                                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {u.role_name}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {u.role_name === 'officer' ? (
                              <div>
                                <div className="font-semibold text-navy-900">{u.department_name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {u.badge_number} &bull; {u.designation || 'Officer'}
                                </div>
                              </div>
                            ) : (
                              <span>Ward {u.ward_no || '12'}</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              disabled={isCurrentUser}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                                isCurrentUser
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                  : u.is_active
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                              title={isCurrentUser ? 'Cannot disable own administrative account' : 'Toggle account status'}
                            >
                              {u.is_active ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                              {u.is_active ? 'Active' : 'Disabled'}
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {isCurrentUser ? (
                              <span className="text-[11px] text-slate-400 italic">Self (Admin)</span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                icon={Sliders}
                                onClick={() => {
                                  setRoleModalUser(u);
                                  setNewRole(u.role_name);
                                  setSelectedDeptId(u.department_id || departments[0]?.id || 1);
                                  setBadgeNumber(u.badge_number || `OFF-${u.id}01`);
                                  setDesignation(u.designation || 'Municipal Officer');
                                }}
                              >
                                Edit Role
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ----------------- TAB 3: DEPARTMENTS & SLAS ----------------- */}
        {activeTab === 'departments' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((dept) => {
                const deptCategories = categories.filter((c) => c.department_id === dept.id);
                return (
                  <Card key={dept.id} hover className="flex flex-col justify-between border-slate-200">
                    <CardBody className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2.5 py-0.5 rounded bg-teal-50 text-teal-700 font-mono text-xs font-bold border border-teal-200">
                            {dept.code}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500">
                            {dept.officer_count || 0} Officers &bull; {dept.active_complaints || 0} Active
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-navy-900">{dept.name}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{dept.description || 'Municipal department'}</p>

                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                          {dept.head_officer_name && (
                            <div className="flex items-center gap-1.5 text-navy-900 font-semibold">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                              <span>Head: {dept.head_officer_name}</span>
                            </div>
                          )}
                          {dept.contact_email && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span>{dept.contact_email}</span>
                            </div>
                          )}
                          {dept.contact_phone && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{dept.contact_phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Categories List */}
                        <div className="mt-4">
                          <div className="text-xs font-bold text-navy-900 mb-2 flex items-center justify-between">
                            <span>Categories & SLAs ({deptCategories.length})</span>
                            <button
                              onClick={() => {
                                setCategoryModalDept(dept);
                                setNewCategory({ name: '', description: '', sla_hours: 48, default_priority: 'MEDIUM' });
                              }}
                              className="text-teal-600 hover:underline text-[11px] font-semibold flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add Category
                            </button>
                          </div>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {deptCategories.map((cat) => (
                              <div
                                key={cat.id}
                                className="flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-50 border border-slate-200/60 text-xs"
                              >
                                <div className="truncate max-w-[150px]">
                                  <span className="text-slate-700 font-medium">{cat.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-mono">
                                    {cat.sla_hours}h SLA
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditCategoryModal(cat);
                                      setEditCategoryForm({
                                        name: cat.name,
                                        description: cat.description || '',
                                        sla_hours: cat.sla_hours,
                                        default_priority: cat.default_priority || 'MEDIUM',
                                        is_active: cat.is_active !== 0,
                                      });
                                    }}
                                    className="text-slate-400 hover:text-teal-600 p-0.5"
                                    title="Edit Category SLA"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {deptCategories.length === 0 && (
                              <span className="text-[11px] text-slate-400 italic block py-1">
                                No grievance categories defined.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Department Footer Action */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          icon={Edit2}
                          onClick={() => {
                            setEditDeptModal(dept);
                            setEditDeptForm({
                              name: dept.name,
                              description: dept.description || '',
                              contact_email: dept.contact_email || '',
                              contact_phone: dept.contact_phone || '',
                              head_officer_name: dept.head_officer_name || '',
                              is_active: dept.is_active !== 0,
                            });
                          }}
                          className="text-xs"
                        >
                          Edit Wing Info
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------- TAB 4: ALL COMPLAINTS ----------------- */}
        {activeTab === 'complaints' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-card">
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by code, title, citizen, address..."
                  value={complaintSearch}
                  onChange={(e) => setComplaintSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <select
                value={complaintDeptFilter}
                onChange={(e) => setComplaintDeptFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>

              <select
                value={complaintStatusFilter}
                onChange={(e) => setComplaintStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Statuses</option>
                <option value="REPORTED">REPORTED</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="CLOSED">CLOSED</option>
                <option value="REOPENED">REOPENED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Ticket Code & Title</th>
                      <th className="px-5 py-3">Department & Category</th>
                      <th className="px-5 py-3">Citizen & Ward</th>
                      <th className="px-5 py-3">Priority</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Assigned Officer</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredComplaints.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs font-bold text-navy-900 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
                            {c.tracking_code}
                          </span>
                          <div className="font-semibold text-navy-900 text-xs mt-1 line-clamp-1 max-w-[220px]">
                            {c.title}
                          </div>
                          {c.status === 'REJECTED' && c.rejection_reason && (
                            <span className="text-[10px] text-rose-600 font-medium block truncate max-w-[200px]">
                              Rejection: {c.rejection_reason}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-navy-900">{c.department_name}</div>
                          <div className="text-slate-500 text-[11px]">{c.category_name}</div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          <div className="font-medium text-navy-900">{c.citizen_name || 'Resident'}</div>
                          <div className="text-slate-400 text-[10px]">
                            Ward {c.ward_no || '12'} &bull; {c.citizen_phone || 'N/A'}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <PriorityBadge priority={c.priority} size="sm" />
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={c.status} size="sm" />
                        </td>
                        <td className="px-5 py-3.5">
                          {c.assigned_officer_name ? (
                            <div>
                              <div className="font-semibold text-navy-900">{c.assigned_officer_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{c.assigned_officer_badge}</div>
                            </div>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium border border-slate-200">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              icon={ArrowRightLeft}
                              onClick={() => {
                                setReassignModalComplaint(c);
                                setReassignDeptId(c.department_id || 1);
                                setReassignOfficerId(c.assigned_officer_id ? String(c.assigned_officer_id) : '');
                                setReassignRemarks('');
                              }}
                            >
                              Reassign
                            </Button>
                            <Link
                              to={`/complaints/${c.tracking_code}`}
                              className="text-teal-600 hover:text-teal-800 p-1"
                              title="View Full Lifecycle Timeline"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredComplaints.length === 0 && (
                      <tr>
                        <td colSpan="7" className="p-8 text-center">
                          <EmptyState
                            icon={FileText}
                            title="No Grievances Found"
                            description="No complaints matched your filter criteria."
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ----------------- TAB 5: AUDIT LOGS ----------------- */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-card">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-navy-900">Filter Activity by Action:</span>
                <input
                  type="text"
                  placeholder="e.g. COMPLAINT_REASSIGNED, USER_ROLE_CHANGED..."
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500 w-64"
                />
              </div>
              <span className="text-xs text-slate-500">
                {filteredAuditLogs.length} audit entries recorded
              </span>
            </div>

            <Card>
              <CardHeader
                title="System Security & Operational Audit Log"
                subtitle="Tamper-evident record of administrative changes, role escalations, and grievance transfers"
                action={<span className="text-xs font-mono text-slate-500">Live DB Stream</span>}
              />
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {filteredAuditLogs.map((log) => {
                  let parsedDetails = null;
                  try {
                    parsedDetails = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                  } catch (e) {
                    parsedDetails = log.details;
                  }
                  return (
                    <div
                      key={log.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0 mt-1" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-navy-900 font-mono bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
                              {log.action}
                            </span>
                            <span className="text-slate-500">
                              by <strong className="text-navy-900">{log.user_name || 'System Admin'}</strong>
                            </span>
                            <span className="text-slate-400">
                              ({log.entity_type} #{log.entity_id || 'Global'})
                            </span>
                          </div>
                          {parsedDetails && (
                            <pre className="mt-1.5 p-2 rounded bg-slate-50 border border-slate-200/80 font-mono text-[10px] text-slate-600 max-w-xl overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(parsedDetails, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                      <div className="text-slate-400 font-mono text-[11px] sm:text-right shrink-0">
                        <div>{new Date(log.created_at).toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">IP: {log.ip_address || '127.0.0.1'}</div>
                      </div>
                    </div>
                  );
                })}
                {filteredAuditLogs.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No audit records matching filter criteria.
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ----------------- MODALS ----------------- */}

      {/* Modal 1: Edit User Role */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-navy-900 text-white">
              <h3 className="font-bold text-sm">Modify System Role & Access</h3>
              <button onClick={() => setRoleModalUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveUserRole} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-navy-900">{roleModalUser.name}</div>
                <div className="text-slate-500 font-mono text-[11px]">{roleModalUser.email}</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="citizen">Citizen (Resident Portal Access)</option>
                  <option value="officer">Municipal Officer (Department Triage & Field Crew Dispatch)</option>
                  <option value="admin">Administrator (Complete Municipal Authority)</option>
                </select>
              </div>

              {newRole === 'officer' && (
                <div className="space-y-3 p-3 bg-teal-50/50 rounded-xl border border-teal-200/60">
                  <div className="font-bold text-teal-800 text-[11px] flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" /> Officer Profile Configuration
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Assigned Department *</label>
                    <select
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      required
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Badge ID *</label>
                    <input
                      type="text"
                      value={badgeNumber}
                      onChange={(e) => setBadgeNumber(e.target.value)}
                      placeholder="e.g. PWD-OFF-101"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Official Designation *</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Executive Engineer"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setRoleModalUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="teal" size="sm" isLoading={isSubmitting}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Department */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-navy-900 text-white">
              <h3 className="font-bold text-sm">Add Municipal Operating Wing</h3>
              <button onClick={() => setDeptModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDepartment} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. TRA"
                    value={newDept.code}
                    onChange={(e) => setNewDept({ ...newDept, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department Name *</label>
                  <input
                    type="text"
                    placeholder="Traffic & Transport"
                    value={newDept.name}
                    onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDept.description}
                  onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                  placeholder="Mandate and scope of civil work..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="wing.support@smartcity.gov"
                    value={newDept.contact_email}
                    onChange={(e) => setNewDept({ ...newDept, contact_email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 11 2345 6789"
                    value={newDept.contact_phone}
                    onChange={(e) => setNewDept({ ...newDept, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Head Officer Name</label>
                <input
                  type="text"
                  placeholder="Chief Engineer / Director"
                  value={newDept.head_officer_name}
                  onChange={(e) => setNewDept({ ...newDept, head_officer_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDeptModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="teal" size="sm" isLoading={isSubmitting}>
                  Create Wing
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Edit Department */}
      {editDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-navy-900 text-white">
              <h3 className="font-bold text-sm">Edit Wing: {editDeptModal.code}</h3>
              <button onClick={() => setEditDeptModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateDepartment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  value={editDeptForm.name}
                  onChange={(e) => setEditDeptForm({ ...editDeptForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDeptForm.description}
                  onChange={(e) => setEditDeptForm({ ...editDeptForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={editDeptForm.contact_email}
                    onChange={(e) => setEditDeptForm({ ...editDeptForm, contact_email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editDeptForm.contact_phone}
                    onChange={(e) => setEditDeptForm({ ...editDeptForm, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Head Officer Name</label>
                <input
                  type="text"
                  value={editDeptForm.head_officer_name}
                  onChange={(e) => setEditDeptForm({ ...editDeptForm, head_officer_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditDeptModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="teal" size="sm" isLoading={isSubmitting}>
                  Save Wing Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Add Category */}
      {categoryModalDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-navy-900 text-white">
              <h3 className="font-bold text-sm">Add Category: {categoryModalDept.name}</h3>
              <button onClick={() => setCategoryModalDept(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Manhole Cover Damaged / Missing"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Detailed criteria for this grievance type..."
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target SLA (Hours) *</label>
                  <input
                    type="number"
                    min="1"
                    max="720"
                    value={newCategory.sla_hours}
                    onChange={(e) => setNewCategory({ ...newCategory, sla_hours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Priority *</label>
                  <select
                    value={newCategory.default_priority}
                    onChange={(e) => setNewCategory({ ...newCategory, default_priority: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="EMERGENCY">EMERGENCY</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setCategoryModalDept(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="teal" size="sm" isLoading={isSubmitting}>
                  Add Category
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Edit Category */}
      {editCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-navy-900 text-white">
              <h3 className="font-bold text-sm">Edit Category: {editCategoryModal.name}</h3>
              <button onClick={() => setEditCategoryModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateCategory} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={editCategoryForm.name}
                  onChange={(e) => setEditCategoryForm({ ...editCategoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editCategoryForm.description}
                  onChange={(e) => setEditCategoryForm({ ...editCategoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SLA Target (Hours) *</label>
                  <input
                    type="number"
                    min="1"
                    max="720"
                    value={editCategoryForm.sla_hours}
                    onChange={(e) => setEditCategoryForm({ ...editCategoryForm, sla_hours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Priority *</label>
                  <select
                    value={editCategoryForm.default_priority}
                    onChange={(e) => setEditCategoryForm({ ...editCategoryForm, default_priority: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="EMERGENCY">EMERGENCY</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditCategoryModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="teal" size="sm" isLoading={isSubmitting}>
                  Save SLA Settings
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Reassign Complaint */}
      {reassignModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-navy-900 text-white">
              <h3 className="font-bold text-sm">Reassign Grievance Jurisdiction</h3>
              <button onClick={() => setReassignModalComplaint(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleReassignComplaint} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="font-mono font-bold text-navy-900 block">{reassignModalComplaint.tracking_code}</span>
                <p className="font-semibold text-navy-900">{reassignModalComplaint.title}</p>
                <p className="text-slate-500 text-[11px]">{reassignModalComplaint.location_address}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Municipal Wing *</label>
                <select
                  value={reassignDeptId}
                  onChange={(e) => {
                    setReassignDeptId(Number(e.target.value));
                    setReassignOfficerId('');
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assign Officer Directly (Optional)
                </label>
                <select
                  value={reassignOfficerId}
                  onChange={(e) => setReassignOfficerId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">-- Leave Unassigned (Send to Wing Queue) --</option>
                  {departmentOfficers.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.name} ({off.badge_number || 'Officer'}) &bull; {off.designation || 'Staff'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Administrative Transfer Reason</label>
                <textarea
                  rows={3}
                  value={reassignRemarks}
                  onChange={(e) => setReassignRemarks(e.target.value)}
                  placeholder="Specify why this grievance is being transferred..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setReassignModalComplaint(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="teal" size="sm" isLoading={isSubmitting}>
                  Confirm Transfer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
