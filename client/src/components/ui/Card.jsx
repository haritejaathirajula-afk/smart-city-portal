import React from 'react';

export default function Card({ children, className = '', hover = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/90 shadow-card overflow-hidden ${
        hover ? 'transition-all duration-200 hover:shadow-card-hover hover:border-teal-500/40 cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between ${className}`}>
      <div>
        {title && <h3 className="text-base font-semibold text-navy-900">{title}</h3>}
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}
