import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  title = 'No records found',
  description = 'There are no active entries matching your criteria.',
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  actionIcon,
  className = '',
}) {
  return (
    <div className={`text-center py-12 px-4 rounded-xl border border-dashed border-slate-300 bg-white/70 max-w-lg mx-auto my-6 ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button size="sm" variant="teal" icon={actionIcon} onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

