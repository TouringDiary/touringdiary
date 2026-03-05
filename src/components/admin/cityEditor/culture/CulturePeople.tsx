
import React, { useState } from 'react';
import { Users, Eye, Plus, Sparkles, Loader2, Wand2, Check, X, ChevronUp, ChevronDown, Calendar, Save, Trash2, Info, Hammer, AlertTriangle, MapPin, Clock, Square, CheckSquare, Layers, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { FamousPerson, User } from '../../../../types/index';
import { AiFieldHelper } from '../../AiFieldHelper';
import { DeleteConfirmationModal } from '../../../common/DeleteConfirmationModal';
import { useCityEditor } from '../../../../context/CityEditorContext';
import { CultureCornerModal } from '../../../modals/CultureCornerModal';
import { usePeopleManager } from '../../../../hooks/admin/usePeopleManager';
import { ImageWithFallback } from '../../../common/ImageWithFallback';

interface CulturePeopleProps {
    cityId: string;
    cityName: string;
    currentUser?: User;
}

export const CulturePeople: React.FC<CulturePeopleProps> = ({ cityId, cityName, currentUser }) => {
    const { city, setCityDirectly } = useCityEditor();
    
    // --- USE HOOK ---
    const {
        peopleList,
        isLoading,
        processingId,
        isDiscovering,
        discoveryResults,
        isDeleting,
        isBulkProcessing,
        selectedIds, 
        toggleSelection, 
        toggleAll, 
        bulkUpdateStatus, 
        wipeAndRewritePerson,
        regeneratePortrait, 
        fixPeopleBatch, 
        addManualPerson,
        deletePerson,
        updatePersonLocal,
        savePersonChanges,
        toggleStatus,
        reorderPerson,
        runDiscovery,
        importDiscoveryPerson,
        removeDiscoveryResult
    } = usePeopleManager(cityId, cityName);

    const [expandedPersonId, setExpandedPersonId] = useState<string | null>(null);
    const [aiContextQuery, setAiContextQuery] = useState('');
    const [discoveryCount, setDiscoveryCount] = useState<number>(3);
    
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);
    const [refineTarget, setRefineTarget] = useState<FamousPerson | null>(null);
    const [showBulkFixConfirm, setShowBulkFixConfirm] = useState(false);
    
    // STATE MODALE SUCCESSO
    const [successModal, setSuccessModal] = useState<{ isOpen: boolean, message: string }>({ isOpen: false, message: '' });
    
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewInitialId, setPreviewInitialId] = useState<string | undefined>(undefined);

    const handleAddManual = async () => {
        const newId = await addManualPerson();
        if (newId) setExpandedPersonId(newId);
    };

    const handleDeleteRequest = (person: FamousPerson) => {
        setDeleteTarget({ id: person.id!, name: person.name });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const success = await deletePerson(deleteTarget.id);
        if (success) setDeleteTarget(null);
        else alert("Errore cancellazione.");
    };
    
    const handleRefineRequest = (person: FamousPerson) => {
        setRefineTarget(person);
    };

    const confirmRefine = async () => {
        if (!refineTarget) return;
        const target = refineTarget;
        setRefineTarget(null);
        const result = await wipeAndRewritePerson(target, currentUser);
        if (!result?.success) {
            alert("Errore durante la bonifica: " + (result?.error || "Sconosciuto"));
        } else {
            setSuccessModal({ isOpen: true, message: `Bonifica completata per ${target.name}` });
        }
    };
    
    const confirmBulkFix = async () => {
        setShowBulkFixConfirm(false);
        const result = await fixPeopleBatch(currentUser);
        if (result?.success) {
             setSuccessModal({ isOpen: true, message: `Bonifica completata! Processati ${result.count} personaggi.` });
        }
    };

    const handleOpenPreview = (personId?: string) => {
        if (city) {
            const tempDetails = { ...city.details, famousPeople: peopleList };
            setCityDirectly({ ...city, details: tempDetails });
        }
        setPreviewInitialId(personId);
        setPreviewModalOpen(true);
    };

    const allSelected = peopleList.length > 0 && selectedIds.size === peopleList.length;
    const selectedCount = selectedIds.size;
    const isSelectionActive = selectedCount > 0;

    return (
        <div className="bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-slate-800 shadow-2xl relative">
            
            {/* SUCCESS MODAL */}
            {successModal.isOpen && (
                <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-emerald-500/50 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 max-w-sm w-full text-center">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <CheckCircle className="w-10 h-10 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Ottimo Lavoro!</h3>
                            <p className="text-slate-400 text-sm">{successModal.message}</p>
                        </div>
                        <button onClick={() => setSuccessModal({ isOpen: false, message: '' })} className="mt-4 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase text-xs transition-colors border border-slate-700 hover:border-slate-600">Chiudi</button>
                    </div>
                </div>
            )}
            
            {deleteTarget && (
                <DeleteConfirmationModal 
                    isOpen={true}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={confirmDelete}
                    title="Eliminare Personaggio?"
                    message={`Stai per eliminare definitivamente "${deleteTarget.name}". L'azione è irreversibile.`}
                    isDeleting={isDeleting}
                    icon={<Trash2 className="w-8 h-8"/>}
                />
            )}
            
            <DeleteConfirmationModal 
                isOpen={!!refineTarget}
                onClose={() => setRefineTarget(null)}
                onConfirm={confirmRefine}
                title="Bonifica Dati & Luoghi?"
                message={`Vuoi riscrivere i dati di "${refineTarget?.name}" tramite AI Pro?\n\nInclude la ricerca di nuovi luoghi correlati e la ricerca dell'immagine.`}
                confirmLabel="Sì, Bonifica Tutto"
                cancelLabel="Annulla"
                variant="info" 
                icon={<Sparkles className="w-8 h-8 text-indigo-400 animate-pulse"/>}
            />

            <DeleteConfirmationModal 
                isOpen={showBulkFixConfirm}
                onClose={() => setShowBulkFixConfirm(false)}
                onConfirm={confirmBulkFix}
                title={isSelectionActive ? `Bonifica ${selectedCount} Selezionati?` : "Bonifica Intera Lista?"}
                message={
                    isSelectionActive 
                    ? `Stai per avviare la bonifica per ${selectedCount} personaggi selezionati.\n\nL'operazione rigenererà dati e immagini mancanti.`
                    : `Stai per avviare la bonifica automatica per TUTTI i ${peopleList.length} personaggi.\n\nL'operazione:\n1. Riscriverà bio e date\n2. Cercherà luoghi correlati\n3. CERCHERÀ LE FOTO NELLO STORAGE O LE GENERERÀ (richiede tempo e quota AI).`
                }
                confirmLabel={isSelectionActive ? "Sì, Bonifica Selezione" : "Sì, Procedi su Tutti"}
                cancelLabel="Annulla"
                variant="info" 
                icon={<Wand2 className="w-8 h-8 text-purple-400 animate-pulse"/>}
            />

            {previewModalOpen && city && (
                 <CultureCornerModal 
                    isOpen={true} 
                    onClose={() => setPreviewModalOpen(false)} 
                    city={{ ...city, details: { ...city.details, famousPeople: peopleList } }} 
                    onAddToItinerary={() => {}} 
                    initialPersonId={previewInitialId}
                />
             )}

            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 md:mb-6 border-b border-slate-800 pb-4 gap-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 md:w-6 md:h-6 text-indigo-500"/> Personaggi Famosi
                    </h3>
                    <span className="text-xs bg-slate-950 px-2 py-1 rounded text-slate-500 font-mono border border-slate-800">{peopleList.length} totali</span>
                </div>
                
                <div className="flex flex-wrap gap-2 items-center">
                    {peopleList.length > 0 && (
                        <button 
                            onClick={() => setShowBulkFixConfirm(true)} 
                            disabled={isBulkProcessing || isLoading}
                            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-[10px] md:text-sm font-bold flex items-center gap-1 shadow-lg shadow-purple-900/20 border border-purple-500"
                            title={isSelectionActive ? "Riscrivi selezionati" : "Riscrivi e correggi TUTTI"}
                        >
                            {isBulkProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Wand2 className="w-4 h-4"/>} 
                            {isBulkProcessing ? 'Bonifica in corso...' : (isSelectionActive ? `Magic Fix (${selectedCount})` : 'Magic Fix (Tutti)')}
                        </button>
                    )}

                    <div className="w-px h-6 bg-slate-700 mx-1 hidden md:block"></div>

                    <button onClick={() => handleOpenPreview()} className="bg-slate-800 p-2 rounded-lg text-white hover:bg-slate-700 transition-colors" title="Anteprima Lista"><Eye className="w-4 h-4"/></button>
                    <button onClick={handleAddManual} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-[10px] md:text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4"/> <span className="hidden md:inline">Nuovo</span></button>
                </div>
            </div>

            {/* LEGAL DISCLAIMER */}
            <div className="mb-4 flex items-start gap-3 bg-blue-900/10 border border-blue-500/20 p-3 rounded-xl">
                 <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5"/>
                 <p className="text-xs text-blue-200 leading-relaxed">
                     <strong>Nota Legale:</strong> I ritratti storici generati dall'AI sono interpretazioni artistiche a scopo illustrativo. 
                     Non costituiscono documentazione storica fotografica ufficiale. Questo disclaimer è visibile anche agli utenti.
                 </p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4 bg-slate-950/50 p-2 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                    <button onClick={toggleAll} className="p-1.5 rounded hover:bg-slate-800 transition-colors">
                        {allSelected ? <CheckSquare className="w-5 h-5 text-indigo-500"/> : <Square className="w-5 h-5"/>}
                    </button>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{selectedIds.size} SELEZIONATI</span>
                </div>

                {selectedIds.size > 0 && (
                    <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
                        <button 
                            onClick={() => bulkUpdateStatus('published')}
                            disabled={isBulkProcessing}
                            className="flex items-center gap-1.5 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors border border-emerald-500/30"
                        >
                            <Eye className="w-3.5 h-3.5"/> Pubblica
                        </button>
                        <button 
                            onClick={() => bulkUpdateStatus('draft')}
                            disabled={isBulkProcessing}
                            className="flex items-center gap-1.5 bg-amber-900/30 hover:bg-amber-900/50 text-amber-400 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors border border-amber-500/30"
                        >
                            <Layers className="w-3.5 h-3.5"/> Bozza
                        </button>
                    </div>
                )}
            </div>

            <div className="mb-6 p-4 bg-indigo-950/20 rounded-2xl border border-indigo-500/20">
                 <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <h4 className="text-indigo-300 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                            <Sparkles className="w-4 h-4"/> Deep Discovery (Gemini Pro)
                        </h4>
                        
                        <div className="flex items-center gap-2">
                             <select 
                                value={discoveryCount} 
                                onChange={(e) => setDiscoveryCount(parseInt(e.target.value))}
                                className="w-16 bg-slate-950 border border-indigo-500/50 text-white text-[10px] font-bold rounded px-2 py-1 outline-none"
                             >
                                 <option value={1}>1</option>
                                 <option value={3}>3</option>
                                 <option value={5}>5</option>
                             </select>
                            <button 
                                onClick={() => runDiscovery(aiContextQuery, discoveryCount)} 
                                disabled={isDiscovering} 
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-1 disabled:opacity-50 transition-all"
                            >
                                {isDiscovering ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>} Suggerisci
                            </button>
                        </div>
                    </div>
                    <input 
                        value={aiContextQuery} 
                        onChange={(e) => setAiContextQuery(e.target.value)} 
                        placeholder="Cosa cerchi? (es. Pittori del 700...)" 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                    />
                </div>
                {discoveryResults.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                        {discoveryResults.map((p, i) => (
                            <div key={i} className="bg-slate-900 p-3 rounded-xl border border-slate-700 flex flex-col gap-2 relative group hover:border-indigo-500 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-white text-xs truncate">{p.name}</div>
                                        <div className="text-[9px] text-slate-400 truncate mb-1">{p.role}</div>
                                        <p className="text-[9px] text-slate-500 line-clamp-3 leading-snug italic border-l border-slate-700 pl-2">
                                            "{p.bio || 'Nessuna bio'}"
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => importDiscoveryPerson(p)} 
                                    disabled={p.isImporting}
                                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 mt-auto"
                                >
                                    {p.isImporting ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3"/>}
                                    {p.isImporting ? 'Creazione Asset...' : 'Importa + Foto'}
                                </button>
                                <button onClick={() => removeDiscoveryResult(p.name)} className="absolute top-1 right-1 text-slate-600 hover:text-white"><X className="w-3 h-3"/></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                {isLoading ? (
                    <div className="text-center py-4"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-500"/></div>
                ) : (
                    peopleList.map((p, idx) => {
                         const isExpanded = expandedPersonId === p.id;
                         const isPublished = p.status === 'published';
                         const isProcessingThis = processingId === p.id;
                         const isSelected = selectedIds.has(p.id!); 
                         
                         const hasFullBio = p.fullBio && p.fullBio.length > 50;
                         const hasDates = p.lifespan && p.lifespan.length > 5;
                         const dataQuality = hasFullBio && hasDates ? 'high' : 'low';

                         return (
                            <div 
                                id={`person-card-${p.id}`} 
                                key={p.id || idx} 
                                className={`bg-slate-900 rounded-xl border transition-all ${isProcessingThis ? 'border-yellow-400 ring-2 ring-yellow-400/50 scale-[1.01] z-10' : isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-indigo-900/10' : 'border-slate-800 hover:border-slate-700'}`}
                            >
                                <div className="p-3 md:p-4 flex gap-3 items-center group">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleSelection(p.id!); }}
                                        className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${isSelected ? 'text-indigo-500' : 'text-slate-600'}`}
                                    >
                                        {isSelected ? <CheckSquare className="w-5 h-5"/> : <Square className="w-5 h-5"/>}
                                    </button>

                                    <div className="w-12 shrink-0">
                                        <input type="number" min="1" value={p.orderIndex || idx + 1} onChange={(e) => reorderPerson(p.id!, parseInt(e.target.value))} className="w-full bg-slate-950 border-2 border-slate-700 rounded-lg text-center text-white text-base font-black py-1 focus:border-indigo-500 outline-none shadow-inner"/>
                                    </div>

                                    <div className="flex gap-3 items-center flex-1 cursor-pointer" onClick={() => !isProcessingThis && setExpandedPersonId(isExpanded ? null : p.id!)}>
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border border-slate-700 shrink-0">
                                             <ImageWithFallback src={p.imageUrl} alt={p.name} className={`w-full h-full object-cover ${!isPublished ? 'grayscale opacity-60' : ''}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-white text-sm truncate">{p.name}</h4>
                                                {isPublished ? <span className="text-[9px] bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold uppercase">Online</span> : <span className="text-[9px] bg-amber-900/30 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold uppercase">Bozza</span>}
                                                {isProcessingThis && (
                                                    <span className="text-[9px] bg-yellow-500 text-black px-2 py-0.5 rounded-full font-black uppercase flex items-center gap-1 animate-pulse border border-yellow-300">
                                                        <Loader2 className="w-3 h-3 animate-spin"/> LAVORAZIONE...
                                                    </span>
                                                )}
                                                {!isProcessingThis && dataQuality === 'low' && <span className="text-[9px] text-red-400 font-bold uppercase">Dati Incompleti</span>}
                                            </div>
                                            <p className="text-[10px] md:text-xs text-slate-400 truncate">{p.role}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); handleOpenPreview(p.id!); }} className="p-1.5 md:p-2 text-indigo-400 hover:text-white hover:bg-indigo-600 rounded transition-colors" title="Anteprima Utente"><Eye className="w-4 h-4"/></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRequest(p); }} className="p-1.5 md:p-2 text-slate-600 hover:text-red-500 hover:bg-slate-900 rounded"><Trash2 className="w-4 h-4"/></button>
                                        <button onClick={() => setExpandedPersonId(isExpanded ? null : p.id!)} className="p-1">{isExpanded ? <ChevronUp className="w-5 h-5 text-indigo-400"/> : <ChevronDown className="w-5 h-5 text-slate-500"/>}</button>
                                    </div>
                                </div>
                                
                                {isExpanded && !isProcessingThis && (
                                    <div className="px-3 md:px-4 pb-4 border-t border-slate-800/50 pt-4 space-y-4 bg-slate-900/50 rounded-b-xl animate-in slide-in-from-top-2">
                                        <div className="flex justify-between items-center mb-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                                            <button 
                                                onClick={() => handleRefineRequest(p)} 
                                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-bold uppercase flex items-center gap-1 shadow-md transition-all active:scale-95" 
                                                title="Riscrivi Dati (Bio e Date)"
                                            >
                                                <Wand2 className="w-3 h-3"/> Magic Fix (Dati)
                                            </button>
                                            <button onClick={() => toggleStatus(p)} className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-colors ${isPublished ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-amber-600 text-white hover:bg-amber-500'}`}>{isPublished ? 'PUBBLICATO' : 'BOZZA (NASCOSTO)'}</button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <input value={p.name} onChange={e => updatePersonLocal(p.id!, 'name', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm w-full" placeholder="Nome Completo"/>
                                            <input value={p.role} onChange={e => updatePersonLocal(p.id!, 'role', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-300 text-sm w-full" placeholder="Ruolo"/>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="relative"><Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500"/><input value={p.lifespan || ''} onChange={e => updatePersonLocal(p.id!, 'lifespan', e.target.value)} className={`bg-slate-900 border rounded px-3 py-2 pl-9 text-xs w-full ${!hasDates ? 'border-red-500 text-red-200' : 'border-slate-700 text-slate-300'}`} placeholder="Periodo (es. 1898-1967)"/></div>
                                            
                                            {/* IMAGE ROW WITH MAGIC GENERATOR */}
                                            <div className="flex gap-1">
                                                <input value={p.imageUrl} onChange={e => updatePersonLocal(p.id!, 'imageUrl', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-300 text-xs w-full" placeholder="URL Immagine"/>
                                                <button onClick={() => regeneratePortrait(p)} className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded border border-indigo-500" title="Genera Ritratto AI">
                                                    <ImageIcon className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <textarea rows={2} value={p.bio} onChange={e => updatePersonLocal(p.id!, 'bio', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-slate-300 text-xs resize-none" placeholder="Bio breve..."/>
                                        
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase">Biografia Completa (Estesa)</label>
                                                <span className="text-[9px] text-amber-500 bg-amber-900/10 px-2 rounded border border-amber-500/20">Usa "TITOLO: Nome" per i paragrafi</span>
                                            </div>
                                            <textarea rows={6} value={p.fullBio || ''} onChange={e => updatePersonLocal(p.id!, 'fullBio', e.target.value)} className={`w-full bg-slate-900 border rounded p-3 text-white text-xs resize-none font-serif ${!hasFullBio ? 'border-red-500/50' : 'border-slate-700'}`} placeholder="Biografia estesa (obbligatoria)..."/>
                                            <AiFieldHelper contextLabel={`biografia estesa di ${p.name}`} onApply={val => updatePersonLocal(p.id!, 'fullBio', val)} currentValue={p.fullBio} compact={true} fieldId={`bio_extended_${p.id}`}/>
                                        </div>

                                        <div className="mt-4 border-t border-slate-800 pt-4">
                                            <h5 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2"><MapPin className="w-3.5 h-3.5"/> Luoghi Correlati (Auto-Generati)</h5>
                                            {!p.relatedPlaces || p.relatedPlaces.length === 0 ? (
                                                <p className="text-xs text-slate-600 italic">Nessun luogo collegato. Usa Magic Fix.</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {p.relatedPlaces.map((place, placeIdx) => (
                                                         <div key={placeIdx} className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center group/place hover:border-slate-700">
                                                             <div>
                                                                 <div className="font-bold text-white text-xs">{place.name}</div>
                                                                 <div className="text-[10px] text-slate-500">{place.address}</div>
                                                             </div>
                                                             <div className="text-right flex flex-col items-end gap-1">
                                                                 <div className="text-[10px] font-bold text-amber-500 bg-amber-900/10 px-1.5 rounded border border-amber-500/20">
                                                                    {[...Array(place.priceLevel || 1)].map((_, i) => "€").join('')}
                                                                 </div>
                                                                 <div className="text-[9px] text-slate-400 flex items-center gap-1">
                                                                     <Clock className="w-2.5 h-2.5"/> {place.visitDuration}
                                                                 </div>
                                                             </div>
                                                         </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex justify-end pt-2">
                                            <button onClick={() => savePersonChanges(p)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-1 shadow-lg"><Save className="w-3 h-3"/> Salva Modifiche</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                         );
                    })
                )}
            </div>
        </div>
    );
};
