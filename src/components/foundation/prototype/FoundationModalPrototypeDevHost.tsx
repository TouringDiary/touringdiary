import React, { useCallback, useEffect, useState } from 'react';
import { FoundationModalPrototype } from './FoundationModalPrototype';

const HASH_KEY = '#foundation-modal-prototype';

/**
 * Host dev-only per aprire il prototipo Foundation senza collegarlo a flussi utente.
 * Apri con: http://localhost:.../#foundation-modal-prototype
 * oppure usa il pulsante flottante in basso a sinistra (solo development).
 */
export const FoundationModalPrototypeDevHost: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const syncFromHash = useCallback(() => {
    setIsOpen(window.location.hash === HASH_KEY);
  }, []);

  useEffect(() => {
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [syncFromHash]);

  const open = () => {
    if (window.location.hash !== HASH_KEY) {
      window.location.hash = HASH_KEY.slice(1);
    } else {
      setIsOpen(true);
    }
  };

  const close = () => {
    setIsOpen(false);
    if (window.location.hash === HASH_KEY) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  if (!import.meta.env.DEV) return null;

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="fixed bottom-20 left-3 z-[99999] px-3 py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/30 border border-indigo-400/30 backdrop-blur-sm transition-colors"
        title="Apri Foundation Modal Prototype (dev)"
      >
        Foundation
      </button>
      <FoundationModalPrototype isOpen={isOpen} onClose={close} />
    </>
  );
};
