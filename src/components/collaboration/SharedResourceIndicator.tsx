import React from 'react';
import { Users } from 'lucide-react';

interface SharedResourceIndicatorProps {
  className?: string;
}

/** Indicatore unico risorsa condivisa (§11.1). */
export const SharedResourceIndicator: React.FC<SharedResourceIndicatorProps> = ({ className = '' }) => (
  <span
    title="Condiviso"
    aria-label="Condiviso"
    className={`inline-flex items-center justify-center text-indigo-300 shrink-0 ${className}`}
  >
    <Users className="w-4 h-4" aria-hidden />
  </span>
);
