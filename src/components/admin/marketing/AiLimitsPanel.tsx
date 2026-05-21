import React, { useState } from 'react';
import { Zap, Save, Loader2, Info } from 'lucide-react';
import { PricingVersionJoined, getModelLimits } from '../../../services/marketingService';

interface AiLimitsPanelProps {
    versions: PricingVersionJoined[];
    onSave: (id: string, flash: number, pro: number) => Promise<void>;
}

export const AiLimitsPanel: React.FC<AiLimitsPanelProps> = ({ versions, onSave }) => {
    // Filtriamo solo le versioni attive o draft per la modifica
    const editableVersions = versions.filter(v => !v.valid_until || new Date(v.valid_until) >= new Date());

    const typeMapping: Record<string, string> = {
        'tour_guide': 'Guide Turistiche',
        'tour_operator': 'Tour Operator',
        'travel_agency': 'Agenzie Viaggio',
        'local_sponsor': 'Sponsor Locali'
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-4">
                <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/70 leading-relaxed">
                    <strong className="text-amber-500 uppercase">Nota sul Versioning:</strong> Qualsiasi modifica ai limiti AI comporterà la creazione automatica di una <strong>nuova versione</strong> del listino. La versione precedente verrà archiviata per preservare l'integrità dei contratti esistenti.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editableVersions.map((ver) => (
                    <AiLimitCard 
                        key={ver.id} 
                        version={ver} 
                        planLabel={typeMapping[ver.plans?.type ?? ''] ?? ver.plans?.type ?? '—'} 
                        onSave={onSave} 
                    />
                ))}
            </div>
        </div>
    );
};

interface AiLimitCardProps {
    version: PricingVersionJoined;
    planLabel: string;
    onSave: (id: string, flash: number, pro: number) => Promise<void>;
}

const AiLimitCard: React.FC<AiLimitCardProps> = ({ version, planLabel, onSave }) => {
    const limits = getModelLimits(version.ai_limits);
    const [flash, setFlash] = useState(limits.flash || 0);
    const [pro, setPro] = useState(limits.pro || 0);
    const [isUpdating, setIsUpdating] = useState(false);

    const hasChanged = flash !== (limits.flash || 0) || pro !== (limits.pro || 0);

    const handleUpdate = async () => {
        setIsUpdating(true);
        try {
            await onSave(version.id, flash, pro);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col gap-6 hover:border-slate-700 transition-all">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight">{planLabel}</h4>
                    <p className="text-[10px] font-mono text-slate-500 uppercase">{version.duration_days} Giorni • €{version.price}</p>
                </div>
                {hasChanged && (
                    <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded italic animate-pulse">MODIFICATO</span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <Zap className="w-3 h-3 text-indigo-400" /> Flash Requests
                    </label>
                    <input 
                        type="number" 
                        value={flash}
                        onChange={(e) => setFlash(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-black focus:border-indigo-500 outline-none transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500" /> Pro Requests
                    </label>
                    <input 
                        type="number" 
                        value={pro}
                        onChange={(e) => setPro(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-black focus:border-amber-500 outline-none transition-all"
                    />
                </div>
            </div>

            <button 
                disabled={!hasChanged || isUpdating}
                onClick={handleUpdate}
                className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-tighter flex items-center justify-center gap-2 transition-all ${
                    hasChanged 
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                }`}
            >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salva Nuova Versione
            </button>
        </div>
    );
};
