import { Z_TOAST } from '@/constants/zIndex';
import React from 'react';


interface ToastProps {
  visible: boolean;
  message: string;
}

export const SuitcaseToast: React.FC<ToastProps> = ({ visible, message }) => {
  return (
    <div 
      className={`fixed top-20 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-2xl shadow-xl shadow-black/20 transition-all duration-500 pointer-events-auto ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}`}
      style={{ zIndex: Z_TOAST }}
    >
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-black text-emerald-400 tracking-[0.2em] uppercase whitespace-nowrap">{message}</span>
      </div>
    </div>
  );
};



