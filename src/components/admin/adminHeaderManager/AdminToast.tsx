import { AlertTriangle, CheckCircle, X } from 'lucide-react';

export const AdminToast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}) => (
  <div
    className={`fixed top-6 right-6 z-toast px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 border ${type === 'success' ? 'bg-emerald-600 border-emerald-400' : 'bg-red-600 border-red-400'} text-white`}
  >
    {type === 'success' ? (
      <CheckCircle className="w-6 h-6 shrink-0" />
    ) : (
      <AlertTriangle className="w-6 h-6 shrink-0" />
    )}
    <div className="font-bold text-sm">{message}</div>
    <button type="button" onClick={onClose} className="ml-4 hover:bg-white/20 p-1 rounded-full">
      <X className="w-4 h-4" />
    </button>
  </div>
);
