import { Z_TOAST } from '@/constants/zIndex';
import React from 'react';
import { ToastVariant } from '@/types/toast';

interface ToastProps {
  visible: boolean;
  message: string;
  description?: string;
  variant?: ToastVariant;
}

export const SuitcaseToast: React.FC<ToastProps> = ({ visible, message, description, variant = 'success' }) => {
  const variantStyles = {
    success: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/10',
      iconBorder: 'border-emerald-500/20',
      dot: 'bg-emerald-500',
      text: 'text-emerald-400'
    },
    destructive: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      iconBg: 'bg-red-500/10',
      iconBorder: 'border-red-500/20',
      dot: 'bg-red-500',
      text: 'text-red-400'
    },
    neutral: {
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/20',
      iconBg: 'bg-slate-500/10',
      iconBorder: 'border-slate-500/20',
      dot: 'bg-slate-500',
      text: 'text-slate-400'
    }
  } as const;

  const style = variantStyles[variant];

  return (
    <div 
      className={`fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-900/80 backdrop-blur-xl border ${style.border} rounded-3xl shadow-2xl shadow-black/40 transition-all duration-500 pointer-events-auto ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}`}
      style={{ zIndex: Z_TOAST }}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-2xl ${style.iconBg} flex items-center justify-center border ${style.iconBorder} shrink-0`}>
          <div className={`w-2 h-2 rounded-full ${style.dot} animate-pulse`} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className={`text-[10px] font-black ${style.text} tracking-[0.2em] uppercase whitespace-nowrap leading-none mb-1.5`}>{message}</span>
          {description && (
            <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap leading-none">{description}</span>
          )}
        </div>
      </div>
    </div>
  );
};



