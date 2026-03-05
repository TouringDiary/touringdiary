
import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Loader2, Trash2, CheckCircle, Zap } from 'lucide-react';
import { updateUser, deleteUser, getRoleLabel, refreshUsersCache } from '../../services/userService';
import { User, UserRole, UserStatus } from '../../types/users';
import { getSetting, SETTINGS_KEYS } from '../../services/settingsService';
import { MarketingConfig } from '../../types/models/Sponsor';

// Sub-Components
import { RlsFixModal } from './userManager/RlsFixModal';
import { CreateUserModal } from './userManager/CreateUserModal';
import { EditUserModal } from './userManager/EditUserModal';
import { UserToolbar } from './userManager/UserToolbar';
import { UserTable } from './userManager/UserTable';

interface AdminUserManagerProps {
    currentUser: User;
}

type SortKey = keyof User;

export const AdminUserManager = ({ currentUser }: AdminUserManagerProps) => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    
    // Tab logic removed - Handled by Dashboard
    
    const [envFilter, setEnvFilter] = useState<'all' | 'prod' | 'test'>('all');
    const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Limits Config State (for Table visualization)
    const [limitsConfig, setLimitsConfig] = useState<MarketingConfig['aiLimits'] | null>(null);

    // Sorting State
    const [sortKey, setSortKey] = useState<SortKey>('registrationDate');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    // MODAL STATES
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showFixModal, setShowFixModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Initial Load
    useEffect(() => {
        handleRefreshList();
        
        // Fetch limits for table visualization
        getSetting<MarketingConfig>(SETTINGS_KEYS.MARKETING_PRICES).then(config => {
            if(config && config.aiLimits) {
                setLimitsConfig(config.aiLimits);
            }
        });
    }, []);

    const handleRefreshList = async () => {
        setIsLoading(true);
        try {
            const freshUsers = await refreshUsersCache();
            setUsers(freshUsers);
        } catch (e) {
            console.error("Errore sync utenti", e);
        } finally {
            setIsLoading(false);
        }
    };

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Security Check
    const canManageUser = (targetUser: User): boolean => {
        if (targetUser.id === 'u_admin_all' && currentUser.role !== 'admin_all') return false; 
        if (currentUser.role === 'admin_limited' && targetUser.role === 'admin_all') return false;
        return true;
    };

    const getCreatableRoles = (): UserRole[] => {
        if (currentUser.role === 'admin_all') return ['user', 'business', 'admin_limited', 'admin_all'];
        if (currentUser.role === 'admin_limited') return ['user', 'business', 'admin_limited'];
        return [];
    };

    // --- ACTIONS ---

    const handleCreateSuccess = async (name: string) => {
        await handleRefreshList();
        showToast(`Nuovo utente ${name} creato con successo!`, 'success');
        setShowCreateModal(false);
    };

    const handleEditSuccess = async (name: string) => {
        await handleRefreshList();
        showToast(`Utente ${name} aggiornato correttamente.`, 'success');
        setEditingUser(null);
    };

    const handleStatusToggle = async (user: User) => {
        if (!canManageUser(user)) { alert("Non hai i permessi per sospendere questo utente."); return; }
        
        const newStatus: UserStatus = user.status === 'active' ? 'suspended' : 'active';
        setIsLoading(true);
        await updateUser({ ...user, status: newStatus });
        await handleRefreshList();
        showToast(`Utente ${user.name} ${newStatus === 'active' ? 'riattivato' : 'sospeso'}`, 'success');
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteUser(deleteTarget.id);
            await new Promise(r => setTimeout(r, 500));
            await handleRefreshList();
            showToast("Utente eliminato definitivamente.", 'success');
            setDeleteTarget(null);
        } catch (e: any) {
            console.error("Errore cancellazione:", e);
            showToast(e.message || "Impossibile eliminare l'utente.", 'error');
            if (e.message.includes("RLS")) setShowFixModal(true);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteRequest = (user: User) => {
        if (!canManageUser(user)) { alert("Non hai i permessi."); return; }
        setDeleteTarget({ id: user.id, name: user.name });
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    // Filter & Sort Logic
    const filteredAndSortedUsers = useMemo(() => {
        let result = users.filter(u => {
            const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === 'all' || u.role === roleFilter;
            
            let matchesEnv = true;
            if (envFilter === 'prod') matchesEnv = u.isTestAccount === false;
            else if (envFilter === 'test') matchesEnv = u.isTestAccount === true;

            return matchesSearch && matchesRole && matchesEnv;
        });

        return result.sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];
            if (valA === valB) return 0;
            if (sortKey === 'registrationDate' || sortKey === 'lastAccess') {
                const dateA = new Date(valA as string).getTime();
                const dateB = new Date(valB as string).getTime();
                return sortDir === 'asc' ? dateA - dateB : dateB - dateA;
            }
            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return 0;
        });
    }, [users, searchTerm, roleFilter, envFilter, sortKey, sortDir]);

    const exportToCSV = () => {
        if (filteredAndSortedUsers.length === 0) { alert("Nessun dato."); return; }
        const headers = ["ID", "Nome", "Email", "Ruolo", "Tipo", "Stato", "Nazione", "Città", "Azienda", "P.IVA", "Data Registrazione"];
        const rows = filteredAndSortedUsers.map(u => [
            u.id, 
            `"${u.name}"`, 
            u.email, 
            getRoleLabel(u.role),
            u.isTestAccount ? "COLLAUDO" : "PRODUZIONE",
            u.status, 
            u.nation, 
            u.city, 
            u.companyName ? `"${u.companyName}"` : "", 
            u.vatNumber || "", 
            new Date(u.registrationDate).toLocaleDateString()
        ]);
        const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `utenti_touring_diary_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="h-full flex flex-col relative">
            
            {/* TOAST MESSAGE */}
            {toast && (
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-50 animate-in slide-in-from-top-5 text-sm font-bold flex items-center gap-2 border ${toast.type === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-red-600 border-red-400 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle className="w-5 h-5"/> : <AlertTriangle className="w-5 h-5"/>} {toast.msg}
                </div>
            )}

            {/* DELETE MODAL */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-red-500/50 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative animate-in zoom-in-95">
                        <div className="flex flex-col items-center text-center gap-4">
                             <AlertTriangle className="w-16 h-16 text-red-500 animate-pulse"/>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2 font-display">Eliminare Utente?</h3>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    Stai per cancellare definitivamente <strong className="text-white">"{deleteTarget.name}"</strong>.<br/>
                                    Tutti i suoi dati saranno persi.
                                </p>
                            </div>
                            <div className="flex gap-3 w-full mt-2">
                                <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors">Annulla</button>
                                <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2">{isDeleting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>} Elimina</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* RLS FIX MODAL */}
            {showFixModal && <RlsFixModal onClose={() => setShowFixModal(false)} />}

            {/* CREATE USER MODAL */}
            {showCreateModal && (
                <CreateUserModal 
                    onClose={() => setShowCreateModal(false)} 
                    onSuccess={handleCreateSuccess} 
                    availableRoles={getCreatableRoles()}
                />
            )}

            {/* EDIT USER MODAL */}
            {editingUser && (
                <EditUserModal 
                    user={editingUser} 
                    onClose={() => setEditingUser(null)} 
                    onSuccess={handleEditSuccess} 
                    onShowFixModal={() => setShowFixModal(true)}
                    availableRoles={getCreatableRoles()}
                />
            )}

            {/* TOOLBAR */}
            <UserToolbar 
                filteredCount={filteredAndSortedUsers.length}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                roleFilter={roleFilter}
                onRoleFilterChange={setRoleFilter}
                envFilter={envFilter}
                onEnvFilterChange={setEnvFilter}
                onExport={exportToCSV}
                onCreate={() => setShowCreateModal(true)}
                onRefresh={handleRefreshList}
                isLoading={isLoading}
            />

            {/* TABLE */}
            <div className="mt-4 flex-1 min-h-0 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col">
                <UserTable 
                    users={filteredAndSortedUsers}
                    isLoading={isLoading}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                    currentUserId={currentUser.id}
                    onEdit={setEditingUser}
                    onStatusToggle={handleStatusToggle}
                    onDelete={handleDeleteRequest}
                    canManage={canManageUser}
                    limitsConfig={limitsConfig} 
                />
            </div>
        </div>
    );
};
