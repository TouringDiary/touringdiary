import { Z_TOAST } from '@/constants/zIndex';
import React from 'react';
import { ToastVariant } from '@/types/toast';

interface ToastProps {
  visible: boolean;
  message: string;
  description?: string;
  variant?: ToastVariant;
}

const VARIANT_STYLES = {
  success: {
    shell: 'bg-slate-950/98 border-emerald-400/50',
    glow: 'shadow-[0_10px_40px_rgba(0,0,0,0.65),0_0_28px_rgba(52,211,153,0.28)]',
    ring: 'ring-1 ring-emerald-500/30',
    iconBg: 'bg-emerald-500/20',
    iconBorder: 'border-emerald-400/40',
    dot: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.65)]',
    title: 'text-emerald-300',
    description: 'text-slate-300',
  },
  destructive: {
    shell: 'bg-slate-950/98 border-red-400/50',
    glow: 'shadow-[0_10px_40px_rgba(0,0,0,0.65),0_0_28px_rgba(248,113,113,0.28)]',
    ring: 'ring-1 ring-red-500/30',
    iconBg: 'bg-red-500/20',
    iconBorder: 'border-red-400/40',
    dot: 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.65)]',
    title: 'text-red-300',
    description: 'text-slate-300',
  },
  neutral: {
    shell: 'bg-slate-950/98 border-slate-400/45',
    glow: 'shadow-[0_10px_40px_rgba(0,0,0,0.65),0_0_24px_rgba(148,163,184,0.18)]',
    ring: 'ring-1 ring-slate-400/25',
    iconBg: 'bg-slate-500/20',
    iconBorder: 'border-slate-400/35',
    dot: 'bg-slate-300 shadow-[0_0_8px_rgba(148,163,184,0.45)]',
    title: 'text-slate-200',
    description: 'text-slate-400',
  },
} as const;

export const SuitcaseToast: React.FC<ToastProps> = ({
  visible,
  message,
  description,
  variant = 'success',
}) => {
  const style = VARIANT_STYLES[variant];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed top-20 left-1/2 -translate-x-1/2 px-5 py-3.5 backdrop-blur-xl border-2 rounded-3xl transition-all duration-500 pointer-events-auto ${style.shell} ${style.glow} ${style.ring} ${
        visible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
      }`}
      style={{ zIndex: Z_TOAST }}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`w-10 h-10 rounded-2xl ${style.iconBg} flex items-center justify-center border ${style.iconBorder} shrink-0`}
        >
          <div className={`w-2.5 h-2.5 rounded-full ${style.dot} animate-pulse`} />
        </div>
        <div className="flex flex-col min-w-0 gap-1">
          <span
            className={`text-[10px] font-black ${style.title} tracking-[0.18em] uppercase whitespace-nowrap leading-none`}
          >
            {message}
          </span>
          {description && (
            <span className={`text-[11px] font-medium ${style.description} whitespace-nowrap leading-snug`}>
              {description}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
