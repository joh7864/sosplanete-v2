'use client';

import React from 'react';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type TooltipAlign = 'center' | 'start' | 'end';
export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'primary-solid'
  | 'amber'
  | 'danger'
  | 'purple'
  | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonWithTooltipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip: string;
  tooltipPosition?: TooltipPosition;
  tooltipAlign?: TooltipAlign;
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
  children: React.ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  default:
    'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/80 shadow-xs hover:border-slate-300',
  primary:
    'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200 shadow-xs',
  'primary-solid':
    'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 border border-emerald-600',
  amber:
    'bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 border border-amber-200 shadow-xs',
  danger:
    'bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 shadow-xs',
  purple:
    'bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 border border-purple-200 shadow-xs',
  subtle:
    'bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-800 border border-slate-200 shadow-xs',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'w-8 h-8 rounded-xl text-xs',
  md: 'w-10 h-10 rounded-2xl text-sm',
  lg: 'w-12 h-12 rounded-2xl text-base',
};

function getTooltipPlacementClasses(position: TooltipPosition, align: TooltipAlign): string {
  if (position === 'top') {
    if (align === 'end') return 'bottom-full right-0 mb-2.5 origin-bottom-right';
    if (align === 'start') return 'bottom-full left-0 mb-2.5 origin-bottom-left';
    return 'bottom-full left-1/2 -translate-x-1/2 mb-2.5 origin-bottom';
  }

  if (position === 'bottom') {
    if (align === 'end') return 'top-full right-0 mt-2.5 origin-top-right';
    if (align === 'start') return 'top-full left-0 mt-2.5 origin-top-left';
    return 'top-full left-1/2 -translate-x-1/2 mt-2.5 origin-top';
  }

  if (position === 'left') {
    return 'right-full top-1/2 -translate-y-1/2 mr-2.5 origin-right';
  }

  return 'left-full top-1/2 -translate-y-1/2 ml-2.5 origin-left';
}

export function IconButtonWithTooltip({
  tooltip,
  tooltipPosition = 'top',
  tooltipAlign = 'center',
  variant = 'default',
  size = 'md',
  active = false,
  className = '',
  disabled,
  children,
  ...props
}: IconButtonWithTooltipProps) {
  const activeStyle = active
    ? 'ring-2 ring-emerald-500/40 border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
    : '';

  const placementClass = getTooltipPlacementClasses(tooltipPosition, tooltipAlign);

  return (
    <div className="relative inline-flex group">
      <button
        type="button"
        title={tooltip}
        aria-label={tooltip}
        disabled={disabled}
        className={`flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${SIZE_STYLES[size]} ${VARIANT_STYLES[variant]} ${activeStyle} ${className}`}
        {...props}
      >
        {children}
      </button>

      {/* Floating Tooltip Bubble */}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-150 whitespace-nowrap ${placementClass}`}
      >
        {tooltip}
      </span>
    </div>
  );
}
