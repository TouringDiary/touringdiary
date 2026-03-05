
import React, { useState } from 'react';
import { Settings, User, Key, Bell, Mail, Trash2 } from 'lucide-react';

export const UserSettingsTab = () => {
    const [settingsConfig, setSettingsConfig] = useState({
        notifEmail: true,
        notifPush: true,
        publicProfile: false,
        shareItinerary: true
    });

    const SettingCard = ({ icon: Icon, title, desc, children, badge }: any) => (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-slate-700">
            <div className="flex gap-4 items-start">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-indigo-400">
                    <Icon className="w-5 h-5"/>
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-white">{title}</h4>
                        {badge && <span className="px-2 py-0.5 bg-indigo-900/30 text-indigo-400 text-[9px] font-black uppercase rounded border border-indigo-500/20">{badge}</span>}
                    </div>
                    <p className="text-sm text-slate-500">{desc}</p>
                </div>
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );

    const Toggle = ({ active, onToggle }: { active: boolean, onToggle: () => void }) => (
        <button onClick={onToggle} className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative ${active ? 'bg-indigo-600' : 'bg-slate-800'}`}>
            <div className={`w-4 h-4 rounded-full bg-white transition-all shadow-md ${active ? 'translate-x-6' : 'translate-x-0'}`}></div>
        </button>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 pb-12">
            <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-3"><Settings className="w-6 h-6 text-indigo-500"/> Configurazione Account</h3>
                <p className="text-slate-500 text-sm">Gestisci i tuoi dati e le preferenze dell'applicazione.</p>
            </div>
            <div className="space-y-4">
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Profilo & Sicurezza</h5>
                <SettingCard icon={User} title="Dati Personali" desc="Modifica il tuo nome pubblico e l'avatar.">
                    <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all">Modifica</button>
                </SettingCard>
                <SettingCard icon={Key} title="Sicurezza" desc="Aggiorna la tua password di accesso.">
                    <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all">Cambia Password</button>
                </SettingCard>
            </div>
            <div className="space-y-4">
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Notifiche</h5>
                <SettingCard icon={Bell} title="Notifiche App" desc="Ricevi avvisi su risposte Q&A e promozioni.">
                    <Toggle active={settingsConfig.notifPush} onToggle={() => setSettingsConfig({...settingsConfig, notifPush: !settingsConfig.notifPush})} />
                </SettingCard>
                <SettingCard icon={Mail} title="Newsletter" desc="Ricevi approfondimenti culturali e novità via email.">
                    <Toggle active={settingsConfig.notifEmail} onToggle={() => setSettingsConfig({...settingsConfig, notifEmail: !settingsConfig.notifEmail})} />
                </SettingCard>
            </div>
            <div className="pt-8 border-t border-slate-800 flex justify-center">
                <button className="flex items-center gap-2 text-red-500 hover:text-red-400 font-bold uppercase text-xs tracking-widest">
                    <Trash2 className="w-4 h-4"/> Elimina Account Definitivamente
                </button>
            </div>
        </div>
    );
};
