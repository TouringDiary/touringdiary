
import React, { useState } from 'react';
import { ShieldCheck, CheckSquare, Square, Info, CheckCircle } from 'lucide-react';
import { getRolePermissions, updateRolePermission, getRoleLabel, getPermissionsDescription } from '../../services/userService';
import { UserRole, PermissionCode, User } from '../../types/users';

const ALL_PERMISSIONS: PermissionCode[] = [
    'ADM-USR-FULL', 'ADM-CNT-FULL', 'ADM-SET-FULL', 'ADM-LYT-EDIT', 
    'ADM-CNT-MOD', 'ADM-STS-VIEW', 'ADM-USR-VIEW', 
    'ITN-PLAN-SELF', 'CNT-SGT-EDIT', 'CMT-VOT',
    'BIZ-REG-SELF', 'BIZ-REQ-FEAT', 'BIZ-STS-VIEW'
];

const ROLES: UserRole[] = ['admin_all', 'admin_limited', 'business', 'user'];

interface AdminRoleManagerProps {
    currentUser?: User;
}

export const AdminRoleManager = ({ currentUser }: AdminRoleManagerProps) => {
    const [permissionsMatrix, setPermissionsMatrix] = useState<Record<UserRole, PermissionCode[]>>(getRolePermissions());
    const [lastAction, setLastAction] = useState<{msg: string, type: 'info'|'success'} | null>(null);

    const togglePermission = (role: UserRole, code: PermissionCode) => {
        const current = permissionsMatrix[role] || [];
        const isEnabled = current.includes(code);
        
        // Update Local State for UI
        const newPerms = isEnabled 
            ? current.filter(c => c !== code) 
            : [...current, code];
            
        setPermissionsMatrix(prev => ({ ...prev, [role]: newPerms }));
        
        // Update Service Logic Immediately
        updateRolePermission(role, code, !isEnabled);
        
        // Show Feedback
        setLastAction({
            msg: `Permesso ${code} ${!isEnabled ? 'concesso' : 'revocato'} a ${getRoleLabel(role)} - SALVATO`, 
            type: 'success'
        });
        
        setTimeout(() => setLastAction(null), 3000);
    };

    const isAmSuperAdmin = currentUser?.role === 'admin_all';

    return (
        <div className="space-y-6 animate-in fade-in flex flex-col h-full relative">
            
            {/* GLOBAL TOAST */}
            {lastAction && (
                <div className="absolute top-0 right-0 z-50 animate-in slide-in-from-top-2 fade-in">
                    <div className="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-xl font-bold text-sm flex items-center gap-2 border border-emerald-400">
                        <CheckCircle className="w-4 h-4"/> {lastAction.msg}
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shrink-0 shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-fuchsia-600 rounded-lg shadow-lg">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white font-display">Matrice Permessi (ACL)</h2>
                        <p className="text-sm text-slate-400">Le modifiche ai permessi sono <strong>salvate automaticamente</strong>.</p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col flex-1 min-h-0">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider font-bold sticky top-0 z-10 backdrop-blur-sm border-b border-slate-800">
                                <th className="px-4 py-3 w-56">Permesso</th>
                                {ROLES.map(role => (
                                    <th key={role} className="px-2 py-3 text-center w-24">{getRoleLabel(role)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {ALL_PERMISSIONS.map(code => (
                                <tr key={code} className="hover:bg-slate-800/40 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-slate-200 text-xs font-mono mb-0.5">{code}</div>
                                        <div className="text-[10px] text-slate-500 leading-tight truncate max-w-[300px]" title={getPermissionsDescription(code)}>{getPermissionsDescription(code)}</div>
                                    </td>
                                    {ROLES.map(role => {
                                        const hasPerm = permissionsMatrix[role]?.includes(code);
                                        
                                        // SAFETY CHECKS:
                                        
                                        // 1. Protezione Master: Nessuno può togliere i diritti completi a 'admin_all' per errore.
                                        const isTargetAdminAll = role === 'admin_all';
                                        const isSelfLockoutProtection = isTargetAdminAll && code === 'ADM-USR-FULL';
                                        
                                        // 2. Protezione Gerarchica: Se non sono Super Admin, non posso toccare la colonna 'admin_all'.
                                        const isSuperAdminProtected = isTargetAdminAll && !isAmSuperAdmin;

                                        // 3. Protezione Moderatore: Se non sono Super Admin, non posso toccare la colonna 'admin_limited' (evita auto-promozione).
                                        const isModeratorProtected = role === 'admin_limited' && !isAmSuperAdmin;
                                        
                                        const isLocked = isSelfLockoutProtection || isSuperAdminProtected || isModeratorProtected;

                                        return (
                                            <td key={`${role}-${code}`} className="px-2 py-3 text-center">
                                                <button 
                                                    onClick={() => !isLocked && togglePermission(role, code)}
                                                    disabled={isLocked}
                                                    className={`p-1.5 rounded transition-all transform hover:scale-110 active:scale-95 ${isLocked ? 'opacity-30 cursor-not-allowed grayscale' : 'hover:bg-slate-700'}`}
                                                    title={isLocked ? "Modifica bloccata per sicurezza" : "Clicca per attivare/disattivare"}
                                                >
                                                    {hasPerm ? (
                                                        <CheckSquare className={`w-5 h-5 ${role === 'admin_all' ? 'text-purple-500' : 'text-emerald-500'}`} />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-slate-700" />
                                                    )}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
