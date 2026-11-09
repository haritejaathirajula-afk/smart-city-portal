import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

const VARIANT_MAP = {
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-900',
    icon: Info,
    iconColor: 'text-blue-600',
  },
  success: {
    container: 'bg-teal-50 border-teal-200 text-teal-900',
    icon: CheckCircle2,
    iconColor: 'text-teal-600',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
  },
  error: {
    container: 'bg-rose-50 border-rose-200 text-rose-900',
    icon: XCircle,
    iconColor: 'text-rose-600',
  },
};

export default function AlertBanner({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
  action,
}) {
  const current = VARIANT_MAP[type] || VARIANT_MAP.info;
  const Icon = current.icon;

  return (
    <div
      className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs shadow-sm transition-all ${current.container} ${className}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${current.iconColor}`} />
        <div>
          {title && <h4 className="font-bold text-sm mb-0.5">{title}</h4>}
          <div className="leading-relaxed">{message}</div>
          {action && <div className="mt-2">{action}</div>}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

