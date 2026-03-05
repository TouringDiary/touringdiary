
import React, { useState } from 'react';
import { UserCheck, X, Mail, Key, Plus, Loader2, XCircle, FlaskConical } from 'lucide-react';
import { registerUser, getRoleLabel } from '../../../services/userService';
import { UserRole } from '../../../types/users';

interface Props {
    onClose: () => void;
    onSuccess: (name: string) => void;
    availableRoles: UserRole[];
}

export const CreateUserModal = ({ onClose, onSuccess, availableRoles }: Props) => {
    const [newUserData, setNewUserData] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'user' as UserRole, isTestAccount: false });
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError(null);
        
        if (!newUserData.firstName || !newUserData.lastName || !newUserData.email || !newUserData.password) {
            setCreateError("Tutti i campi sono obbligatori.");
            return;
        }
        if (newUserData.password.length < 6) {
            setCreateError("Password troppo corta (min 6 caratteri).");
            return;
        }

        setIsCreating(true);
        try {
            const result = await registerUser({
                firstName: newUserData.firstName,
                lastName: newUserData.lastName,
                email: newUserData.email,
                password: newUserData.password,
                role: newUserData.role,
                isTestAccount: newUserData.isTestAccount
            });

            if (result.success) {
                onSuccess(newUserData.firstName);
            } else {
                setCreateError(result.error || "Errore durante la creazione.");
            }
        } catch (err: any) {
            setCreateError("Errore imprevisto: " + err.message);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 relative animate-in zoom-in-95">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-emerald-600 rounded-xl shadow-lg"><UserCheck className="w-6 h-6 text-white"/></div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Nuova Utenza</h3>
                        <p className="text-xs text-slate-400">Inserisci i dati per creare un nuovo account.</p>
                    </div>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Nome</label><input type="text" value={newUserData.firstName} onChange={e => setNewUserData({...newUserData, firstName: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-emerald-500 outline-none" required placeholder="Mario"/></div>
                        <div><label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Cognome</label><input type="text" value={newUserData.lastName} onChange={e => setNewUserData({...newUserData, lastName: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-emerald-500 outline-none" required placeholder="Rossi"/></div>
                    </div>
                    
                    <div><label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Email</label><div className="relative"><Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"/><input type="email" value={newUserData.email} onChange={e => setNewUserData({...newUserData, email: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 p-2.5 text-white text-sm focus:border-emerald-500 outline-none" required placeholder="email@esempio.com"/></div></div>
                    
                    <div><label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Password Provvisoria</label><div className="relative"><Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"/><input type="text" value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 p-2.5 text-white text-sm focus:border-emerald-500 outline-none font-mono" required placeholder="Min 6 caratteri"/></div></div>

                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Assegna Ruolo</label>
                            <select value={newUserData.role} onChange={e => setNewUserData({...newUserData, role: e.target.value as UserRole})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-emerald-500 outline-none appearance-none">
                                {availableRoles.map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Ambiente</label>
                            <button 
                                type="button"
                                onClick={() => setNewUserData(p => ({...p, isTestAccount: !p.isTestAccount}))}
                                className={`w-full p-2.5 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition-all ${newUserData.isTestAccount ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                            >
                                <FlaskConical className="w-4 h-4"/>
                                {newUserData.isTestAccount ? 'Collaudo' : 'Produzione'}
                            </button>
                        </div>
                    </div>

                    {createError && <div className="text-red-400 text-xs bg-red-900/20 p-2 rounded border border-red-500/30 flex items-center gap-2"><XCircle className="w-4 h-4"/> {createError}</div>}

                    <div className="pt-2">
                        <button type="submit" disabled={isCreating} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
                            {isCreating ? <Loader2 className="w-5 h-5 animate-spin"/> : <Plus className="w-5 h-5"/>} Crea Account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
