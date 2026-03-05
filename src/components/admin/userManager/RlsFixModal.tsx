
import React, { useState } from 'react';
import { X, Terminal, Copy, CheckCircle, ExternalLink } from 'lucide-react';

interface Props {
    onClose: () => void;
}

export const RlsFixModal = ({ onClose }: Props) => {
    const [copied, setCopied] = useState(false);
    const sqlCode = `-- FIX DEFINITIVO PERMESSI CANCELLAZIONE (v8.0 - DELETE ENABLED)
-- Esegui questo script in Supabase > SQL Editor per sbloccare la cancellazione.

-- 1. Disabilita temporaneamente RLS per pulizia (Safety)
ALTER TABLE public.itineraries DISABLE ROW LEVEL SECURITY;

-- 2. Rimuovi TUTTE le policy esistenti (Tabula Rasa)
DROP POLICY IF EXISTS "Users can manage their own itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Enable read access for owners" ON public.itineraries;
DROP POLICY IF EXISTS "Enable insert for owners" ON public.itineraries;
DROP POLICY IF EXISTS "Enable update for owners" ON public.itineraries;
DROP POLICY IF EXISTS "Enable delete for owners" ON public.itineraries;
DROP POLICY IF EXISTS "Owner Full Access" ON public.itineraries;
DROP POLICY IF EXISTS "Public read for community itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Enable read access" ON public.itineraries;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.itineraries;
DROP POLICY IF EXISTS "Users Own Their Data" ON public.itineraries;
DROP POLICY IF EXISTS "Public Read Community" ON public.itineraries;

-- 3. Crea la "SUPER POLICY" per gli Utenti (CRUD Completo sui propri dati)
-- Questa policy permette INSERT, SELECT, UPDATE e DELETE se l'ID utente corrisponde.
CREATE POLICY "Users Own Their Data" ON public.itineraries
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Crea la Policy di Lettura Pubblica (Per itinerari community/official)
-- Permette a chiunque di leggere gli itinerari pubblicati, ma non di modificarli/cancellarli.
CREATE POLICY "Public Read Community" ON public.itineraries
FOR SELECT
USING (type = 'community' OR type = 'official');

-- 5. Riabilita RLS
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- 6. Grant finale (Per sicurezza, assicura che il ruolo authenticated abbia i permessi base)
GRANT ALL ON public.itineraries TO authenticated;
GRANT SELECT ON public.itineraries TO anon;
GRANT ALL ON public.itineraries TO service_role;

-- 7. Conferma successo
SELECT 'Permessi DELETE aggiornati con successo.' as status;
`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(sqlCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-indigo-500 shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-6 h-6"/></button>
                
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-900/40">
                        <Terminal className="w-6 h-6 text-white"/>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Fix Permessi Cancellazione (Ultimate)</h3>
                        <p className="text-sm text-slate-400">Questo script resetta completamente le regole di sicurezza per garantire che tu possa cancellare i tuoi diari.</p>
                    </div>
                </div>

                <div className="bg-black rounded-xl border border-slate-700 p-4 overflow-x-auto relative group flex-1 custom-scrollbar">
                    <pre className="text-emerald-400 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                        {sqlCode}
                    </pre>
                    <button 
                        onClick={copyToClipboard}
                        className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-slate-600 transition-all shadow-lg"
                    >
                        {copied ? <CheckCircle className="w-3 h-3 text-emerald-500"/> : <Copy className="w-3 h-3"/>}
                        {copied ? 'Copiato!' : 'Copia SQL'}
                    </button>
                </div>

                <div className="mt-6 space-y-3 shrink-0">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                        <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs shrink-0">1</span>
                        <p>Clicca <strong>Copia SQL</strong> qui sopra.</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                        <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs shrink-0">2</span>
                        <p>Vai su <strong>Supabase Dashboard</strong> {'>'} <strong>SQL Editor</strong>.</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                        <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs shrink-0">3</span>
                        <p>Incolla ed esegui (Run). Poi riprova a cancellare.</p>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end shrink-0">
                    <a 
                        href="https://supabase.com/dashboard/project/_/sql" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                    >
                        Vai a Supabase <ExternalLink className="w-4 h-4"/>
                    </a>
                </div>
            </div>
        </div>
    );
};
