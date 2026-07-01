
import React, { useState, useEffect } from 'react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Megaphone, CheckCircle, AlertTriangle } from 'lucide-react';
import { getCommunicationLogsAsync, getSystemMessagesAsync, saveSystemMessageAsync, deleteSystemMessageAsync, AdminMessageLog, SystemMessageTemplate } from '../../services/communicationService';
import { CommsComposer } from './communications/CommsComposer';
import { CommsHistory } from './communications/CommsHistory';
import { CommsTemplates } from './communications/CommsTemplates';
import { AdminPageHeader } from './common/AdminPageHeader';

const AdminToast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
    <div className={`fixed top-6 right-6 z-toast px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 border ${type === 'success' ? 'bg-emerald-600 border-emerald-400' : 'bg-red-600 border-red-400'} text-white`}>
        {type === 'success' ? <CheckCircle className="w-6 h-6 shrink-0"/> : <AlertTriangle className="w-6 h-6 shrink-0"/>}
        <div className="font-bold text-sm">{message}</div>
        <CloseButton onClose={onClose} variant="primary" />

    </div>
);

export const AdminCommunications = () => {
    const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'templates' | 'onboarding_desktop' | 'onboarding_mobile'>('compose');
    const [logs, setLogs] = useState<AdminMessageLog[]>([]);
    const [templates, setTemplates] = useState<SystemMessageTemplate[]>([]);
    const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);
    
    // Draft state for composer
    const [composerDraft, setComposerDraft] = useState<{ subject: string, body: string } | null>(null);

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = async () => {
        const [l, t] = await Promise.all([getCommunicationLogsAsync(), getSystemMessagesAsync()]);
        setLogs(l);
        setTemplates(t);
    };
    
    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };
    
    const handleSaveTemplate = async (tpl: SystemMessageTemplate) => {
        try {
            await saveSystemMessageAsync(tpl);
            showToast("Template aggiornato.", 'success');
            await refreshData();
        } catch (e) {
             showToast("Errore salvataggio template.", 'error');
        }
    };
    
    const handleDeleteTemplate = async (key: string) => {
        const success = await deleteSystemMessageAsync(key);
        if(success) {
            showToast("Messaggio eliminato.", 'success');
            await refreshData();
        } else {
            showToast("Errore eliminazione.", 'error');
        }
    };
    
    const handleUseTemplate = (tpl: SystemMessageTemplate) => {
        setComposerDraft({
            subject: tpl.titleTemplate || tpl.label,
            body: tpl.bodyTemplate
        });
        setActiveTab('compose');
        showToast("Template caricato nell'editor.", 'success');
    };

    const onboardingTemplatesDesktop = templates
        .filter(t => t.type === 'onboarding' && t.deviceTarget === 'desktop')
        .sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));

    const onboardingTemplatesMobile = templates
        .filter(t => t.type === 'onboarding' && t.deviceTarget === 'mobile')
        .sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));

    return (
        <div className="space-y-6 h-full flex flex-col animate-in fade-in relative">
            
            {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <AdminPageHeader
                icon={Megaphone}
                title="Centro Comunicazioni"
                subtitle="Gestisci notifiche, email e avvisi di sistema"
                accent="indigo"
            />

            <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800 w-fit shrink-0 mb-4 shadow-lg overflow-x-auto gap-1">
                <button onClick={() => setActiveTab('compose')} className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'compose' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>Nuovo Messaggio</button>
                <button onClick={() => setActiveTab('history')} className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>STORICO</button>
                <button onClick={() => setActiveTab('templates')} className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'templates' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>Standard</button>
                
                <div className="w-px h-6 bg-slate-700 mx-1 self-center"></div>

                <button onClick={() => setActiveTab('onboarding_desktop')} className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'onboarding_desktop' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>GUIDA DESKTOP</button>
                <button onClick={() => setActiveTab('onboarding_mobile')} className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'onboarding_mobile' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>GUIDA MOBILE</button>
            </div>

            <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-0 relative">
                {activeTab === 'compose' && <CommsComposer onSent={refreshData} showToast={showToast} initialDraft={composerDraft} />}
                {activeTab === 'history' && <CommsHistory logs={logs} />}
                {activeTab === 'templates' && <CommsTemplates templates={templates.filter(t => !t.key.startsWith('onboarding') && t.key !== 'social_share_global')} onSave={handleSaveTemplate} onDelete={handleDeleteTemplate} onUseTemplate={handleUseTemplate} />}

                {activeTab === 'onboarding_desktop' && (
                    <div className="flex flex-col h-full">
                        <div className="p-6 bg-blue-900/10 border-b border-blue-500/20 text-center">
                            <h3 className="text-blue-400 font-bold uppercase tracking-widest text-sm mb-1">Editor Guida Desktop</h3>
                            <p className="text-slate-400 text-xs">Questa lista viene mostrata SOLO su PC/Tablet.</p>
                        </div>
                        <CommsTemplates 
                            templates={onboardingTemplatesDesktop} 
                            onSave={handleSaveTemplate} 
                            onDelete={handleDeleteTemplate}
                            onUseTemplate={() => {}} 
                            forcedTarget="desktop"
                        />
                    </div>
                )}

                {activeTab === 'onboarding_mobile' && (
                    <div className="flex flex-col h-full">
                        <div className="p-6 bg-purple-900/10 border-b border-purple-500/20 text-center">
                            <h3 className="text-purple-400 font-bold uppercase tracking-widest text-sm mb-1">Editor Guida Mobile</h3>
                            <p className="text-slate-400 text-xs">Questa lista viene mostrata SOLO su Smartphone.</p>
                        </div>
                        <CommsTemplates 
                            templates={onboardingTemplatesMobile} 
                            onSave={handleSaveTemplate} 
                            onDelete={handleDeleteTemplate}
                            onUseTemplate={() => {}} 
                            forcedTarget="mobile"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
