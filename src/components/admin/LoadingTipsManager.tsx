
import React, { useState, useEffect } from 'react';
import { Lightbulb, Plus, Trash2, Eye, EyeOff, Loader2, RefreshCw, X, MessageSquare, List, Save, ArrowDownUp, Check, AlertTriangle } from 'lucide-react';
import { LoadingTip } from '../../types/index';
import { getLoadingTipsAsync, saveLoadingTipAsync, deleteLoadingTipAsync } from '../../services/contentService';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { useAdminStyles } from '../../hooks/useAdminStyles'; // IMPORTATO STYLES

// --- SUB-COMPONENT ESTRATTO (FIX FOCUS LOSS) ---
interface TipRowProps {
    tip: LoadingTip;
    savingId: string | null;
    onUpdate: (id: string, field: keyof LoadingTip, value: any) => void;
    onReorder: (id: string, value: string) => void;
    onSave: (tip: LoadingTip) => void;
    onToggle: (tip: LoadingTip) => void;
    onDeleteRequest: (e: React.MouseEvent, tip: LoadingTip) => void;
}

const TipRow: React.FC<TipRowProps> = ({ tip, savingId, onUpdate, onReorder, onSave, onToggle, onDeleteRequest }) => {
    const isSavingThis = savingId === tip.id;
    const [localOrder, setLocalOrder] = useState(tip.order?.toString() || "");

    useEffect(() => {
        setLocalOrder(tip.order?.toString() || "");
    }, [tip.order]);

    return (
        <div className={`p-3 rounded-2xl border flex items-center gap-4 transition-all group ${tip.active ? 'bg-slate-900 border-slate-700 shadow-sm' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
            {/* ORDER INPUT */}
            <div className="flex flex-col items-center justify-center w-20 shrink-0 border-r border-slate-800 pr-4 mr-2">
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">ORDINE</label>
                <input 
                    type="number" 
                    value={localOrder}
                    onChange={(e) => setLocalOrder(e.target.value)}
                    onBlur={(e) => onReorder(tip.id, e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.currentTarget.blur(); 
                        }
                    }}
                    className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl py-2.5 text-center text-xl font-black text-white focus:border-amber-500 outline-none shadow-inner"
                    style={{ colorScheme: 'dark' }} 
                />
            </div>

            {/* TEXT INPUT */}
            <div className="flex-1 min-w-0">
                <input 
                    value={tip.text}
                    onChange={(e) => onUpdate(tip.id, 'text', e.target.value)}
                    onBlur={() => onSave(tip)} 
                    className={`w-full bg-transparent border-b-2 border-transparent focus:border-indigo-500/50 focus:bg-slate-800/50 rounded-lg px-2 py-2 outline-none text-base font-medium transition-all ${tip.active ? 'text-white' : 'text-slate-400'}`}
                    placeholder="Testo del consiglio..."
                />
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-2">
                 <button 
                    type="button"
                    onClick={() => onSave(tip)}
                    className={`p-2.5 rounded-xl transition-all border ${isSavingThis ? 'text-emerald-400 bg-emerald-900/20 border-emerald-500/30' : 'text-slate-500 border-slate-700 hover:text-emerald-400 hover:bg-slate-800'}`}
                    title="Salva modifiche"
                >
                    {isSavingThis ? <Check className="w-5 h-5 animate-bounce"/> : <Save className="w-5 h-5"/>}
                </button>
                
                <button 
                    type="button"
                    onClick={() => onToggle(tip)} 
                    className={`p-2.5 rounded-xl transition-all border ${tip.active ? 'text-blue-400 border-blue-500/30 hover:bg-slate-800' : 'text-slate-600 border-slate-700 hover:text-white hover:bg-slate-800'}`}
                    title={tip.active ? "Nascondi" : "Attiva"}
                >
                    {tip.active ? <Eye className="w-5 h-5"/> : <EyeOff className="w-5 h-5"/>}
                </button>
                
                <button 
                    type="button"
                    onClick={(e) => onDeleteRequest(e, tip)} 
                    className="p-2.5 hover:bg-red-900/20 rounded-xl text-slate-600 hover:text-red-500 transition-colors border border-transparent hover:border-red-900/30"
                    title="Elimina"
                >
                    <Trash2 className="w-5 h-5"/>
                </button>
            </div>
        </div>
    );
};


export const LoadingTipsManager = () => {
    const [tips, setTips] = useState<LoadingTip[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { styles } = useAdminStyles(); // USATO STILI DINAMICI

    // States for New Tip Form
    const [newTipText, setNewTipText] = useState('');
    const [newTipType, setNewTipType] = useState<'tip' | 'status'>('tip');
    const [isSaving, setIsSaving] = useState(false);
    
    // State to track which item is being edited/saved
    const [savingId, setSavingId] = useState<string | null>(null);

    // DELETE STATE (Pattern POI Manager)
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, text: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const refresh = async () => {
        setIsLoading(true);
        const data = await getLoadingTipsAsync();
        // Ensure sorting by order index
        setTips(data.sort((a,b) => (a.order || 0) - (b.order || 0)));
        setIsLoading(false);
    };

    useEffect(() => {
        refresh();
    }, []);

    // --- CRUD ACTIONS ---

    const handleAdd = async () => {
        if (!newTipText.trim()) return;
        setIsSaving(true);
        
        // Calculate next order based on type to append at end
        const relevantTips = tips.filter(t => t.type === newTipType);
        const maxOrder = relevantTips.length > 0 ? Math.max(...relevantTips.map(t => t.order || 0)) : 0;

        const newTip: LoadingTip = {
            id: '', // Generated by DB
            text: newTipText,
            active: true,
            order: maxOrder + 1,
            type: newTipType
        };
        
        await saveLoadingTipAsync(newTip);
        setNewTipText('');
        await refresh();
        setIsSaving(false);
    };

    // Aggiornamento locale semplice (per testi o toggle rapidi)
    const handleInlineUpdate = (id: string, field: keyof LoadingTip, value: any) => {
        setTips(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    // LOGICA DI RIORDINAMENTO INTELLIGENTE (SHIFTING)
    const handleReorder = async (tipId: string, newOrderStr: string) => {
        const newOrder = parseInt(newOrderStr);
        if (isNaN(newOrder) || newOrder < 1) return;

        const targetTip = tips.find(t => t.id === tipId);
        if (!targetTip) return;

        // 1. Prendi tutti gli elementi DELLO STESSO TIPO, escluso quello che stiamo spostando
        const otherTips = tips
            .filter(t => t.type === targetTip.type && t.id !== tipId)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        // 2. Inseriamo l'elemento target nella nuova posizione
        let insertIndex = newOrder - 1;
        if (insertIndex < 0) insertIndex = 0;
        if (insertIndex > otherTips.length) insertIndex = otherTips.length;

        // Creiamo la nuova lista ordinata
        const reorderedList = [...otherTips];
        reorderedList.splice(insertIndex, 0, targetTip);

        // 3. Riassegnamo i numeri sequenziali (1, 2, 3...) a tutta la lista
        const updates = reorderedList.map((t, index) => ({
            ...t,
            order: index + 1
        }));

        // 4. Aggiorniamo lo stato locale (Ottimistico)
        setTips(prev => {
            const differentTypeTips = prev.filter(t => t.type !== targetTip.type);
            return [...differentTypeTips, ...updates].sort((a, b) => (a.order || 0) - (b.order || 0));
        });

        // 5. Salviamo tutto il blocco riordinato nel DB
        setSavingId('reordering'); 
        await Promise.all(updates.map(t => saveLoadingTipAsync(t)));
        setSavingId(null);
    };

    const handleSaveText = async (tip: LoadingTip) => {
        setSavingId(tip.id);
        await saveLoadingTipAsync(tip);
        setTimeout(() => setSavingId(null), 500);
    };

    const toggleActive = async (tip: LoadingTip) => {
        const updated = { ...tip, active: !tip.active };
        handleInlineUpdate(tip.id, 'active', !tip.active); // Optimistic UI
        await saveLoadingTipAsync(updated);
    };

    // Richiesta Cancellazione (apre modale)
    const handleDeleteRequest = (e: React.MouseEvent, tip: LoadingTip) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteTarget({ id: tip.id, text: tip.text });
    };

    // Conferma Cancellazione (esegue DB call)
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteLoadingTipAsync(deleteTarget.id);
            setTips(prev => prev.filter(t => t.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (e) {
            console.error("Errore cancellazione", e);
            alert("Impossibile eliminare l'elemento.");
        } finally {
            setIsDeleting(false);
        }
    };
    
    // Split tips for display (Sorted locally)
    const mainTips = tips.filter(t => t.type === 'tip').sort((a,b) => (a.order || 0) - (b.order || 0));
    const statusTips = tips.filter(t => t.type === 'status').sort((a,b) => (a.order || 0) - (b.order || 0));

    return (
        <div className="flex flex-col h-full space-y-6 relative">
            
            {/* DELETE MODAL (Identico a POI Manager) */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-red-500/50 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative animate-in zoom-in-95">
                        <div className="flex flex-col items-center text-center gap-4">
                             <AlertTriangle className="w-16 h-16 text-red-500 animate-pulse"/>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2 font-display">Eliminare Elemento?</h3>
                                <p className="text-sm text-slate-300 leading-relaxed">Stai per cancellare: <br/><strong className="text-white">"{deleteTarget.text}"</strong>.<br/>Questa azione è irreversibile.</p>
                            </div>
                            <div className="flex gap-3 w-full mt-2">
                                <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors">Annulla</button>
                                <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2">
                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>} Elimina
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER CLEAN DESIGN */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-600 rounded-xl shadow-lg">
                        <Lightbulb className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className={styles.admin_page_title}>Loading Tips</h2>
                        <p className={styles.admin_page_subtitle}>Gestisci i messaggi di attesa e i caricamenti</p>
                    </div>
                </div>
                 <button onClick={refresh} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors border border-slate-700">
                    <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}/>
                </button>
            </div>

            {/* ADD NEW FORM */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shrink-0 shadow-lg flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Nuovo Testo</label>
                    <input 
                        value={newTipText} 
                        onChange={e => setNewTipText(e.target.value)} 
                        placeholder="Es. Sapevi che..." 
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    />
                </div>
                <div className="w-full md:w-48">
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Tipologia</label>
                    <select 
                        value={newTipType} 
                        onChange={e => setNewTipType(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                    >
                        <option value="tip">Consiglio (Grande)</option>
                        <option value="status">Stato (Piccolo)</option>
                    </select>
                </div>
                <button 
                    onClick={handleAdd} 
                    disabled={!newTipText || isSaving} 
                    className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>} 
                    Aggiungi
                </button>
            </div>

            {/* SPLIT LISTS */}
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden pb-4">
                
                {/* COLUMN 1: MAIN TIPS */}
                <div className="flex flex-col bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
                    <div className="p-4 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-amber-500"/>
                            <h3 className="font-bold text-white text-sm uppercase tracking-wide">Consigli del Giorno</h3>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                             {mainTips.length} items
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                        {mainTips.length === 0 && <div className="text-center py-10 text-slate-500 italic text-xs">Nessun consiglio inserito.</div>}
                        {mainTips.map(tip => (
                            <TipRow 
                                key={tip.id} 
                                tip={tip} 
                                savingId={savingId}
                                onUpdate={handleInlineUpdate}
                                onReorder={handleReorder}
                                onSave={handleSaveText}
                                onToggle={toggleActive}
                                onDeleteRequest={handleDeleteRequest}
                            />
                        ))}
                    </div>
                </div>

                {/* COLUMN 2: LOADING STATUSES */}
                <div className="flex flex-col bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
                    <div className="p-4 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between sticky top-0 z-10">
                         <div className="flex items-center gap-2">
                            <List className="w-4 h-4 text-indigo-500"/>
                            <h3 className="font-bold text-white text-sm uppercase tracking-wide">Stati Caricamento</h3>
                         </div>
                         <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                             {statusTips.length} items
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                         {statusTips.length === 0 && <div className="text-center py-10 text-slate-500 italic text-xs">Nessuno stato inserito.</div>}
                         {statusTips.map(tip => (
                             <TipRow 
                                key={tip.id} 
                                tip={tip} 
                                savingId={savingId}
                                onUpdate={handleInlineUpdate}
                                onReorder={handleReorder}
                                onSave={handleSaveText}
                                onToggle={toggleActive}
                                onDeleteRequest={handleDeleteRequest}
                            />
                         ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
