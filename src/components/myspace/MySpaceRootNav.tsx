import React from 'react';
import {
  MY_SPACE_ROOTS,
  type MySpaceRootId,
} from '@/myspace/mySpaceRoots';

interface Props {
  activeRoot: MySpaceRootId;
  onNavigate: (root: MySpaceRootId) => void;
}

/**
 * Nav root MySpace — griglia desktop, scroll orizzontale mobile (stesso pattern hub WS).
 */
export const MySpaceRootNav: React.FC<Props> = ({ activeRoot, onNavigate }) => (
  <nav
    className="
      flex lg:grid lg:grid-cols-5
      border-b border-slate-800 bg-slate-950/80 shrink-0 overflow-x-auto lg:overflow-visible
      min-w-0
    "
    role="tablist"
    aria-label="Sezioni MySpace"
  >
    {MY_SPACE_ROOTS.map((root) => {
      const isActive = activeRoot === root.id;
      return (
        <button
          key={root.id}
          type="button"
          role="tab"
          aria-selected={isActive}
          id={`myspace-root-tab-${root.id}`}
          aria-controls={`myspace-root-panel-${root.id}`}
          onClick={() => onNavigate(root.id)}
          className={`
            relative px-3 lg:px-2 xl:px-3 py-2.5 text-[10px] xl:text-xs font-bold uppercase tracking-wider whitespace-nowrap
            transition-colors shrink-0 border-b-2 text-center
            ${isActive
              ? 'border-amber-500 text-white bg-slate-900/60'
              : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'}
          `}
        >
          {root.label}
        </button>
      );
    })}
  </nav>
);
