import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  HardHat, 
  User, 
  ShieldCheck, 
  Star, 
  MessageSquare, 
  Send, 
  RefreshCw, 
  RotateCcw,
  ExternalLink,
  Copy,
  Check,
  Phone,
  Mail,
  ShieldAlert,
  FileText,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import Button from '../../components/ui/Button';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import LoadingState from '../../components/ui/LoadingState';
import AlertBanner from '../../components/ui/AlertBanner';

// Custom SVG pin for the location preview
const locationPreviewIcon = L.divIcon({
  className: 'complaint-detail-map-pin',
  html: `
    <div style="position: relative; width: 32px; height: 32px;">
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        background: #13A89E;
        position: absolute;
        transform: rotate(-45deg);
        left: 2px;
        top: 2px;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: #ffffff;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const WORKFLOW_STEPS = [
  { key: 'REPORTED', label: '1. Reported', desc: 'Complaint registered' },
  { key: 'ASSIGNED', label: '2. Assigned', desc: 'Assigned to officer' },
  { key: 'IN_PROGRESS', label: '3. In Progress', desc: 'Field repair active' },
  { key: 'RESOLVED', label: '4. Resolved', desc: 'Officer marked complete' },
  { key: 'VERIFIED', label: '5. Verified', desc: 'Citizen verified outcome' },
  { key: 'CLOSED', label: '6. Closed', desc: 'Audit archived' },
];

export default function ComplaintDetailsPage() {
  const { idOrCode } = useParams();
  const { user, isAuthenticated, isCitizen, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Action modals
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [reopenRemarks, setReopenRemarks] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchComplaint = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/complaints/${idOrCode}`);
      if (res.data?.success) {
        setComplaint(res.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [idOrCode]);

  const handleCopyTrackingCode = () => {
    if (complaint?.tracking_code) {
      navigator.clipboard.writeText(complaint.tracking_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setIsProcessingAction(true);
    setError(null);

    try {
      const res = await api.post(`/complaints/${complaint.id}/verify`, {
        rating,
        comments: feedbackComments,
      });

      if (res.data?.success) {
        setActionSuccess('Grievance has been verified! Thank you for rating the municipal service.');
        setShowVerifyModal(false);
        fetchComplaint();
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!reopenRemarks || reopenRemarks.trim().length < 5) {
      setError('Please provide a reason with at least 5 characters for rejecting resolution.');
      return;
    }

    setIsProcessingAction(true);
    setError(null);

    try {
      const res = await api.post(`/complaints/${complaint.id}/reopen`, {
        remarks: reopenRemarks.trim(),
      });

      if (res.data?.success) {
        setActionSuccess('Grievance has been reopened and returned to the department queue for corrective action.');
        setShowReopenModal(false);
        fetchComplaint();
      }
    } catch (err) {
      setError(err.message || 'Failed to reopen complaint.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Determine active step index
  const getStepStatus = (stepKey, currentStatus) => {
    if (currentStatus === 'REOPENED') {
      if (['REPORTED', 'ASSIGNED', 'IN_PROGRESS'].includes(stepKey)) return 'completed';
      if (stepKey === 'RESOLVED') return 'reopened';
      return 'pending';
    }

    if (currentStatus === 'REJECTED') {
      if (stepKey === 'REPORTED') return 'rejected';
      return 'pending';
    }

    const statusOrder = ['REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED', 'CLOSED'];
    const currentIdx = statusOrder.indexOf(currentStatus);
    const stepIdx = statusOrder.indexOf(stepKey);

    if (currentIdx > stepIdx) return 'completed';
    if (currentIdx === stepIdx) return 'active';
    return 'pending';
  };

  // Can the current user verify or reopen?
  const canVerifyOrReopen = Boolean(
    isAuthenticated &&
    complaint &&
    complaint.status === 'RESOLVED' &&
    (isAdmin || (user && user.id === complaint.citizen_id))
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <LoadingState message="Retrieving grievance audit history and lifecycle timeline..." />
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-navy-900">Complaint Not Found</h2>
        <p className="text-xs text-slate-600">{error || 'No record matches the provided tracking reference code.'}</p>
        <Link to="/complaints">
          <Button variant="teal">Return to Registry</Button>
        </Link>
      </div>
    );
  }

  const hasCoordinates = Boolean(
    complaint.latitude && 
    complaint.longitude && 
    !isNaN(parseFloat(complaint.latitude)) && 
    !isNaN(parseFloat(complaint.longitude))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/complaints"
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-navy-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Registry
          </Link>
          <span className="text-slate-300">/</span>
          <Link
            to="/citizen/dashboard"
            className="text-xs font-semibold text-slate-500 hover:text-teal-600 transition-colors"
          >
            Citizen Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Tracking Reference:</span>
          <span className="font-mono text-sm font-extrabold text-navy-900 bg-navy-50 px-2.5 py-1 rounded-lg border border-navy-200">
            {complaint.tracking_code}
          </span>
          <button
            type="button"
            onClick={handleCopyTrackingCode}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Copy tracking code"
          >
            {copied ? <Check className="w-4 h-4 text-teal-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Success Alert Banner */}
      {actionSuccess && (
        <AlertBanner
          type="success"
          title="Action Completed"
          message={actionSuccess}
          onClose={() => setActionSuccess(null)}
        />
      )}

      {/* Hero Header Summary Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-2xl p-6 sm:p-8 text-white shadow-card border border-navy-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={complaint.status} size="md" />
              <PriorityBadge priority={complaint.priority} size="md" />
              <span className="text-xs text-teal-300 font-semibold bg-teal-500/20 px-2.5 py-0.5 rounded-full border border-teal-500/30">
                {complaint.department_name} ({complaint.department_code})
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
              {complaint.title}
            </h1>

            <p className="text-xs text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{complaint.location_address} ({complaint.ward_no})</span>
            </p>
          </div>

          <div className="text-left md:text-right text-xs text-slate-300 space-y-1">
            <div>
              Submitted:{' '}
              <strong className="text-white">
                {new Date(complaint.created_at).toLocaleDateString()} at{' '}
                {new Date(complaint.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </strong>
            </div>
            {complaint.resolved_at && (
              <div className="text-teal-300">
                Resolved:{' '}
                <strong className="text-white">
                  {new Date(complaint.resolved_at).toLocaleDateString()}
                </strong>
              </div>
            )}
            {complaint.sla_hours && (
              <div className="text-slate-400">
                SLA Guarantee: <strong className="text-slate-200">{complaint.sla_hours} Hours</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6-Step Resolution Workflow Stepper */}
      <Card className="border-slate-200">
        <CardHeader
          title="Mandated 6-Stage Resolution Lifecycle"
          subtitle="Real-time progress verified against Municipal Service Level Agreements"
        />
        <CardBody className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {WORKFLOW_STEPS.map((step, idx) => {
              const stepStatus = getStepStatus(step.key, complaint.status);
              return (
                <div
                  key={step.key}
                  className={`p-3.5 rounded-xl border transition-all ${
                    stepStatus === 'completed'
                      ? 'bg-teal-50 border-teal-300 text-teal-900'
                      : stepStatus === 'active'
                      ? 'bg-navy-50 border-navy-600 text-navy-900 ring-2 ring-teal-500/30 shadow-sm'
                      : stepStatus === 'reopened'
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : stepStatus === 'rejected'
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      0{idx + 1}
                    </span>
                    {stepStatus === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    ) : stepStatus === 'active' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping" />
                    ) : null}
                  </div>
                  <div className="font-bold text-xs">{step.label}</div>
                  <div className="text-[10px] mt-0.5 line-clamp-1">{step.desc}</div>
                </div>
              );
            })}
          </div>

          {/* Reopened Banner */}
          {complaint.status === 'REOPENED' && (
            <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
              <span>
                <strong>Grievance Reopened:</strong> Resident rejected prior resolution. Ticket returned to department queue for secondary corrective action.
              </span>
            </div>
          )}

          {/* Rejected Banner */}
          {complaint.status === 'REJECTED' && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Grievance Rejected:</strong> {complaint.rejection_reason || 'This issue does not fall under municipal jurisdiction or lacks verifiable grounds.'}
              </span>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Citizen Resolution Verification / Reopen Action Callout */}
      {canVerifyOrReopen && (
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-300 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-200 text-teal-900 text-[10px] font-bold uppercase tracking-wider">
                Action Required from Citizen
              </span>
              <h3 className="text-base font-bold text-navy-900">
                Municipal Officer has marked this grievance as RESOLVED
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                Please inspect the site location. If the repair meets municipal quality standards, confirm resolution and submit your 5-star rating. 
                If the problem persists, you can immediately reject the fix and reopen the case.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="teal"
                size="md"
                onClick={() => setShowVerifyModal(true)}
                icon={CheckCircle2}
                className="shadow-sm whitespace-nowrap"
              >
                Verify & Rate Fix
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => setShowReopenModal(true)}
                icon={RotateCcw}
                className="shadow-sm whitespace-nowrap"
              >
                Reject & Reopen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Details & History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Columns: Details, Map, and Photographic Evidence */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-slate-200">
            <CardHeader
              title="Grievance Details"
              subtitle="Original citizen submission details and geographic evidence"
            />
            <CardBody className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Description
                </h4>
                <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {complaint.description}
                </p>
              </div>

              {/* Photographic Proof */}
              {complaint.photo_url && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Photographic Proof Attached
                  </h4>
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                    <img
                      src={complaint.photo_url}
                      alt="Complaint Evidence"
                      className="w-full max-h-80 object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Location Coordinates & Leaflet Mini-Map Preview */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Geospatial Coordinates & Location
                </h4>

                {hasCoordinates ? (
                  <div className="space-y-2">
                    <div className="h-48 rounded-xl overflow-hidden border border-slate-200 relative z-0">
                      <MapContainer
                        center={[parseFloat(complaint.latitude), parseFloat(complaint.longitude)]}
                        zoom={15}
                        scrollWheelZoom={false}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker
                          position={[parseFloat(complaint.latitude), parseFloat(complaint.longitude)]}
                          icon={locationPreviewIcon}
                        >
                          <Popup>
                            <div className="text-xs">
                              <strong>{complaint.tracking_code}</strong>
                              <br />
                              {complaint.location_address}
                            </div>
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Ward</span>
                        <span className="font-bold text-navy-900">{complaint.ward_no}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Coordinates</span>
                        <span className="font-mono text-navy-900">
                          {complaint.latitude}, {complaint.longitude}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
                    Geotagged via Municipal Ward Center ({complaint.ward_no})
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Citizen Feedback Review Card (if already verified with rating) */}
          {complaint.feedback && (
            <Card className="border-teal-200 bg-teal-50/30">
              <CardHeader
                title="Citizen Satisfaction Review"
                subtitle="Verified post-resolution feedback rating"
              />
              <CardBody className="space-y-2">
                <div className="flex items-center gap-1.5 text-amber-500">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < complaint.feedback.rating ? 'fill-current' : 'text-slate-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 font-bold text-xs text-navy-900">
                    {complaint.feedback.rating} / 5 Stars ({complaint.feedback.satisfaction_level})
                  </span>
                </div>
                {complaint.feedback.comments && (
                  <p className="text-xs text-slate-700 italic bg-white p-3 rounded-lg border border-teal-100">
                    "{complaint.feedback.comments}"
                  </p>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right 5 Columns: Assigned Officer & Chronological Status History */}
        <div className="lg:col-span-5 space-y-6">
          {/* Assigned Officer Card */}
          <Card className="border-slate-200">
            <CardHeader
              title="Assigned Municipal Officer"
              subtitle="Responsible departmental supervisor"
            />
            <CardBody className="p-4">
              {complaint.officer_name ? (
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-200">
                    <HardHat className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className="font-bold text-navy-900 text-sm">{complaint.officer_name}</div>
                    <div className="text-teal-700 font-semibold">{complaint.officer_designation}</div>
                    <div className="text-slate-500">{complaint.department_name}</div>
                    <div className="font-mono text-[10px] text-slate-400 mt-1">Badge: {complaint.officer_badge}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-400">
                  <Clock className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                  Awaiting zonal department officer assignment.
                </div>
              )}
            </CardBody>
          </Card>

          {/* Chronological Status Audit Timeline */}
          <Card className="border-slate-200">
            <CardHeader
              title="Chronological Status Audit Trail"
              subtitle="Immutable log of all lifecycle transitions"
            />
            <CardBody className="p-5">
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {(complaint.status_history || []).map((entry, idx) => (
                  <div key={entry.id || idx} className="relative text-xs space-y-1">
                    {/* Timeline bullet dot */}
                    <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-teal-500" />

                    <div className="flex items-center justify-between">
                      <StatusBadge status={entry.new_status} size="sm" />
                      <span className="text-[10px] text-slate-400">
                        {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      By: <strong className="text-navy-900 font-semibold">{entry.changed_by_name}</strong>{' '}
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                        {entry.changed_by_role}
                      </span>
                    </div>

                    {entry.remarks && (
                      <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed text-xs">
                        {entry.remarks}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Verify Resolution Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-bold text-navy-900 mb-1">Verify Complaint Resolution</h3>
            <p className="text-xs text-slate-500 mb-4">
              Confirm that the issue has been satisfactorily resolved and submit your citizen satisfaction rating.
            </p>

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Satisfaction Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-1 text-2xl transition-transform hover:scale-110 ${
                        star <= rating ? 'text-amber-400' : 'text-slate-200'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-xs font-bold text-navy-900 ml-2">
                    {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : 'Poor'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Feedback Review (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Share your experience on the repair quality and municipal response time..."
                  value={feedbackComments}
                  onChange={(e) => setFeedbackComments(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowVerifyModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="teal" size="sm" isLoading={isProcessingAction}>
                  Confirm & Mark Verified
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reopen Complaint Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-bold text-navy-900 mb-1">Reject Resolution & Reopen</h3>
            <p className="text-xs text-slate-500 mb-4">
              State clearly why the repair is unsatisfactory. The assigned department officer will be notified immediately.
            </p>

            <form onSubmit={handleReopenSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Rejection * (min 5 characters)
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g., The pothole patch eroded during rain; the streetlight flickers on and off..."
                  value={reopenRemarks}
                  onChange={(e) => setReopenRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowReopenModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="danger" size="sm" isLoading={isProcessingAction} icon={RotateCcw}>
                  Reject & Reopen
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
