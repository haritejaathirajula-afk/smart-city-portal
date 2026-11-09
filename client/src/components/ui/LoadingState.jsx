import React from 'react';

export default function LoadingState({ message = 'Loading municipal data...', height = 'min-h-[280px]' }) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${height}`}>
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-teal-500 animate-spin" />
        <div className="w-6 h-6 rounded-full border-2 border-slate-100 border-b-navy-900 animate-spin absolute inset-0 m-auto" />
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500 tracking-wide">{message}</p>
    </div>
  );
}

