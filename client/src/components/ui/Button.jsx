import React from 'react';

const VARIANTS = {
  primary: 'bg-teal-500 hover:bg-teal-600 text-white shadow-sm focus:ring-teal-400',
  navy: 'bg-navy-900 hover:bg-navy-800 text-white shadow-sm focus:ring-navy-600',
  teal: 'bg-teal-500 hover:bg-teal-600 text-white shadow-sm focus:ring-teal-400',
  secondary: 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm focus:ring-slate-700',
  outline: 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 focus:ring-teal-500',
  'outline-navy': 'border border-navy-800 bg-transparent hover:bg-navy-900/10 text-navy-900 focus:ring-navy-600',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-500',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  ...props
}) {
  const chosenVariant = VARIANTS[variant] || VARIANTS.primary;
  const chosenSize = SIZES[size] || SIZES.md;

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${chosenVariant} ${chosenSize} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : Icon ? (
        <Icon className="mr-2 h-4 w-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
