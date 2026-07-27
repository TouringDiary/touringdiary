import React from 'react';
import type { MySpaceRootDefinition } from '@/myspace/mySpaceRoots';

interface Props {
  root: MySpaceRootDefinition;
}

/** Empty state silenzioso per sezioni root Macrofase 1 (D6). */
export const MySpaceSectionPlaceholder: React.FC<Props> = ({ root }) => (
  <div
    id={`myspace-root-panel-${root.id}`}
    role="tabpanel"
    aria-labelledby={`myspace-root-tab-${root.id}`}
    data-testid={`myspace-section-${root.id}`}
    className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 md:p-8 flex flex-col items-center justify-center text-center"
  >
    <h2 className="text-lg md:text-xl font-black text-white tracking-tight mb-2">
      {root.label}
    </h2>
    <p className="text-sm text-slate-400 max-w-md leading-relaxed">
      {root.placeholder}
    </p>
  </div>
);
