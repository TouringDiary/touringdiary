import { Sparkles } from 'lucide-react';
import { AdminAiVerifyQueue } from './AdminAiVerifyQueue';

type AdminReportsAiTabProps = {
  onQueueChanged?: () => void;
};

export const AdminReportsAiTab = ({ onQueueChanged }: AdminReportsAiTabProps) => (
  <div className="space-y-4">
    <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 p-4 md:p-5">
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" aria-hidden />
        <div className="space-y-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Coda {`VERIFICARE IMMAGINE AI`}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Asset in stato <strong className="text-slate-200">verify_ai_image</strong> — checklist
            per-step, motivazione AI separata da decisione Admin (D81/D82).
          </p>
        </div>
      </div>
    </div>
    <AdminAiVerifyQueue onQueueChanged={onQueueChanged} />
  </div>
);
