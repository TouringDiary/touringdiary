interface QaAuthGateProps {
  message: string;
  onRequireAuth: () => void;
}

export const QaAuthGate = ({ message, onRequireAuth }: QaAuthGateProps) => (
  <div className="rounded-xl border border-emerald-500/30 bg-emerald-900/20 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
    <p className="text-xs text-emerald-100/90 flex-1 leading-relaxed">{message}</p>
    <button
      type="button"
      onClick={onRequireAuth}
      className="shrink-0 min-h-11 px-4 py-2.5 rounded-lg text-xs font-bold uppercase bg-emerald-600 hover:bg-emerald-500 text-white focus-visible:ring-2 focus-visible:ring-emerald-400"
    >
      Accedi o Registrati
    </button>
  </div>
);
