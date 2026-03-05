
import React, { useState } from 'react';
import { Edit3, X, Briefcase, AlertTriangle, Terminal, Loader2, Save, FlaskConical, RotateCcw, Users } from 'lucide-react';
import { updateUser, getRoleLabel, resetUserReferralStatus } from '../../../services/userService';
import { User, UserRole, UserStatus } from '../../../types/users';
import { DeleteConfirmationModal } from '../../common/DeleteConfirmationModal';

interface Props {
    user: User;
    onClose: () => void;
    onSuccess: (name: string) => void;
    onShowFixModal: () => void;
    availableRoles: UserRole[];
}

export const EditUserModal = ({ user: initialUser, onClose, onSuccess, onShowFixModal, availableRoles }: Props) => {
    const [editingUser, setEditingUser] = useState<User>(initialUser);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [isResettingRef, setIsResettingRef] = useState(false);
    const [showConfirmReset, setShowConfirmReset] = useState(false);

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditError(null);
        
        setIsSavingEdit(true);
        try {
            await updateUser(editingUser);
            onSuccess(editingUser.name);
        } catch (error: any) {
            console.error(error);
            const msg = error.message || "Errore durante il salvataggio.";
            setEditError(msg);
        } finally {
            setIsSavingEdit(false);
        }
    };
    
    const handleResetReferral = () => {
        setShowConfirmReset(true);
    };

    const executeResetReferral = async () => {
        setShowConfirmReset(false);
        setIsResettingRef(true);
        try {
            await resetUserReferralStatus(editingUser.id);
            setEditingUser(prev => ({ ...prev, referredBy: null }));
            alert("Referral resettato. L'utente può riscattare un nuovo codice.");
        } catch(e) {
            alert("Errore reset referral.");
        } finally {
            setIsResettingRef(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
            <DeleteConfirmationModal 
                isOpen={showConfirmReset}
                onClose={() => setShowConfirmReset(false)}
                onConfirm={executeResetReferral}
                title="Sgancia Referral"
                message="Sei sicuro di voler sganciare questo utente dal suo referrer? Potrà inserire un nuovo codice amico."
                confirmLabel="Sgancia"
                variant="danger"
            />
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-indigo-500/50 shadow-2xl p-6 relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-600 rounded-xl shadow-lg"><Edit3 className="w-6 h-6 text-white"/></div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Modifica Utente</h3>
                        <p className="text-xs text-slate-400">Aggiorna i dettagli anagrafici.</p>
                    </div>
                </div>

                <form onSubmit={handleUpdateUser} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Nome Completo</label>
                        <input value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-bold focus:border-indigo-500 outline-none"/>
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Email (Login)</label>
                        <input value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm focus:border-indigo-500 outline-none"/>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Ruolo</label>
                            <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none">
                                {availableRoles.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Status</label>
                            <select value={editingUser.status} onChange={e => setEditingUser({...editingUser, status: e.target.value as UserStatus})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none">
                                <option value="active">Attivo</option>
                                <option value="suspended">Sospeso</option>
                            </select>
                        </div>
                    </div>
                    
                    {/* NEW: ENVIRONMENT TOGGLE */}
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <FlaskConical className="w-4 h-4 text-amber-500"/>
                             <div>
                                 <span className="text-xs font-bold text-slate-300 block">Account di Collaudo</span>
                                 <span className="text-[10px] text-slate-500">Visibile nel login rapido sviluppatori</span>
                             </div>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={editingUser.isTestAccount} 
                                onChange={e => setEditingUser({...editingUser, isTestAccount: e.target.checked})} 
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                    </div>

                    {/* REFERRAL MANAGEMENT */}
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-emerald-500"/>
                            <span className="text-xs font-bold text-slate-300">Stato Referral</span>
                        </div>
                        {editingUser.referredBy ? (
                             <div className="flex items-center justify-between">
                                 <span className="text-[10px] text-emerald-400 font-mono bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-500/30">
                                     Ha usato un codice
                                 </span>
                                 <button 
                                    type="button"
                                    onClick={handleResetReferral}
                                    disabled={isResettingRef}
                                    className="text-[10px] bg-red-900/20 text-red-400 hover:text-white px-3 py-1.5 rounded border border-red-500/30 hover:bg-red-600 transition-colors flex items-center gap-1"
                                >
                                    {isResettingRef ? <Loader2 className="w-3 h-3 animate-spin"/> : <RotateCcw className="w-3 h-3"/>}
                                    Resetta (Sgancia)
                                </button>
                             </div>
                        ) : (
                            <span className="text-[10px] text-slate-500 italic">Nessun codice riscattato. Utente "pulito".</span>
                        )}
                    </div>

                    {/* BUSINESS FIELDS */}
                    <div className="pt-2 border-t border-slate-800 mt-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Briefcase className="w-3.5 h-3.5"/> Dati Business (Opzionali)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Ragione Sociale</label><input value={editingUser.companyName || ''} onChange={e => setEditingUser({...editingUser, companyName: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-indigo-500 outline-none"/></div>
                            <div><label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">P.IVA</label><input value={editingUser.vatNumber || ''} onChange={e => setEditingUser({...editingUser, vatNumber: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-indigo-500 outline-none font-mono"/></div>
                        </div>
                    </div>
                    
                    {editError && (
                        <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg flex flex-col gap-2 text-xs text-red-200">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0"/>
                                <span>{editError}</span>
                            </div>
                            {(editError.includes("RLS Policy") || editError.includes("Permessi insufficienti")) && (
                                <button 
                                    type="button"
                                    onClick={onShowFixModal}
                                    className="mt-1 w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded flex items-center justify-center gap-2 uppercase tracking-wide shadow-lg"
                                >
                                    <Terminal className="w-4 h-4"/> 🛠️ FIX PERMESSI DB
                                </button>
                            )}
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors">Annulla</button>
                        <button type="submit" disabled={isSavingEdit} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
                            {isSavingEdit ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>} Salva Modifiche
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
