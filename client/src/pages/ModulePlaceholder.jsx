import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Construction, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Card, { CardBody } from '../components/ui/Card';

const MODULE_MAP = {
  '/report': {
    title: 'Grievance Reporting System',
    phase: 'Phase 5: Complaint Reporting',
    features: ['Geotagged photo upload', 'Department & Category selectors', 'Citizen contact verification', 'Instant tracking code generation'],
  },
  '/complaints': {
    title: 'Complaint Tracking & Status History',
    phase: 'Phase 6: Complaint Tracking & Status History',
    features: ['Audit trail timeline', 'Officer assigned indicator', 'Reopen complaint option', 'Resolution satisfaction ratings'],
  },
  '/services': {
    title: 'Municipal Service Requests',
    phase: 'Phase 9: Municipal Service Requests',
    features: ['Water tanker delivery', 'Sanitation / tree trimming bookings', 'Slot scheduling', 'Document upload'],
  },
  '/alerts': {
    title: 'City Announcements & Emergency Alerts',
    phase: 'Phase 10: Announcements and Emergency Alerts',
    features: ['Real-time warning banners', 'Zonal weather / flood warnings', 'Road closure advisories', 'Push notifications'],
  },
  '/officer': {
    title: 'Municipal Officer Dispatch Console',
    phase: 'Phase 7: Officer Dashboard and Task Management',
    features: ['Department queue triage', 'Field staff assignment', 'Resolution proof upload', 'Work progress notes'],
  },
  '/admin': {
    title: 'City Administration Center',
    phase: 'Phase 8: Admin Dashboard & Department Management',
    features: ['RBAC user management', 'Department master controls', 'System audit logs', 'City-wide complaint heatmaps'],
  },
  '/login': {
    title: 'Citizen & Staff Authentication',
    phase: 'Phase 3: Authentication and Role-Based Access',
    features: ['JWT secured sessions', 'Bcrypt password hashing', 'Role-based redirection (Citizen/Officer/Admin)'],
  },
  '/register': {
    title: 'Citizen Registration',
    phase: 'Phase 3: Authentication and Role-Based Access',
    features: ['Account creation', 'Ward & address profile setup', 'Phone number validation'],
  },
};

export default function ModulePlaceholder() {
  const location = useLocation();
  const info = MODULE_MAP[location.pathname] || {
    title: 'Module Under Construction',
    phase: 'Upcoming Phase',
    features: ['Architecture & API routes scaffolded in Phase 1'],
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <Card className="text-center p-8 border-dashed border-2 border-slate-300">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
          <Construction className="w-7 h-7" />
        </div>
        
        <span className="inline-block px-3 py-1 rounded-full bg-civic-100 text-civic-800 text-xs font-semibold mb-2">
          {info.phase}
        </span>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {info.title}
        </h1>

        <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6">
          Phase 1 foundational architecture, routing, and REST connectivity are actively verified. 
          This module is part of the ordered roadmap and will be activated in its designated phase.
        </p>

        <div className="bg-slate-50 rounded-xl p-5 max-w-md mx-auto text-left mb-6 border border-slate-200">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
            Key Capabilities in this Module:
          </h3>
          <ul className="space-y-2">
            {info.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center gap-3">
          <Link to="/">
            <Button variant="primary" icon={ArrowLeft}>
              Back to Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
