import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Home, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-civic-100 text-civic-700 flex items-center justify-center mb-6">
        <Building2 className="w-8 h-8" />
      </div>
      <span className="text-sm font-bold uppercase tracking-wider text-civic-600 mb-2">
        Error 404
      </span>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
        Civic Resource Not Found
      </h1>
      <p className="text-slate-600 text-sm max-w-md mb-8 leading-relaxed">
        The requested municipal page or document does not exist, has been moved, or is scheduled for a future development phase.
      </p>
      <div className="flex items-center gap-3">
        <Link to="/">
          <Button icon={Home}>Return to Portal Home</Button>
        </Link>
        <button 
          onClick={() => window.history.back()}
          className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </button>
      </div>
    </div>
  );
}
