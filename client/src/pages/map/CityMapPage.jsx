import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Flame,
  Layers,
  Filter,
  Search,
  RefreshCw,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  Compass,
  Maximize2,
  Eye,
  Shield,
  HardHat,
  Phone,
  User,
  Radio,
  X,
  RotateCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Center coordinates for Delhi municipal territory
const DEFAULT_CENTER = [28.613939, 77.209021];

const WARD_COORDINATES = {
  'Ward-01': [28.6350, 77.2250],
  'Ward-04': [28.6010, 77.1950],
  'Ward-08': [28.6289, 77.2180],
  'Ward-12': [28.6139, 77.2090],
  'Ward-14': [28.5900, 77.2300],
  'Ward-15': [28.5800, 77.2100],
};

// Custom DivIcons for Leaflet pins
const createComplaintIcon = (priority, status, isSelected = false) => {
  const isEmergency = priority === 'EMERGENCY';
  const isHigh = priority === 'HIGH';
  const isResolved = ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(status);

  const bg = isEmergency ? '#ef4444' : isHigh ? '#f59e0b' : isResolved ? '#10b981' : '#3b82f6';
  const border = isSelected ? '#ffffff' : '#090d16';
  const size = isSelected ? 34 : 26;

  return L.divIcon({
    className: 'custom-smart-city-pin',
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px;">
        ${isEmergency ? '<div style="position: absolute; inset: -5px; border-radius: 50%; background: rgba(239, 68, 68, 0.4); animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50% 50% 50% 0;
          background: ${bg};
          position: absolute;
          transform: rotate(-45deg);
          border: 2px solid ${border};
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: ${size > 30 ? 8 : 6}px;
            height: ${size > 30 ? 8 : 6}px;
            background: #ffffff;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

const createWorkerIcon = (isAvailable) => {
  const bg = isAvailable ? '#10b981' : '#94a3b8';
  return L.divIcon({
    className: 'custom-worker-pin',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #0f172a;
        border: 2px solid ${bg};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 8px rgba(0,0,0,0.6);
        font-size: 13px;
      ">
        👷
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

// Map Recenter Helper Component
function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 14, { duration: 1.0 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function CityMapPage() {
  const { user, isOfficer, isAdmin } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [heatmapData, setHeatmapData] = useState(null);
  const [officerViewData, setOfficerViewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  // View Modes: 'pins' | 'heatmap'
  const [viewMode, setViewMode] = useState('pins');
  // Map Engine: 'leaflet' | 'svg'
  const [mapEngine, setMapEngine] = useState('leaflet');
  // Officer View Toggle
  const [isOfficerMode, setIsOfficerMode] = useState(Boolean(isOfficer || isAdmin));

  // Filters
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Pin / Active Popup
  const [activePin, setActivePin] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(13);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchMapData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const promises = [
        api.get('/map/complaints').catch(() => ({ data: { success: false } })),
        api.get('/map/clusters').catch(() => ({ data: { success: false } })),
        api.get('/map/heatmap').catch(() => ({ data: { success: false } })),
      ];

      if (isOfficer || isAdmin) {
        promises.push(
          api.get('/map/officer-view').catch(() => ({ data: { success: false } }))
        );
      }

      const results = await Promise.all(promises);
      const [pinsRes, clustersRes, heatmapRes, officerRes] = results;

      if (pinsRes.data?.success) setComplaints(pinsRes.data.data);
      if (clustersRes.data?.success) setClusters(clustersRes.data.data);
      if (heatmapRes.data?.success) setHeatmapData(heatmapRes.data.data);
      if (officerRes?.data?.success) setOfficerViewData(officerRes.data.data);

      if (isManual) showToast('Geospatial GIS layers updated!');
    } catch (err) {
      console.error('Error fetching map data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, [isOfficer, isAdmin]);

  // Update center when ward filter changes
  useEffect(() => {
    if (selectedWard && WARD_COORDINATES[selectedWard]) {
      setMapCenter(WARD_COORDINATES[selectedWard]);
      setMapZoom(15);
    } else if (!selectedWard) {
      setMapCenter(DEFAULT_CENTER);
      setMapZoom(13);
    }
  }, [selectedWard]);

  const resetFilters = () => {
    setSelectedDept('');
    setSelectedPriority('');
    setSelectedStatus('');
    setSelectedWard('');
    setSearchQuery('');
    setMapCenter(DEFAULT_CENTER);
    setMapZoom(13);
  };

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    let list = isOfficerMode && officerViewData?.complaints
      ? officerViewData.complaints
      : complaints;

    return list.filter((c) => {
      const matchesDept =
        !selectedDept ||
        c.department_code === selectedDept ||
        c.department_id === Number(selectedDept);
      const matchesPriority = !selectedPriority || c.priority === selectedPriority;
      const matchesStatus = !selectedStatus || c.status === selectedStatus;
      const matchesWard =
        !selectedWard || c.ward_no === selectedWard || c.ward_no === selectedWard.replace('Ward-', '');
      const matchesSearch =
        !searchQuery ||
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tracking_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.location_address?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesDept && matchesPriority && matchesStatus && matchesWard && matchesSearch;
    });
  }, [complaints, officerViewData, isOfficerMode, selectedDept, selectedPriority, selectedStatus, selectedWard, searchQuery]);

  // Coordinates mapping for SVG Radar Grid view
  const mapCoordsToSvg = (lat, lng, index = 0) => {
    const minLat = 28.57;
    const maxLat = 28.65;
    const minLng = 77.18;
    const maxLng = 77.25;

    const latNum = Number(lat) || 28.6139 + index * 0.008;
    const lngNum = Number(lng) || 77.2090 + index * 0.008;

    const x = ((lngNum - minLng) / (maxLng - minLng)) * 800;
    const y = 500 - ((latNum - minLat) / (maxLat - minLat)) * 500;

    return {
      x: Math.max(40, Math.min(760, x)),
      y: Math.max(40, Math.min(460, y)),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Loading Smart City Geospatial GIS Grid...</p>
        </div>
      </div>
    );
  }

  const fieldWorkers = officerViewData?.field_workers || [];
  const officerKpis = officerViewData?.kpis;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-[1000] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-medium animate-bounce ${
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
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border-b border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Compass className="w-3.5 h-3.5" />
                  GIS Geospatial Grievance Terminal
                </span>
                <span className="text-xs text-slate-400">• Real-Time GPS Tracking</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Interactive City Map & Ward Hotspots
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Real-time spatial visualization of civic complaints, emergency incidents, field crew dispatches, and ward density hotspots.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => fetchMapData(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>

              {/* Officer View Switcher */}
              {(isOfficer || isAdmin) && (
                <button
                  onClick={() => setIsOfficerMode(!isOfficerMode)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-bold transition-all shadow-sm ${
                    isOfficerMode
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  {isOfficerMode ? 'Officer Jurisdiction Active' : 'Enable Officer View'}
                </button>
              )}

              {/* Layer View Mode (Pins vs Heatmap) */}
              <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('pins')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    viewMode === 'pins'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Pins ({filteredComplaints.length})
                </button>
                <button
                  onClick={() => setViewMode('heatmap')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    viewMode === 'heatmap'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  Heatmap ({clusters.length})
                </button>
              </div>

              {/* Map Engine Toggle (Leaflet vs SVG Radar) */}
              <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setMapEngine('leaflet')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    mapEngine === 'leaflet'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="OpenStreetMap Open Tiles"
                >
                  GIS Tiles
                </button>
                <button
                  onClick={() => setMapEngine('svg')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    mapEngine === 'svg'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Dark SVG Tactical Grid"
                >
                  Radar Grid
                </button>
              </div>
            </div>
          </div>

          {/* Officer Dashboard Jurisdiction Bar */}
          {isOfficerMode && officerKpis && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold text-white">
                  Officer Jurisdiction: {officerViewData?.department?.name || 'Department Oversight'}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                  {officerViewData?.department?.code}
                </span>
              </div>

              <div className="flex items-center gap-4 text-slate-300 font-medium">
                <div>
                  Total Department Cases: <strong className="text-white">{officerKpis.total_cases}</strong>
                </div>
                <div>
                  Emergencies: <strong className="text-rose-400">{officerKpis.emergency_cases}</strong>
                </div>
                <div>
                  Active Dispatches: <strong className="text-amber-400">{officerKpis.active_cases}</strong>
                </div>
                <div>
                  Field Workers: <strong className="text-emerald-400">{officerKpis.available_workers} Available</strong> ({officerKpis.total_workers} total)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Map Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">

        {/* Filter Toolbar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Search Tickets</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tracking code, title, address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Departments</option>
                <option value="PWD">Roads & PWD</option>
                <option value="SWM">Solid Waste (SWM)</option>
                <option value="WSS">Water & Sewerage (WSS)</option>
                <option value="ELE">Electricity & Lights (ELE)</option>
                <option value="PRK">Parks & Trees (PRK)</option>
                <option value="HLT">Health & Fogging (HLT)</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Priorities</option>
                <option value="EMERGENCY">EMERGENCY (Critical Red)</option>
                <option value="HIGH">HIGH (Amber)</option>
                <option value="MEDIUM">MEDIUM (Blue)</option>
                <option value="LOW">LOW (Slate)</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Statuses</option>
                <option value="REPORTED">REPORTED</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="CLOSED">CLOSED</option>
                <option value="REOPENED">REOPENED</option>
              </select>
            </div>

            {/* Ward Selector & Reset */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-400">Ward Zone</label>
                {(selectedDept || selectedPriority || selectedStatus || selectedWard || searchQuery) && (
                  <button
                    onClick={resetFilters}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> Reset
                  </button>
                )}
              </div>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Whole City View</option>
                <option value="Ward-01">Ward 01 (Central Square)</option>
                <option value="Ward-04">Ward 04 (Lake View)</option>
                <option value="Ward-08">Ward 08 (Old Town)</option>
                <option value="Ward-12">Ward 12 (Greenfield)</option>
                <option value="Ward-14">Ward 14 (Tech Park)</option>
                <option value="Ward-15">Ward 15 (Riverfront)</option>
              </select>
            </div>
          </div>
        </div>

        {/* GIS Canvas & Overlay Container */}
        <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl min-h-[580px]">

          {/* ---------------- MAP OPTION 1: LEAFLET TILES ENGINE ---------------- */}
          {mapEngine === 'leaflet' && (
            <div className="w-full h-[580px] z-0">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%', background: '#090d16' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapRecenter center={mapCenter} zoom={mapZoom} />

                {/* VIEW MODE 1: COMPLAINT MARKERS */}
                {viewMode === 'pins' &&
                  filteredComplaints.map((c) => {
                    const isSelected = activePin?.id === c.id;
                    const icon = createComplaintIcon(c.priority, c.status, isSelected);

                    return (
                      <Marker
                        key={c.id}
                        position={[c.latitude, c.longitude]}
                        icon={icon}
                        eventHandlers={{
                          click: () => setActivePin(c),
                        }}
                      >
                        <Popup className="custom-popup">
                          <div className="text-xs space-y-2 max-w-xs text-slate-900">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                              <span className="font-mono font-bold text-amber-600">
                                {c.tracking_code}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  c.priority === 'EMERGENCY'
                                    ? 'bg-rose-100 text-rose-700'
                                    : c.priority === 'HIGH'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {c.priority}
                              </span>
                            </div>

                            <h4 className="font-bold text-slate-900 text-xs leading-snug">
                              {c.title}
                            </h4>
                            <p className="text-[11px] text-slate-600 line-clamp-2">
                              {c.description}
                            </p>

                            <div className="bg-slate-100 p-2 rounded text-[10px] space-y-1">
                              <div><strong>Department:</strong> {c.department_name}</div>
                              <div><strong>Location:</strong> {c.location_address || c.ward_no}</div>
                              {c.active_worker_name && (
                                <div className="text-emerald-700 font-semibold">
                                  <strong>Assigned Worker:</strong> {c.active_worker_name}
                                </div>
                              )}
                            </div>

                            <div className="pt-2 flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-slate-500">
                                Status: {c.status}
                              </span>
                              <Link
                                to={`/complaints/${c.tracking_code}`}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-[11px]"
                              >
                                View Case &rarr;
                              </Link>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}

                {/* OFFICER OVERLAY: FIELD WORKERS ON DUTY */}
                {isOfficerMode &&
                  fieldWorkers.map((worker) => (
                    <Marker
                      key={`worker-${worker.id}`}
                      position={[worker.latitude, worker.longitude]}
                      icon={createWorkerIcon(worker.is_available)}
                    >
                      <Popup>
                        <div className="text-xs space-y-1.5 max-w-xs text-slate-900">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <span>👷 {worker.name}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                worker.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {worker.is_available ? 'Available' : 'Dispatched'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            <div><strong>Ward:</strong> {worker.ward_assigned}</div>
                            <div><strong>Phone:</strong> {worker.phone}</div>
                            <div><strong>Skills:</strong> {worker.skills}</div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                {/* VIEW MODE 2: WARD HEATMAP OVERLAY */}
                {viewMode === 'heatmap' &&
                  clusters.map((cluster) => {
                    const radius = Math.min(1400, Math.max(500, (cluster.total || 10) * 28));
                    const isHazard = cluster.emergency_count > 0 || cluster.density_score > 70;
                    const color = isHazard ? '#ef4444' : cluster.density_score > 40 ? '#f59e0b' : '#3b82f6';

                    return (
                      <Circle
                        key={`heat-${cluster.ward_no}`}
                        center={[cluster.lat, cluster.lng]}
                        radius={radius}
                        pathOptions={{
                          color,
                          fillColor: color,
                          fillOpacity: 0.35,
                          weight: 2,
                        }}
                      >
                        <Popup>
                          <div className="text-xs space-y-1 text-slate-900">
                            <strong className="block text-slate-900 font-bold">{cluster.name}</strong>
                            <div><strong>Total Grievances:</strong> {cluster.total}</div>
                            <div><strong>Active Pending:</strong> {cluster.active}</div>
                            <div><strong>Emergency Hazard Incidents:</strong> {cluster.emergency_count}</div>
                            <div className="font-bold text-amber-700">Density Index: {cluster.density_score}/100</div>
                          </div>
                        </Popup>
                      </Circle>
                    );
                  })}
              </MapContainer>
            </div>
          )}

          {/* ---------------- MAP OPTION 2: DARK SVG TACTICAL RADAR GRID ---------------- */}
          {mapEngine === 'svg' && (
            <div className="w-full h-full p-4 flex items-center justify-center bg-slate-950/90">
              <svg
                viewBox="0 0 800 500"
                className="w-full h-auto max-h-[560px] select-none"
                style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}
              >
                <defs>
                  <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                  </pattern>
                  <radialGradient id="emergencyPulse" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="heatClusterGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </radialGradient>
                </defs>

                <rect width="800" height="500" fill="#090d16" />
                <rect width="800" height="500" fill="url(#gridPattern)" />

                {/* River Spine */}
                <path
                  d="M 50 480 Q 250 350, 450 280 T 750 120"
                  fill="none"
                  stroke="#1e3a8a"
                  strokeWidth="16"
                  strokeLinecap="round"
                  opacity="0.4"
                />

                {/* Radial Rings */}
                <circle cx="400" cy="250" r="180" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="6,6" opacity="0.6" />
                <circle cx="400" cy="250" r="90" fill="none" stroke="#475569" strokeWidth="1.5" opacity="0.5" />
                <line x1="100" y1="250" x2="700" y2="250" stroke="#334155" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.4" />
                <line x1="400" y1="50" x2="400" y2="450" stroke="#334155" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.4" />

                {/* Ward Labels */}
                <text x="390" y="80" fill="#64748b" fontSize="11" fontWeight="bold" fontFamily="monospace">WARD 01 (Central)</text>
                <text x="180" y="220" fill="#64748b" fontSize="11" fontWeight="bold" fontFamily="monospace">WARD 04 (Lake View)</text>
                <text x="560" y="160" fill="#64748b" fontSize="11" fontWeight="bold" fontFamily="monospace">WARD 08 (Old Town)</text>
                <text x="360" y="380" fill="#64748b" fontSize="11" fontWeight="bold" fontFamily="monospace">WARD 12 (Greenfield)</text>
                <text x="620" y="360" fill="#64748b" fontSize="11" fontWeight="bold" fontFamily="monospace">WARD 14 (Tech Park)</text>
                <text x="180" y="420" fill="#64748b" fontSize="11" fontWeight="bold" fontFamily="monospace">WARD 15 (Riverfront)</text>

                {/* SVG HEATMAP CLUSTERS */}
                {viewMode === 'heatmap' &&
                  clusters.map((cluster, idx) => {
                    const pos = mapCoordsToSvg(cluster.lat, cluster.lng, idx);
                    const radius = Math.min(80, Math.max(35, (cluster.total || 10) * 1.6));

                    return (
                      <g key={idx} className="transition-all duration-300 cursor-pointer">
                        <circle cx={pos.x} cy={pos.y} r={radius} fill="url(#heatClusterGlow)" />
                        <circle cx={pos.x} cy={pos.y} r={radius / 2} fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="1.5" />
                        <circle cx={pos.x} cy={pos.y} r="16" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                        <text
                          x={pos.x}
                          y={pos.y + 4}
                          textAnchor="middle"
                          fill="#fbbf24"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {cluster.total}
                        </text>
                      </g>
                    );
                  })}

                {/* SVG INDIVIDUAL PINS */}
                {viewMode === 'pins' &&
                  filteredComplaints.map((complaint, idx) => {
                    const pos = mapCoordsToSvg(complaint.latitude, complaint.longitude, idx);
                    const isEmergency = complaint.priority === 'EMERGENCY';
                    const isHigh = complaint.priority === 'HIGH';
                    const isResolved = complaint.status === 'RESOLVED' || complaint.status === 'VERIFIED';

                    const pinColor = isEmergency ? '#ef4444' : isHigh ? '#f59e0b' : isResolved ? '#10b981' : '#3b82f6';
                    const isSelected = activePin?.id === complaint.id;

                    return (
                      <g
                        key={complaint.id}
                        onClick={() => setActivePin(complaint)}
                        className="cursor-pointer group"
                      >
                        {isEmergency && (
                          <circle cx={pos.x} cy={pos.y} r="22" fill="url(#emergencyPulse)" className="animate-ping" />
                        )}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={isSelected ? '14' : '10'}
                          fill={pinColor}
                          fillOpacity={isSelected ? '0.4' : '0.2'}
                          className="transition-all duration-200"
                        />
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={isSelected ? '7' : '5'}
                          fill={pinColor}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="transition-all duration-200"
                        />
                        <text
                          x={pos.x}
                          y={pos.y - 10}
                          textAnchor="middle"
                          fill="#e2e8f0"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                          className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        >
                          {complaint.tracking_code}
                        </text>
                      </g>
                    );
                  })}
              </svg>
            </div>
          )}

          {/* Map Legend Overlay (Top Left) */}
          <div className="absolute top-4 left-4 z-[400] bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-xs space-y-1.5 shadow-xl pointer-events-auto">
            <span className="font-bold text-slate-300 block mb-1">GIS Priority Legend</span>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span>EMERGENCY (Critical)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>HIGH Priority</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>MEDIUM Priority</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>RESOLVED Case</span>
            </div>
            {isOfficerMode && (
              <div className="flex items-center gap-2 text-slate-300 pt-1 border-t border-slate-800">
                <span>👷</span>
                <span className="text-amber-300 font-medium">Field Crew Marker</span>
              </div>
            )}
          </div>

          {/* Hotspot Summary Panel (Top Right - When Heatmap Mode Active) */}
          {viewMode === 'heatmap' && heatmapData?.hotspots && (
            <div className="absolute top-4 right-4 z-[400] bg-slate-900/95 backdrop-blur-md border border-amber-500/30 rounded-xl p-4 text-xs max-w-xs shadow-xl animate-in fade-in">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-2">
                <Flame className="w-4 h-4" />
                <span>Top Ward Hotspots</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2.5">
                Concentration of unresolved infrastructure grievances:
              </p>
              <div className="space-y-1.5">
                {heatmapData.hotspots.map((hs, i) => (
                  <div
                    key={hs.ward_no}
                    onClick={() => {
                      setSelectedWard(hs.ward_no);
                      setViewMode('pins');
                    }}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 cursor-pointer border border-slate-800/80 transition-colors"
                  >
                    <span className="font-semibold text-white">
                      #{i + 1} {hs.name}
                    </span>
                    <span className="font-mono text-amber-400 font-bold">
                      {hs.incident_count} cases
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Pin Flyout Card (Bottom Right) */}
          {activePin && (
            <div className="absolute bottom-4 right-4 z-[400] max-w-sm w-full bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-mono text-xs font-bold text-amber-400">
                  {activePin.tracking_code}
                </span>
                <button
                  onClick={() => setActivePin(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h4 className="text-sm font-bold text-white mt-2 leading-snug">
                {activePin.title}
              </h4>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                {activePin.description}
              </p>

              {activePin.photo_url && (
                <div className="mt-2.5 rounded-lg overflow-hidden border border-slate-800 h-24">
                  <img
                    src={activePin.photo_url}
                    alt="Proof photo"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Department</span>
                  <strong className="text-slate-200 font-medium">
                    {activePin.department_name}
                  </strong>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Ward & Zone</span>
                  <strong className="text-slate-200 font-medium">
                    {activePin.ward_no}
                  </strong>
                </div>
              </div>

              {activePin.active_worker_name && (
                <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] flex items-center gap-1.5">
                  <HardHat className="w-3.5 h-3.5 shrink-0" />
                  <span>Crew: {activePin.active_worker_name} dispatched</span>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    activePin.priority === 'EMERGENCY'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {activePin.priority}
                </span>

                <div className="flex items-center gap-2">
                  {isOfficerMode && (
                    <Link
                      to="/officer"
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all"
                    >
                      Triage
                    </Link>
                  )}
                  <Link
                    to={`/complaints/${activePin.tracking_code}`}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1"
                  >
                    Inspect Case <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
