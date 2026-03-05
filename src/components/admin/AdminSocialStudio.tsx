
import React, { useState } from 'react';
import { Layout, Plus, Save, Trash2, Palette, CheckCircle, Share2, MessageCircle, Wand2, Loader2, Type } from 'lucide-react';
import { SocialCanvas } from './social/SocialCanvas';
import { AiBackgroundPanel } from './social/AiBackgroundPanel';
import { SocialPreviewConfig } from './social/SocialPreviewConfig'; 
import { CommsTemplates } from './communications/CommsTemplates'; 
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { useAdminStyles } from '../../hooks/useAdminStyles'; // IMPORTATO STYLES

// Custom Hooks
import { useSocialCanvasLogic } from '../../hooks/admin/useSocialCanvasLogic';
import { useSocialTemplates } from '../../hooks/admin/useSocialTemplates';

export const AdminSocialStudio = () => {
    const [activeTab, setActiveTab] = useState<'templates' | 'preview' | 'viral'>('templates');
    const { styles } = useAdminStyles(); // USATO STILI DINAMICI
    
    // --- HOOKS ---
    const canvasLogic = useSocialCanvasLogic();
    const templateLogic = useSocialTemplates();

    // --- BRIDGING LOGIC ---

    const handleSelectTemplateWrapper = (t: any) => {
        templateLogic.selectTemplate(t);
        canvasLogic.loadFromTemplate(t);
    };

    const handleNewWrapper = () => {
        templateLogic.clearActiveTemplate();
        canvasLogic.resetToDefault();
    };
    
    const handleSaveGraphicsWrapper = async () => {
        await templateLogic.saveGraphicsTemplate(
            canvasLogic.templateName,
            canvasLogic.editorBg,
            canvasLogic.editorLayout
        );
    };

    // Eliminazione con reset editor se necessario
    const handleConfirmDeleteWrapper = async () => {
        const idToDelete = templateLogic.deleteTarget?.id;
        await templateLogic.confirmDelete();
        // Se abbiamo cancellato il template attivo, resetta l'editor
        if (templateLogic.activeTemplate?.id === idToDelete) {
            canvasLogic.resetToDefault();
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in relative">
            
            {/* MODALS */}
            {templateLogic.deleteTarget && (
                <DeleteConfirmationModal 
                    isOpen={true}
                    onClose={templateLogic.closeModals}
                    onConfirm={handleConfirmDeleteWrapper}
                    title="Eliminare Template?"
                    message={`Stai per eliminare definitivamente il template "${templateLogic.deleteTarget.name}".`}
                    isDeleting={templateLogic.isDeleting}
                />
            )}
            {templateLogic.showSuccessModal && (
                <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-emerald-500/50 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 max-w-sm w-full text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600"></div>
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]"><CheckCircle className="w-10 h-10 text-emerald-500" /></div>
                        <div><h3 className="text-2xl font-bold text-white mb-1">Salvato!</h3><p className="text-slate-400 text-sm">Operazione completata.</p></div>
                        <button onClick={templateLogic.closeModals} className="mt-2 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase text-xs transition-colors border border-slate-700 hover:border-slate-600">Chiudi</button>
                    </div>
                </div>
            )}

            {/* HEADER CLEAN DESIGN */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg">
                            <Layout className="w-6 h-6 text-white"/>
                        </div>
                        <div>
                            <h2 className={styles.admin_page_title}>Social Studio</h2>
                            <p className={styles.admin_page_subtitle}>Marketing Virale e Anteprime Link</p>
                        </div>
                    </div>
                    {activeTab === 'templates' && (
                        <div className="flex gap-2">
                            <button onClick={handleNewWrapper} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold text-xs uppercase flex items-center gap-2 hover:bg-slate-700 transition-colors"><Plus className="w-4 h-4"/> Nuovo</button>
                            <button onClick={handleSaveGraphicsWrapper} disabled={templateLogic.isSaving} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs uppercase flex items-center gap-2 shadow-lg hover:bg-emerald-500 transition-colors">{templateLogic.isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Salva</button>
                        </div>
                    )}
                </div>

                {/* TABS SWITCHER */}
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit overflow-x-auto gap-1">
                    <button 
                        onClick={() => setActiveTab('templates')} 
                        className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'templates' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                    >
                        <Layout className="w-4 h-4"/> Visual Maker
                    </button>
                    <button 
                        onClick={() => setActiveTab('preview')} 
                        className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'preview' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                    >
                        <Share2 className="w-4 h-4"/> Anteprima SEO
                    </button>
                    <button 
                        onClick={() => setActiveTab('viral')} 
                        className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'viral' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                    >
                        <MessageCircle className="w-4 h-4"/> Messaggi Virali
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            {activeTab === 'templates' && (
                <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
                    
                    {/* LEFT SIDEBAR: LIST & TOOLS */}
                    <div className="w-full lg:w-80 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">I Tuoi Template</h4>
                            <div className="space-y-2">
                                {templateLogic.templates.map(t => (
                                    <div key={t.id} onClick={() => handleSelectTemplateWrapper(t)} className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center group ${templateLogic.activeTemplate?.id === t.id ? 'bg-indigo-900/30 border-indigo-500' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}>
                                        <span className="text-sm font-bold text-white truncate max-w-[150px]">{t.name}</span>
                                        <button onClick={(e) => { e.stopPropagation(); templateLogic.requestDelete(t.id, t.name); }} className="text-slate-600 hover:text-red-500 p-1.5 hover:bg-slate-900 rounded transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                                    </div>
                                ))}
                                {templateLogic.templates.length === 0 && <div className="text-slate-600 text-xs italic text-center">Nessun template.</div>}
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Palette className="w-4 h-4"/> Stile Testi</h4>
                             <div className="mb-4 pb-4 border-b border-slate-800">
                                 <label className="text-[10px] font-bold text-indigo-400 uppercase block mb-2">Nome Utente</label>
                                 <div className="grid grid-cols-2 gap-2">
                                     <div><label className="text-[9px] text-slate-500 block">Colore</label><input type="color" value={canvasLogic.editorLayout.userName.color} onChange={e => canvasLogic.updateTextStyle('userName', 'color', e.target.value)} className="w-full h-8 rounded bg-transparent cursor-pointer"/></div>
                                     <div><label className="text-[9px] text-slate-500 block">Size</label><input type="number" value={canvasLogic.editorLayout.userName.fontSize} onChange={e => canvasLogic.updateTextStyle('userName', 'fontSize', parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-white text-xs"/></div>
                                 </div>
                             </div>
                             <div>
                                 <label className="text-[10px] font-bold text-amber-400 uppercase block mb-2">Codice Referral</label>
                                 <div className="grid grid-cols-2 gap-2">
                                     <div><label className="text-[9px] text-slate-500 block">Colore</label><input type="color" value={canvasLogic.editorLayout.referralCode.color} onChange={e => canvasLogic.updateTextStyle('referralCode', 'color', e.target.value)} className="w-full h-8 rounded bg-transparent cursor-pointer"/></div>
                                     <div><label className="text-[9px] text-slate-500 block">Size</label><input type="number" value={canvasLogic.editorLayout.referralCode.fontSize} onChange={e => canvasLogic.updateTextStyle('referralCode', 'fontSize', parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-white text-xs"/></div>
                                 </div>
                             </div>
                        </div>
                        
                        <AiBackgroundPanel onBgSelected={canvasLogic.setEditorBg} />
                    </div>

                    {/* MAIN: CANVAS EDITOR */}
                    <div className="flex-1 bg-slate-950 rounded-3xl border border-slate-800 flex flex-col items-center justify-center p-8 relative shadow-inner overflow-hidden">
                        <div className="absolute top-4 left-4 z-10">
                            <input 
                                value={canvasLogic.templateName} 
                                onChange={e => canvasLogic.setTemplateName(e.target.value)} 
                                className="bg-transparent text-xl font-bold text-white border-b border-transparent hover:border-slate-600 focus:border-indigo-500 outline-none w-64"
                                placeholder="Nome Template"
                            />
                        </div>
                        
                        <SocialCanvas 
                            bgUrl={canvasLogic.editorBg} 
                            layout={canvasLogic.editorLayout} 
                            onLayoutChange={canvasLogic.setEditorLayout}
                        />
                        
                        <p className="text-slate-500 text-xs mt-4 flex items-center gap-2"><Type className="w-4 h-4"/> Trascina i testi per posizionarli</p>
                    </div>
                </div>
            )}

            {/* TAB: PREVIEW SEO */}
            {activeTab === 'preview' && (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <SocialPreviewConfig />
                </div>
            )}

            {/* TAB: VIRAL TEXT */}
            {activeTab === 'viral' && (
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="p-6 bg-emerald-900/10 border-b border-emerald-500/20 text-center shrink-0 mb-4 rounded-xl border">
                        <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-1">Messaggio Condivisione Social</h3>
                        <p className="text-slate-400 text-xs">Modifica il testo precompilato che appare quando gli utenti cliccano "Condividi su WhatsApp/Facebook".</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                        {templateLogic.viralTemplates.length > 0 ? (
                            <CommsTemplates 
                                templates={templateLogic.viralTemplates} 
                                onSave={templateLogic.saveViralTemplate} 
                                onUseTemplate={() => {}} 
                                forcedTarget="all"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
                                <p className="text-sm italic">Nessun template virale attivo.</p>
                                <button onClick={templateLogic.initDefaultViral} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold uppercase text-xs shadow-lg flex items-center gap-2 hover:bg-emerald-500 transition-colors">
                                    <Wand2 className="w-4 h-4"/> Crea Default Virale
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
