import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  ArrowRight, 
  Shield, 
  Users, 
  Activity, 
  FileCheck, 
  Layers, 
  Sparkles,
  Server,
  Database,
  RefreshCw,
  Sliders,
  MapPin,
  ChevronRight,
  Flame,
  Radio,
  RotateCcw,
  XCircle,
  Truck
} from 'lucide-react';
import { checkApiHealth } from '../services/api';
import StatusBadge from '../components/ui/StatusBadge';
import PriorityBadge from '../components/ui/PriorityBadge';
import Button from '../components/ui/Button';
import Card, { CardBody, CardHeader } from '../components/ui/Card';

export default function LandingPage() {
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [trackQuery, setTrackQuery] = useState('');

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const response = await checkApiHealth();
      setHealthData(response.data);
    } catch (err) {
      setHealthData({
        status: 'error',
        message: err.message || 'Cannot reach API server',
      });
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const workflowSteps = [
    {
      status: 'REPORTED',
      title: '1. Citizen Reports',
      desc: 'Citizen files grievance with photograph, GPS coordinates, category, and municipal ward.',
      actor: 'Resident Citizen',
    },
    {
      status: 'ASSIGNED',
      title: '2. Officer Dispatched',
      desc: 'Department head reviews grievance queue and assigns ticket to designated zonal engineer.',
      actor: 'Municipal Administration',
    },
    {
      status: 'IN_PROGRESS',
      title: '3. Field Remediation',
      desc: 'Field worker crew attends site with necessary repair parts, compaction, or maintenance tools.',
      actor: 'Field Worker / Crew',
    },
    {
      status: 'RESOLVED',
      title: '4. Marked Resolved',
      desc: 'Officer uploads proof photograph and marks work as completed with official resolution remarks.',
      actor: 'Municipal Officer',
    },
    {
      status: 'VERIFIED',
      title: '5. Citizen Verified',
      desc: 'Citizen inspects ground resolution, rates department satisfaction (1-5 stars), or requests reopening.',
      actor: 'Resident Citizen',
    },
    {
      status: 'CLOSED',
      title: '6. Ticket Concluded',
      desc: 'Audit trail locked, SLA metrics registered in city analytics, and ticket archived.',
      actor: 'System Automation',
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Municipal Hero Banner */}
      <section className="relative overflow-hidden civic-hero-mesh text-white py-20 px-4 sm:px-6 lg:px-8 border-b border-navy-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Smart City 24/7 Civic Redressal Engine</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Report. Resolve. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-400 to-sky-200">
                Transform Municipal Living.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Empowering citizens with direct access to municipal departments. 
              Report potholes, dark streetlights, waste overflow, and water pipe fractures 
              with transparent, tamper-evident lifecycle tracking from submission to verification.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to="/report">
                <Button size="lg" variant="teal" icon={AlertTriangle} className="shadow-lg">
                  Report a Civic Problem
                </Button>
              </Link>
              <Link to="/services">
                <Button size="lg" variant="outline" className="bg-navy-900/80 border-navy-700 text-white hover:bg-navy-800">
                  Request Utility Service
                </Button>
              </Link>
            </div>

            {/* Track Grievance Search Bar */}
            <div className="pt-4 max-w-lg">
              <div className="text-xs font-semibold text-slate-300 mb-2">Track any complaint with Tracking Code:</div>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (trackQuery.trim()) {
                    window.location.href = `/complaints/${encodeURIComponent(trackQuery.trim())}`;
                  }
                }}
                className="flex items-center gap-2 bg-navy-950/90 border border-navy-700 rounded-xl p-1.5 focus-within:border-teal-400 transition-colors shadow-lg"
              >
                <div className="pl-3 text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. CMP-2026-00104"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  className="bg-transparent text-sm text-white placeholder-slate-500 flex-1 px-2 focus:outline-none font-mono"
                />
                <Button type="submit" size="sm" variant="teal">
                  Track
                </Button>
              </form>
            </div>
          </div>

          {/* Right Hero Column: Live Infrastructure & System Health Card */}
          <div className="lg:col-span-5">
            <div className="glass-dark rounded-2xl p-6 shadow-2xl border border-navy-700/80 relative">
              <div className="flex items-center justify-between pb-4 border-b border-navy-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">System Architecture & Health</h3>
                    <p className="text-[11px] text-slate-400">Live MySQL 8 & Express Status</p>
                  </div>
                </div>

                <button
                  onClick={fetchHealth}
                  disabled={healthLoading}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
                  title="Refresh system health status"
                >
                  <RefreshCw className={`w-4 h-4 ${healthLoading ? 'animate-spin text-teal-400' : ''}`} />
                </button>
              </div>

              {/* Status items */}
              <div className="space-y-3.5 py-4 text-xs">
                {/* Express REST API */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-navy-950/70 border border-navy-800/80">
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-teal-400" />
                    <div>
                      <div className="font-semibold text-slate-200">Express REST API</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {healthData?.service || 'Node.js Express Server'}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    healthData?.status === 'ok' 
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {healthData?.status === 'ok' ? 'ONLINE (200 OK)' : 'OFFLINE'}
                  </span>
                </div>

                {/* MySQL Database */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-navy-950/70 border border-navy-800/80">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-semibold text-slate-200">MySQL 8 Database Engine</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {healthData?.database?.connected 
                          ? `Host: ${healthData.database.details?.host || 'localhost'} (16 Tables)` 
                          : 'Awaiting DB Startup'}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    healthData?.database?.connected 
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {healthData?.database?.connected ? 'CONNECTED' : 'DISCONNECTED'}
                  </span>
                </div>

                {/* Uptime and RAM metrics */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div className="p-2.5 bg-navy-950/60 rounded-lg border border-navy-800">
                    <span className="text-slate-500 block text-[10px]">Server Uptime</span>
                    <span className="font-mono text-slate-200 font-semibold">{healthData?.uptime || 'N/A'}</span>
                  </div>
                  <div className="p-2.5 bg-navy-950/60 rounded-lg border border-navy-800">
                    <span className="text-slate-500 block text-[10px]">Node.js Heap Memory</span>
                    <span className="font-mono text-slate-200 font-semibold">{healthData?.memory?.used || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Architecture pill */}
              <div className="pt-2 border-t border-navy-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Platform Stack:</span>
                <span className="font-semibold text-teal-300 bg-navy-950 px-2.5 py-1 rounded-md border border-navy-800 font-mono text-[10px]">
                  React 18 &bull; Express &bull; MySQL 8 &bull; Leaflet
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Grievance Lifecycle Walkthrough */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold mb-3 border border-teal-200">
            <Sliders className="w-3.5 h-3.5 text-teal-600" />
            Standard Redressal Workflow
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Transparent, Audited 6-Step Grievance Lifecycle
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            Every status transition is immutably logged with timestamp, user ID, remarks, and proof photos. 
            Citizens can also trigger the <strong className="text-rose-600 font-semibold">REOPENED</strong> workflow if resolution is incomplete, or view the documented <strong className="text-red-600 font-semibold">REJECTED</strong> reason.
          </p>
        </div>

        {/* Step Timeline Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {workflowSteps.map((step, idx) => {
            const isSelected = activeWorkflowStep === idx;
            return (
              <button
                key={step.status}
                onClick={() => setActiveWorkflowStep(idx)}
                className={`text-left p-4 rounded-xl border transition-all duration-200 relative ${
                  isSelected
                    ? 'bg-white border-teal-500 shadow-card-hover ring-2 ring-teal-400/20 -translate-y-1'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-card'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 font-mono">0{idx + 1}</span>
                  <StatusBadge status={step.status} size="sm" />
                </div>
                <h4 className="font-bold text-xs text-navy-900 mb-1">{step.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{step.desc}</p>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Actor:</span>
                  <span className="font-semibold text-navy-900">{step.actor}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Step Banner */}
        <div className="mt-4 p-5 rounded-xl bg-navy-900 text-white border border-navy-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-teal-300 font-medium">Selected Lifecycle Stage:</div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{workflowSteps[activeWorkflowStep].title}</span>
                <span className="font-mono text-xs text-teal-400">({workflowSteps[activeWorkflowStep].status})</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{workflowSteps[activeWorkflowStep].desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/report">
              <Button size="sm" variant="teal">
                File a Grievance Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Three Role-Based Dashboard Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Role-Based Portals with Strict Authorization
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            Engineered with clear separation of responsibilities between residents, municipal field staff, and city governors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Citizen Card */}
          <Card hover className="flex flex-col">
            <div className="h-2 bg-teal-500" />
            <CardBody className="flex-1 flex flex-col justify-between space-y-4 p-6">
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 border border-teal-100">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-navy-900">Citizen Portal</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Submit grievances with geotagged map coordinates and photographs, book municipal utilities (water tankers, debris clearance), and verify repair quality.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> GPS pin-drop coordinate storage</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Reopen option if repair erodes</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Post-resolution 5-star rating</li>
                </ul>
              </div>
              <Link to="/citizen/dashboard" className="pt-2">
                <Button variant="outline" className="w-full text-xs" icon={ArrowRight}>
                  Open Citizen Dashboard
                </Button>
              </Link>
            </CardBody>
          </Card>

          {/* Municipal Officer Card */}
          <Card hover className="flex flex-col">
            <div className="h-2 bg-navy-700" />
            <CardBody className="flex-1 flex flex-col justify-between space-y-4 p-6">
              <div>
                <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-800 flex items-center justify-center mb-3 border border-navy-100">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-navy-900">Municipal Officer Terminal</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Department-scoped grievance queues (PWD, Sanitation, Water Works, Lighting), field technician work orders, and completion proof uploads.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-navy-700" /> Department-filtered queue triage</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-navy-700" /> Field worker assignment & dispatch</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-navy-700" /> Resolution proof photo uploads</li>
                </ul>
              </div>
              <Link to="/officer" className="pt-2">
                <Button variant="outline" className="w-full text-xs" icon={ArrowRight}>
                  Open Officer Terminal
                </Button>
              </Link>
            </CardBody>
          </Card>

          {/* Admin Card */}
          <Card hover className="flex flex-col">
            <div className="h-2 bg-navy-900" />
            <CardBody className="flex-1 flex flex-col justify-between space-y-4 p-6">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-navy-900 flex items-center justify-center mb-3 border border-slate-200">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-navy-900">Administrator Console</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  System-wide governance. Configure 6 municipal departments and SLA hours, manage citizen and staff user accounts, broadcast emergency warnings, and inspect audit logs.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-navy-900" /> Cross-department complaint reassignment</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-navy-900" /> Emergency broadcast alerts</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-navy-900" /> Full audit logs with client IP recording</li>
                </ul>
              </div>
              <Link to="/admin" className="pt-2">
                <Button variant="outline" className="w-full text-xs" icon={ArrowRight}>
                  Open Admin Console
                </Button>
              </Link>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* 4. Emergency Alert Live Ribbon */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-2">
                <span>Emergency Broadcast Alert Center</span>
                <span className="px-1.5 py-0.5 bg-rose-200 text-rose-900 text-[10px] rounded font-bold">24/7 Monitor</span>
              </div>
              <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                Monsoon Drainage Warning: Continuous silt extraction in progress across low-lying sectors along Riverbank Road.
              </p>
            </div>
          </div>
          <Link to="/alerts">
            <Button size="sm" variant="danger" className="text-xs whitespace-nowrap">
              View Active Alerts
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
