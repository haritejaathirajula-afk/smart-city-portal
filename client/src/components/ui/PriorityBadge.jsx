import React from 'react';
import { AlertTriangle, Flame, ShieldAlert, ArrowDown } from 'lucide-react';

const PRIORITY_STYLES = {
  EMERGENCY: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: Flame,
    label: 'Emergency',
    iconColor: 'text-rose-600',
  },
  HIGH: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: AlertTriangle,
    label: 'High Priority',
    iconColor: 'text-amber-600',
  },
  MEDIUM: {
    bg: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: ShieldAlert,
    label: 'Medium Priority',
    iconColor: 'text-sky-600',
  },
  LOW: {
    bg: 'bg-slate-50 text-slate-600 border-slate-200',
    icon: ArrowDown,
    label: 'Low Priority',
    iconColor: 'text-slate-500',
  },
};

export default function PriorityBadge({ priority, size = 'md', showIcon = true }) {
  const normalized = (priority || 'MEDIUM').toUpperCase();
  const current = PRIORITY_STYLES[normalized] || PRIORITY_STYLES.MEDIUM;
  const Icon = current.icon;

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-[11px]'
    : size === 'lg'
    ? 'px-3 py-1 text-sm'
    : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-md border ${current.bg} ${sizeClasses}`}
    >
      {showIcon && <Icon className={`w-3.5 h-3.5 ${current.iconColor}`} />}
      <span>{current.label}</span>
    </span>
  );
}

