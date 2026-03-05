import React, { Component, ErrorInfo, ReactNode } from 'react';
import { clearStorage } from '../../services/storageService'; 
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: unknown; 
  showConfirmReset: boolean;
}

const isIgnorableError = (error: any): boolean => {
    const msg = String(error?.message || error || '').toLowerCase();
    
    // Lista di errori tecnici dell'ambiente cloud/editor da ignorare
    const ignoredSubstrings = [
      'resizeobserver loop',
      'import', // Errori di importazione dinamica temporanei
      'loading chunk', // Chunk non trovati (rete)
      'google is not defined', // Maps/GenAI non caricati
      '_.zb', // Google Maps internals
      'unexpected token', // Spesso errori di parsing HMR
      'cancelled', // Promise cancellate
      'user aborted',
      'networkerror',
      'failed to fetch',
      'load failed',
      'quota', // Errori di quota AI non devono crashare la UI
      '429'
    ];

    return ignoredSubstrings.some(s => msg.includes(s));
};

class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    showConfirmReset: false
  };
  
  // Explicitly declare props to satisfy TypeScript if inference fails
  props!: Readonly<ErrorBoundaryProps>;

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> | null {
    if (isIgnorableError(error)) {
        return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidMount() {
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.addEventListener('error', this.handleGlobalError);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleGlobalError);
  }

  handleGlobalError = (event: ErrorEvent) => {
    if (isIgnorableError(event.message)) {
        event.preventDefault(); // Previene il log rosso in console
        event.stopImmediatePropagation();
        return;
    }
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (isIgnorableError(event.reason)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
    }
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    if (isIgnorableError(error)) {
        return;
    }
    console.error("🔥 [Application Error] Critical Crash:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  }

  handleReset = () => {
    (this as any).setState({ showConfirmReset: true });
  }

  confirmReset = () => {
    clearStorage();
    window.location.reload();
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const errorMsg = String(this.state.error);

      return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans z-[9999] relative">
          <div className="max-w-md w-full bg-slate-900 border border-red-900/50 p-8 rounded-3xl text-center shadow-2xl flex flex-col items-center">
            <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
               <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Qualcosa non va</h1>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Il sistema ha riscontrato un errore critico nel codice.<br/>
              Non preoccuparti, i tuoi dati sono salvi nel database.
            </p>
            
            <div className="w-full bg-black/40 border border-red-900/30 rounded-xl p-4 mb-6 text-left overflow-hidden">
                <p className="text-[10px] font-mono text-red-400 break-words line-clamp-4">
                    {errorMsg}
                </p>
            </div>
            
            <div className="flex gap-3 w-full">
                <button onClick={this.handleReload} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  <RefreshCw className="w-4 h-4" /> Ricarica App
                </button>
                <button onClick={this.handleReset} className="flex-1 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-700">
                  <Trash2 className="w-4 h-4" /> Reset Cache
                </button>
            </div>
          </div>
          <DeleteConfirmationModal 
            isOpen={this.state.showConfirmReset}
            onClose={() => (this as any).setState({ showConfirmReset: false })}
            onConfirm={this.confirmReset}
            title="Reset Cache"
            message="Questo cancellerà i dati locali (cache). Continuare?"
            confirmLabel="Reset"
          />
        </div>
      );
    }
    
    return this.props.children;
  }
}

export default GlobalErrorBoundary;