import { Construction } from 'lucide-react';

export const AdminReportsAiTab = () => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 space-y-4">
    <div className="flex items-start gap-3">
      <Construction className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" aria-hidden />
      <div className="space-y-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">
          Coda verifica immagini AI — in arrivo
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          La tab AI per immagini in stato{' '}
          <strong className="text-slate-300">VERIFICARE IMMAGINE AI</strong> e filtri geografici è
          prevista in <strong className="text-slate-300">Macrofase 3</strong>. Nessuna coda
          operativa in Macrofase 1.
        </p>
      </div>
    </div>
  </div>
);
