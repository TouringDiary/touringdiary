import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { loadGlobalCache } from '../../services/settingsService';
import { clearStorage } from '../../services/storageService';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface ErrorBoundaryProps {
  children?: ReactNode;
  /**
   * `bootstrap`: fallback indipendente dai context, senza DeleteConfirmationModal.
   * `application`: fallback completo con DeleteConfirmationModal sotto ConfigProvider.
   */
  variant?: 'bootstrap' | 'application';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: unknown;
  showConfirmReset: boolean;
}

/** Solo errori ambientali (HMR, chunk, estensioni, ResizeObserver, Maps, rete, quota AI). */
const IGNORED_ERROR_SUBSTRINGS = [
  // ResizeObserver: warning benigno del layout, non un crash
  'resizeobserver loop',

  // Chunk/dynamic import falliti per rete o HMR (Vite):
  // pattern specifici, NON il generico 'import' o 'unexpected token'.
  'loading chunk', // webpack/vite chunk non raggiungibile
  'failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'importing a module script failed', // Safari dynamic import via rete
  "unexpected token '<'", // chunk servito come HTML (404/HMR) invece di JS

  // Google Maps / GenAI non ancora caricati (script esterno async)
  'google is not defined',
  '_.zb', // Google Maps internals

  // Estensioni del browser che iniettano codice nella pagina
  'extension context invalidated',
  'chrome-extension://',
  'moz-extension://',

  // Rete / richieste annullate
  'networkerror',
  'failed to fetch',
  'load failed', // Safari: fetch di rete fallito
  'user aborted',
  'the operation was aborted',
  'aborterror',

  // Quota AI esaurita: non deve far crashare la UI
  'quota',
  '429',
] as const;

function toErrorText(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return String(error ?? '');
}

const isIgnorableError = (error: unknown): boolean => {
  const msg = toErrorText(error).toLowerCase();
  return IGNORED_ERROR_SUBSTRINGS.some((s) => msg.includes(s));
};

const reloadApp = (): void => {
  window.location.reload();
};

class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    showConfirmReset: false,
  };

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> | null {
    if (isIgnorableError(error)) {
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  override componentDidMount() {
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.addEventListener('error', this.handleGlobalError);
  }

  override componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleGlobalError);
  }

  handleGlobalError = (event: ErrorEvent) => {
    if (isIgnorableError(event.message)) {
      event.preventDefault(); // Previene il log rosso in console
      event.stopImmediatePropagation();
      return;
    }
  };

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (isIgnorableError(event.reason)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
  };

  override componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    if (isIgnorableError(error)) {
      return;
    }
    console.error('[Application Error] Critical Crash', {
      message: toErrorText(error),
      error,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReload = () => {
    reloadApp();
  };

  handleReset = () => {
    // Bootstrap boundary: fallback indipendente dai context → nessuna DeleteConfirmationModal.
    if (this.props.variant === 'bootstrap') {
      void this.confirmReset();
      return;
    }
    this.setState({ showConfirmReset: true });
  };

  confirmReset = async () => {
    try {
      // 1. Pulisce lo storage locale (es. localStorage)
      clearStorage();

      // 2. Ricarica le configurazioni globali dal DB alla cache in-memory
      await loadGlobalCache();

      // 3. Nasconde il modale e resetta lo stato di errore
      this.setState({ showConfirmReset: false, hasError: false, error: null });

      // A questo punto, l'applicazione tornerà a renderizzare i suoi children.
      // Il ConfigProvider si ri-inizializzerà, leggerà la cache aggiornata
      // e propagherà le nuove configurazioni, aggiornando l'UI senza un full reload.
    } catch (e) {
      console.error('[Application Error] Cache reset failed', {
        message: toErrorText(e),
        error: e,
      });
      // Se il reset fallisce, almeno nascondiamo il modale e ricarichiamo come ultima spiaggia
      reloadApp();
    }
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      const errorMsg =
        this.state.error instanceof Error ? this.state.error.message : String(this.state.error);
      const shouldRenderResetModal = this.props.variant !== 'bootstrap';

      return (
        <div className="relative z-floating-panel flex min-h-screen items-center justify-center bg-[#020617] p-6 font-sans">
          <div className="flex w-full max-w-md flex-col items-center rounded-3xl border border-red-900/50 bg-slate-900 p-8 text-center shadow-2xl">
            <div className="mb-6 flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-red-900/20">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>

            <h1 className="mb-2 text-2xl font-bold text-white">Qualcosa non va</h1>
            <p className="mb-6 text-sm leading-relaxed text-slate-400">
              Il sistema ha riscontrato un errore critico nel codice.
              <br />
              Non preoccuparti, i tuoi dati sono salvi nel database.
            </p>

            <div className="mb-6 w-full overflow-hidden rounded-xl border border-red-900/30 bg-black/40 p-4 text-left">
              <p className="line-clamp-4 break-words font-mono text-[10px] text-red-400">
                {errorMsg}
              </p>
            </div>

            <div className="flex w-full gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-white transition-colors hover:bg-indigo-500"
              >
                <RefreshCw className="h-4 w-4" /> Ricarica App
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-3 font-bold text-slate-400 transition-colors hover:bg-red-900/30 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" /> Reset Cache
              </button>
            </div>
          </div>
          {shouldRenderResetModal && (
            <DeleteConfirmationModal
              isOpen={this.state.showConfirmReset}
              onClose={() => this.setState({ showConfirmReset: false })}
              onConfirm={this.confirmReset}
              title="Reset Cache"
              message="Questo pulirà la cache locale e ricaricherà le impostazioni globali dal server. L'app non si riavvierà. Continuare?"
              confirmLabel="Reset e Ricarica Config"
            />
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
