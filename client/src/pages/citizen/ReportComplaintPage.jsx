import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  AlertTriangle, 
  MapPin, 
  Camera, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  ArrowLeft, 
  Crosshair, 
  Image as ImageIcon,
  Send,
  Info,
  UploadCloud,
  X,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import LocationPickerMap from '../../components/common/LocationPickerMap';

const SAMPLE_PHOTOS = [
  {
    label: 'Road Pothole',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Streetlight Out',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Garbage Overflow',
    url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Burst Water Pipe',
    url: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Fallen Tree Branch',
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
  },
];

export default function ReportComplaintPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [meta, setMeta] = useState({ departments: [], categories: [] });
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    category_id: '',
    department_id: '',
    title: '',
    description: '',
    location_address: user?.address || '',
    ward_no: user?.ward_no || 'Ward-12',
    priority: 'MEDIUM',
    latitude: 28.613939,
    longitude: 77.209021,
    photo_url: '',
  });

  // Photo upload states
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  const wards = Array.from({ length: 24 }, (_, i) => `Ward-${String(i + 1).padStart(2, '0')}`);

  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await api.get('/complaints/meta');
        if (res.data?.success) {
          const { departments, categories } = res.data.data;
          setMeta({ departments, categories });
          if (categories.length > 0) {
            setFormData((prev) => ({
              ...prev,
              category_id: String(categories[0].id),
              department_id: String(categories[0].department_id),
              priority: categories[0].default_priority || 'MEDIUM',
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load complaint metadata:', err);
      } finally {
        setLoadingMeta(false);
      }
    }

    loadMeta();
  }, []);

  const handleCategoryChange = (e) => {
    const catId = e.target.value;
    const cat = meta.categories.find((c) => String(c.id) === String(catId));
    if (cat) {
      setFormData((prev) => ({
        ...prev,
        category_id: String(cat.id),
        department_id: String(cat.department_id),
        priority: cat.default_priority || prev.priority,
      }));
    } else {
      setFormData((prev) => ({ ...prev, category_id: catId }));
    }
  };

  // Handle file selection and direct upload via Multer backend API
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit. Please select a smaller photo.');
      return;
    }

    // Validate mime type
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimes.includes(file.type)) {
      setUploadError('Please select a valid image file (JPEG, PNG, WEBP, or GIF).');
      return;
    }

    setUploadError(null);
    setUploadingPhoto(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const res = await api.post('/complaints/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success) {
        setFormData((prev) => ({
          ...prev,
          photo_url: res.data.data.photo_url,
        }));
        setUploadedFileName(file.name);
      }
    } catch (err) {
      setUploadError(err.message || 'Failed to upload photo. You may also enter a photo URL below.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, photo_url: '' }));
    setUploadedFileName('');
    setUploadError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title || formData.title.trim().length < 5) {
      setError('Complaint title must be at least 5 characters.');
      return;
    }

    if (!formData.description || formData.description.trim().length < 10) {
      setError('Detailed description must be at least 10 characters.');
      return;
    }

    if (!formData.location_address || formData.location_address.trim().length < 5) {
      setError('Please provide a specific address or landmark (min 5 characters).');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category_id: parseInt(formData.category_id, 10),
        department_id: parseInt(formData.department_id, 10),
        location_address: formData.location_address.trim(),
        ward_no: formData.ward_no,
        priority: formData.priority,
        latitude: formData.latitude !== '' ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude !== '' ? parseFloat(formData.longitude) : null,
        photo_url: formData.photo_url || null,
      };

      const res = await api.post('/complaints', payload);
      if (res.data?.success) {
        setSuccessData(res.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit complaint. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = meta.categories.find(
    (c) => String(c.id) === String(formData.category_id)
  );

  const selectedDept = meta.departments.find(
    (d) => String(d.id) === String(formData.department_id)
  );

  const handleCopyCode = () => {
    if (successData?.tracking_code) {
      navigator.clipboard.writeText(successData.tracking_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/citizen/dashboard"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-navy-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Citizen Dashboard
        </Link>
        <span className="text-xs text-slate-400 font-mono">Form Ref: REG-CMP-01</span>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-2xl p-6 text-white mb-8 border border-navy-800 shadow-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center shrink-0 shadow-sm">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-semibold mb-1 border border-teal-500/30">
              <span>Phase 06 &bull; Grievance Registration</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Report Municipal Grievance
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Submit your issue directly to the responsible civic department with photographic proof and GPS location. 
              A unique tracking code will be generated immediately for verified audit tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal Confirmation Overlay */}
      {successData && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 text-center shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold uppercase tracking-wider">
              Status: REPORTED
            </span>

            <h2 className="text-xl sm:text-2xl font-bold text-navy-900 mt-3 mb-1">
              Grievance Successfully Registered
            </h2>
            <p className="text-xs text-slate-600 mb-6">
              Your issue has been logged into the municipal dispatch queue. Use the unique tracking code below to follow every lifecycle stage.
            </p>

            {/* Unique Tracking Code Box */}
            <div className="bg-slate-50 border-2 border-dashed border-teal-300 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Official Tracking Code</span>
                <span className="font-mono text-lg sm:text-xl font-extrabold text-navy-900">
                  {successData.tracking_code}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-teal-600" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link to={`/complaints/${successData.tracking_code}`}>
                <Button variant="teal" className="w-full text-xs" icon={ExternalLink}>
                  Track Progress
                </Button>
              </Link>
              <Link to="/citizen/dashboard">
                <Button variant="outline" className="w-full text-xs">
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Reporting Form */}
      <Card className="shadow-card border-slate-200">
        <CardBody className="p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Classification & Department */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <span>1. Issue Classification & Department Allocation</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Complaint Category *
                  </label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={handleCategoryChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium text-navy-900"
                  >
                    {meta.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Responsible Department (Auto-allocated)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedDept?.name || 'Loading...'}
                    className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-100 text-slate-700 rounded-lg cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              {/* SLA Banner */}
              {selectedCategory && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>
                      Civic SLA Guarantee: <strong>{selectedCategory.sla_hours} Hours</strong>
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Dept Code: <strong className="text-navy-900">{selectedDept?.code}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Section 2: Problem Description & Priority */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <span>2. Grievance Details</span>
              </h3>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700">
                    Complaint Title * (5 - 150 characters)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {formData.title.length}/150
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={150}
                  placeholder="e.g. Deep pothole cluster causing two-wheeler skids"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700">
                    Detailed Description * (min 10 characters)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {formData.description.length} characters
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide complete details including dimensions, landmarks, duration of the issue, and danger to public safety..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Urgency Priority
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'LOW', label: 'Low', desc: 'Minor issue' },
                    { id: 'MEDIUM', label: 'Medium', desc: 'Standard civic' },
                    { id: 'HIGH', label: 'High', desc: 'Traffic / Safety' },
                    { id: 'EMERGENCY', label: 'Emergency', desc: 'Critical danger' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: p.id })}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        formData.priority === p.id
                          ? p.id === 'EMERGENCY'
                            ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-400/20'
                            : p.id === 'HIGH'
                            ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-400/20'
                            : 'bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-400/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{p.label}</div>
                      <div className="text-[10px] text-slate-500">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 3: Location and Interactive Map Location Picker */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <span>3. Location & Geospatial Map Coordinates</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Location Address / Nearest Landmark *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Near Gate 2, Greenfield Apartments, 5th Cross Road"
                    value={formData.location_address}
                    onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Municipal Ward *
                  </label>
                  <select
                    required
                    value={formData.ward_no}
                    onChange={(e) => setFormData({ ...formData, ward_no: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium"
                  >
                    {wards.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Embedded Interactive Leaflet Map Location Picker */}
              <LocationPickerMap
                latitude={formData.latitude}
                longitude={formData.longitude}
                onChange={(lat, lng) =>
                  setFormData((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                  }))
                }
              />
            </div>

            {/* Section 4: Photographic Proof & Multer File Upload */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <span>4. Photographic Evidence (Upload or URL)</span>
              </h3>

              {/* Multer Direct Image Upload Box */}
              <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-200">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-navy-900 block">
                        Upload Photo from Device (Multer Backend)
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        JPEG, PNG, WEBP, or GIF up to 5MB
                      </span>
                    </div>
                  </div>

                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 shadow-sm transition-colors">
                      <Camera className="w-3.5 h-3.5 text-teal-600" />
                      <span>{uploadingPhoto ? 'Uploading...' : 'Browse Photo'}</span>
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileUpload}
                      disabled={uploadingPhoto}
                      className="hidden"
                    />
                  </label>
                </div>

                {uploadError && (
                  <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    {uploadError}
                  </div>
                )}
              </div>

              {/* Optional Direct URL input */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Or enter external image URL directly:
                </label>
                <input
                  type="text"
                  placeholder="https://... or /uploads/..."
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none mb-2 font-mono"
                />

                {/* Preset sample images for quick grading/testing */}
                <div className="text-[11px] text-slate-500 mb-2">Or select a sample demonstration image:</div>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_PHOTOS.map((photo) => (
                    <button
                      key={photo.label}
                      type="button"
                      onClick={() => setFormData({ ...formData, photo_url: photo.url })}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                        formData.photo_url === photo.url
                          ? 'bg-teal-50 border-teal-500 text-teal-900 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {photo.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo Live Preview */}
              {formData.photo_url && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={formData.photo_url}
                      alt="Proof Preview"
                      className="w-16 h-16 object-cover rounded-lg border border-slate-300 shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div>
                      <span className="text-xs font-bold text-navy-900 block flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-teal-600" />
                        <span>Photo Proof Attached</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono truncate max-w-xs block mt-0.5">
                        {uploadedFileName || formData.photo_url}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Submission Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link to="/citizen/dashboard">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="teal"
                size="md"
                isLoading={isSubmitting}
                icon={Send}
                className="shadow-sm px-6"
              >
                Submit Grievance
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
