
import React, { useState, useEffect } from 'react';
import { SystemMessageTemplate, saveSystemMessageAsync } from '../../../services/communicationService';
import { Layout, CheckCircle, Loader2, X, Eye, ArrowRight, PenTool, Plus, ArrowUp, ArrowDown, Move, Smartphone, Monitor, AlertTriangle, Trash2 } from 'lucide-react';
import { OnboardingVisualEditor } from '../onboarding/OnboardingVisualEditor';
import { DeleteConfirmationModal } from '../../common/DeleteConfirmationModal';

interface CommsTemplatesProps {
    templates: SystemMessageTemplate[];
    onSave: (tpl: SystemMessageTemplate) => Promise<void>;
    onUseTemplate: (tpl: SystemMessageTemplate) => void;
    onDelete?: (key: string) => Promise<void>; // NEW: Delete handler prop
    forcedTarget?: 'desktop' | 'mobile' | 'all'; 
}

export const CommsTemplates = ({ templates, onSave, onUseTemplate, onDelete, forcedTarget }: CommsTemplatesProps) => {
    const isOnboardingMode = templates.length > 0 && templates.every(t => t.type === 'onboarding' || t.key.startsWith('onboarding_')) || !!forcedTarget;
    
    const [editingTemplate, setEditingTemplate] = useState<SystemMessageTemplate | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<SystemMessageTemplate | null>(null);
    const [visualEditorTemplate, setVisualEditorTemplate] = useState<SystemMessageTemplate | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    
    // DELETE STATE (Identico a POI Manager)
    const [deleteTarget, setDeleteTarget] = useState<{ key: string, label: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [alertModal, setAlertModal] = useState<{isOpen: boolean, message: string} | null>(null);
    
    const [activeTab, setActiveTab] = useState<'external' | 'internal' | 'onboarding'>(
        isOnboardingMode ? 'onboarding' : 'external'
    );

    useEffect(() => {
        if (isOnboardingMode) {
            setActiveTab('onboarding');
        } else if (activeTab === 'onboarding') {
            setActiveTab('external');
        }
    }, [isOnboardingMode]);

    const handleSave = async () => {
        if (!editingTemplate) return;
        
        if (!editingTemplate.key) { 
            setAlertModal({ isOpen: true, message: "Il campo Chiave Univoca (ID) è obbligatorio." });
            return; 
        }
        
        setIsSaving(true);

        const payloadToSave = {
            ...editingTemplate,
            // Mantieni uiConfig esistente se non lo stiamo toccando qui
            uiConfig: editingTemplate.uiConfig || {},
            deviceTarget: forcedTarget || editingTemplate.deviceTarget || 'all'
        };

        await onSave(payloadToSave);
        setIsSaving(false);
        setEditingTemplate(null);
        setShowSuccessModal(true);
    };

    // HANDLE VISUAL EDITOR SAVE
    const handleSaveVisualConfig = async (config: any) => {
        if (!visualEditorTemplate) return;
        
        // Merge intelligente della configurazione
        // Config contiene { desktop: {...}, mobile: {...} } come restituito dall'editor
        
        const updatedTemplate = {
            ...visualEditorTemplate,
            uiConfig: {
                ...visualEditorTemplate.uiConfig, // Mantieni eventuali altre props
                desktop: config.desktop,
                mobile: config.mobile,
                // Legacy fallback support
                mascot: config.mascot,
                bubble: config.bubble,
                arrowDirection: config.arrowDirection
            },
            deviceTarget: forcedTarget || visualEditorTemplate.deviceTarget || 'all'
        };

        // Salva direttamente su DB
        await onSave(updatedTemplate);
        
        setVisualEditorTemplate(null);
        setShowSuccessModal(true);
    };

    const handleCreateNew = () => {
        setEditingTemplate({
            key: '',
            type: activeTab,
            label: 'Nuovo Messaggio',
            titleTemplate: '',
            bodyTemplate: '',
            variables: [],
            uiConfig: {}, // Init vuoto
            deviceTarget: forcedTarget || 'all'
        });
    };

    const handleReorder = async (index: number, direction: 'up' | 'down') => {
        if (!isOnboardingMode) return;
        
        const sortedList = [...filteredTemplates].sort((a, b) => 
            a.key.localeCompare(b.key, undefined, { numeric: true })
        );
        
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sortedList.length) return;
        
        const itemCurrent = sortedList[index];
        const itemTarget = sortedList[targetIndex];
        
        setIsSaving(true);
        try {
            // SWAP COMPLETO DEI CAMPI (Incluso uiConfig e Target)
            // Manteniamo solo la chiave originale per non rompere l'ordine numerico
            
            const payloadCurrent = {
                ...itemCurrent,
                label: itemTarget.label,
                titleTemplate: itemTarget.titleTemplate,
                bodyTemplate: itemTarget.bodyTemplate,
                variables: itemTarget.variables,
                uiConfig: itemTarget.uiConfig, // CRITICO: Scambia anche le posizioni
                deviceTarget: itemTarget.deviceTarget // CRITICO: Scambia il target device
            };
            
            const payloadTarget = {
                ...itemTarget,
                label: itemCurrent.label,
                titleTemplate: itemCurrent.titleTemplate,
                bodyTemplate: itemCurrent.bodyTemplate,
                variables: itemCurrent.variables,
                uiConfig: itemCurrent.uiConfig,
                deviceTarget: itemCurrent.deviceTarget
            };
            
            await saveSystemMessageAsync(payloadTarget);
            await onSave(payloadCurrent); // Trigger refresh on parent
            
        } catch (e) {
            console.error(e);
            setAlertModal({ isOpen: true, message: "Errore durante il riordino nel database." });
        } finally {
            setIsSaving(false);
        }
    };
    
    // REQUEST DELETE (OPEN MODAL)
    const handleDeleteRequest = (e: React.MouseEvent, tpl: SystemMessageTemplate) => {
        e.stopPropagation();
        setDeleteTarget({ key: tpl.key, label: tpl.label });
    };

    // CONFIRM DELETE (CALL PARENT)
    const confirmDelete = async () => {
        if (!deleteTarget || !onDelete) return;
        setIsDeleting(true);
        try {
            await onDelete(deleteTarget.key);
            setDeleteTarget(null);
        } catch(e) {
            console.error(e);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredTemplates = isOnboardingMode 
        ? templates 
        : templates.filter(t => t.type === activeTab);

    if (editingTemplate) {
         const isNew = !templates.find(t => t.key === editingTemplate.key);

        return (
            <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-slate-900/50">
                {alertModal && alertModal.isOpen && (
                    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 max-w-sm w-full text-center">
                            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center border-2 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                                <AlertTriangle className="w-8 h-8 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Attenzione</h3>
                                <p className="text-slate-400 text-sm">{alertModal.message}</p>
                            </div>
                            <button 
                                onClick={() => setAlertModal(null)}
                                className="mt-4 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase text-xs transition-colors border border-slate-700 hover:border-slate-600"
                            >
                                Chiudi
                            </button>
                        </div>
                    </div>
                )}

                <div className="max-w-3xl mx-auto space-y-6 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <PenTool className="w-6 h-6 text-indigo-500"/> {isNew ? 'Crea Nuovo Messaggio' : 'Modifica Messaggio'}
                        </h3>
                        <button onClick={() => setEditingTemplate(null)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full"><X className="w-6 h-6"/></button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 ml-1">Chiave Univoca (ID Sistema)</label>
                            <input 
                                value={editingTemplate.key} 
                                onChange={e => setEditingTemplate({...editingTemplate, key: e.target.value})} 
                                className={`w-full bg-slate-950 border rounded-xl p-3 text-white font-mono text-sm focus:border-indigo-500 outline-none ${isNew ? 'border-indigo-500/50' : 'border-slate-800 text-slate-500 cursor-not-allowed'}`}
                                disabled={!isNew}
                                placeholder="es. onboarding_step_1"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 ml-1">Etichetta Admin</label>
                            <input 
                                value={editingTemplate.label} 
                                onChange={e => setEditingTemplate({...editingTemplate, label: e.target.value})} 
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none text-sm"
                                placeholder="es. Intro Guida"
                            />
                        </div>
                    </div>
                    
                    {!forcedTarget && (
                        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                            <label className="text-[10px] font-bold text-indigo-400 uppercase block mb-2">Visibilità Dispositivo</label>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setEditingTemplate({...editingTemplate, deviceTarget: 'all'})}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all border ${editingTemplate.deviceTarget === 'all' || !editingTemplate.deviceTarget ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-white'}`}
                                >
                                    Tutti
                                </button>
                                <button 
                                    onClick={() => setEditingTemplate({...editingTemplate, deviceTarget: 'desktop'})}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all border flex items-center justify-center gap-2 ${editingTemplate.deviceTarget === 'desktop' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-white'}`}
                                >
                                    <Monitor className="w-3.5 h-3.5"/> Solo Desktop
                                </button>
                                <button 
                                    onClick={() => setEditingTemplate({...editingTemplate, deviceTarget: 'mobile'})}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all border flex items-center justify-center gap-2 ${editingTemplate.deviceTarget === 'mobile' ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-white'}`}
                                >
                                    <Smartphone className="w-3.5 h-3.5"/> Solo Mobile
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {forcedTarget && (
                        <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold uppercase ${
                            forcedTarget === 'mobile' ? 'bg-purple-900/20 border-purple-500/30 text-purple-400' : 
                            forcedTarget === 'desktop' ? 'bg-blue-900/20 border-blue-500/30 text-blue-400' :
                            'bg-slate-800 border-slate-700 text-slate-400'
                        }`}>
                            {forcedTarget === 'mobile' ? <Smartphone className="w-4 h-4"/> : forcedTarget === 'desktop' ? <Monitor className="w-4 h-4"/> : <Layout className="w-4 h-4"/>}
                            <span>Target Bloccato: {forcedTarget === 'all' ? 'Tutti' : forcedTarget}</span>
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 ml-1">Titolo (Oggetto)</label>
                        <input 
                            value={editingTemplate.titleTemplate || ''} 
                            onChange={e => setEditingTemplate({...editingTemplate, titleTemplate: e.target.value})} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none font-bold"
                            placeholder={activeTab === 'internal' ? 'Titolo del modale...' : 'Oggetto della notifica...'}
                        />
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 ml-1">Contenuto Messaggio</label>
                        <textarea 
                            value={editingTemplate.bodyTemplate} 
                            onChange={e => setEditingTemplate({...editingTemplate, bodyTemplate: e.target.value})} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white h-64 font-mono text-sm leading-relaxed resize-none focus:border-indigo-500 outline-none"
                            placeholder="Il testo del messaggio..."
                        />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                        <button onClick={() => setEditingTemplate(null)} className="px-6 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl font-bold uppercase text-xs transition-colors">Annulla</button>
                        <button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-black uppercase text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>} Salva Modifiche
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    if (previewTemplate) {
        return (
            <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewTemplate(null)}>
                <div className="bg-slate-900 w-full max-w-md p-6 rounded-3xl border border-slate-700 shadow-2xl relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setPreviewTemplate(null)} className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
                    <div className="mb-6 text-center">
                        <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                            <Layout className="w-8 h-8 text-indigo-500"/>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{previewTemplate.titleTemplate || previewTemplate.label}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{previewTemplate.bodyTemplate}</p>
                    </div>
                    <button onClick={() => setPreviewTemplate(null)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase text-xs">Chiudi Anteprima</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden relative">
            
            {/* DELETE MODAL (Identico a POI) */}
            <DeleteConfirmationModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Eliminare Messaggio?"
                message={`Stai per eliminare definitivamente "${deleteTarget?.label}". L'azione è irreversibile.`}
                isDeleting={isDeleting}
            />

            {showSuccessModal && (
                <div className="absolute inset-0 z-[6000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-emerald-500/50 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 max-w-sm w-full text-center">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <CheckCircle className="w-10 h-10 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2">Salvato!</h3>
                            <p className="text-slate-400 text-sm">Le modifiche sono state salvate nel database.</p>
                        </div>
                        <button 
                            onClick={() => setShowSuccessModal(false)}
                            className="mt-4 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase text-xs transition-colors border border-slate-700 hover:border-slate-600"
                        >
                            Chiudi
                        </button>
                    </div>
                </div>
            )}
            
            {visualEditorTemplate && (
                <OnboardingVisualEditor 
                    isOpen={true} 
                    onClose={() => setVisualEditorTemplate(null)} 
                    template={visualEditorTemplate}
                    onSavePosition={handleSaveVisualConfig}
                />
            )}

            {!isOnboardingMode ? (
                <div className="px-8 pt-6 pb-2 shrink-0 flex justify-between items-center">
                    <div className="flex gap-2">
                        <button onClick={() => setActiveTab('external')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'external' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 text-slate-500 hover:text-white border border-slate-800'}`}>Notifiche Esterne</button>
                        <button onClick={() => setActiveTab('internal')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'internal' ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-900 text-slate-500 hover:text-white border border-slate-800'}`}>Testi Interni</button>
                    </div>
                    <button onClick={handleCreateNew} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all"><Plus className="w-4 h-4"/> Nuovo</button>
                </div>
            ) : (
                <div className="px-8 pt-6 pb-2 shrink-0 flex justify-end">
                    <button onClick={handleCreateNew} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all"><Plus className="w-4 h-4"/> Nuovo Testo</button>
                </div>
            )}

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-1 gap-4">
                    {filteredTemplates.map((tpl, idx) => (
                        <div key={tpl.key} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row gap-6 items-start md:items-center hover:border-indigo-500/30 transition-colors group relative">
                            
                            {isOnboardingMode && (
                                <div className="flex flex-col gap-1 items-center bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
                                    <button onClick={() => handleReorder(idx, 'up')} disabled={isSaving || idx === 0} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white disabled:opacity-30"><ArrowUp className="w-4 h-4"/></button>
                                    <span className="text-[10px] font-bold text-slate-400 font-mono">{idx + 1}</span>
                                    <button onClick={() => handleReorder(idx, 'down')} disabled={isSaving || idx === filteredTemplates.length - 1} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white disabled:opacity-30"><ArrowDown className="w-4 h-4"/></button>
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-mono bg-slate-950 px-2 py-1 rounded border border-slate-700 text-slate-400">{tpl.key}</span>
                                    {tpl.deviceTarget === 'desktop' && <span className="text-[9px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 font-bold uppercase flex items-center gap-1"><Monitor className="w-3 h-3"/> Desktop</span>}
                                    {tpl.deviceTarget === 'mobile' && <span className="text-[9px] bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded border border-purple-500/30 font-bold uppercase flex items-center gap-1"><Smartphone className="w-3 h-3"/> Mobile</span>}
                                </div>
                                <h4 className="font-bold text-white text-lg mb-1">{tpl.label}</h4>
                                {tpl.titleTemplate && <p className="text-xs font-bold text-indigo-400 mb-1">Titolo: "{tpl.titleTemplate}"</p>}
                                <p className="text-sm text-slate-400 font-mono bg-slate-950/50 p-3 rounded-lg border border-slate-800 line-clamp-2">"{tpl.bodyTemplate}"</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                                <button onClick={() => setPreviewTemplate(tpl)} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-colors" title="Anteprima"><Eye className="w-5 h-5"/></button>
                                {isOnboardingMode && (
                                    <button onClick={() => setVisualEditorTemplate(tpl)} className="flex-1 md:flex-none px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 whitespace-nowrap" title="Posiziona Mascotte"><Move className="w-4 h-4"/> Editor Visivo</button>
                                )}
                                {!isOnboardingMode && (
                                    <button onClick={() => onUseTemplate(tpl)} className="flex-1 md:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 whitespace-nowrap"><ArrowRight className="w-4 h-4"/> Usa Questo</button>
                                )}
                                <button onClick={() => setEditingTemplate(tpl)} className="flex-1 md:flex-none px-4 py-2.5 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 border border-slate-700 transition-all whitespace-nowrap"><PenTool className="w-4 h-4"/> Modifica</button>
                                
                                {/* TASTO CESTINO (SOLO SE onDelete È PASSATO) */}
                                {onDelete && (
                                    <button 
                                        onClick={(e) => handleDeleteRequest(e, tpl)}
                                        className="p-2.5 bg-red-900/10 hover:bg-red-600 hover:text-white text-red-500 rounded-xl border border-red-900/30 transition-colors"
                                        title="Elimina Messaggio"
                                    >
                                        <Trash2 className="w-5 h-5"/>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};