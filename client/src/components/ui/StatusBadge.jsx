import React from 'react';

const STATUS_STYLES = {
  REPORTED: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    label: 'Reported',
  },
  ASSIGNED: {
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
    label: 'Assigned',
  },
  IN_PROGRESS: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500 animate-pulse',
    label: 'In Progress',
  },
  RESOLVED: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Resolved',
  },
  VERIFIED: {
    bg: 'bg-teal-50 text-teal-700 border-teal-200',
    dot: 'bg-teal-500',
    label: 'Verified',
  },
  CLOSED: {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: 'Closed',
  },
  REOPENED: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500 animate-ping',
    label: 'Reopened',
  },
  REJECTED: {
    bg: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
    label: 'Rejected',
  },
  SUBMITTED: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    label: 'Submitted',
  },
  APPROVED: {
    bg: 'bg-teal-50 text-teal-700 border-teal-200',
    dot: 'bg-teal-500',
    label: 'Approved',
  },
  COMPLETED: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Completed',
  },
};

export default function StatusBadge({ status, size = 'md' }) {
  const normalized = (status || '').toUpperCase();
  const current = STATUS_STYLES[normalized] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: status || 'Unknown',
  };

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-[11px]' 
    : size === 'lg'
    ? 'px-3.5 py-1.5 text-sm'
    : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${current.bg} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
}
