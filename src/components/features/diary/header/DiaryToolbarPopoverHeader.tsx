import React from 'react';

/**
 * Shell intestazione condivisa per i pannelli toolbar del diario
 * (Progetti salvati / Salva / Condividi).
 */
export const DiaryToolbarPopoverHeader: React.FC<{
  title: string;
  trailing?: React.ReactNode;
}> = ({ title, trailing }) => (
  <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-700 flex justify-between items-center">
    <span>{title}</span>
    {trailing}
  </div>
);
