import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variantStyles = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    imperium: 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10',
    chaos: 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/10',
    xenos: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10',
    anime: 'bg-pink-500/15 text-pink-300 border-pink-500/40 shadow-sm shadow-pink-500/10',
    cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    warning: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    danger: 'bg-red-500/20 text-red-400 border-red-500/40',
  };

  const selectedVariant = variantStyles[variant] || variantStyles.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${selectedVariant} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
