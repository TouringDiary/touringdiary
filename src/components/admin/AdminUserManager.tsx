import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Loader2, Trash2, CheckCircle } from 'lucide-react';
import { updateUser, deleteUser, getRoleLabel, refreshUsersCache, getAllUsers } from '../../services/userService';
import { User, UserRole, UserStatus } from '../../types/users';
import { getSetting, SETTINGS_KEYS } from '../../services/settingsService';
import { MarketingConfig } from '../../types/models/Sponsor';

// Sub-Components
import { RlsFixModal } from './userManager/RlsFixModal';
import { CreateUserModal } from './userManager/CreateUserModal';
import { EditUserModal } from './userManager/EditUserModal';
import { DeleteUserModal } from './userManager/DeleteUserModal';
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
    const [envFilter, setEnvFilter] = useState<'all' | 'prod' | 'test'>('all');

    const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [limitsConfig, setLimitsConfig] = useState<MarketingConfig['aiLimits'] | null>(null);

    const [sortKey, setSortKey] = useState<SortKey>('registrationDate');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showFixModal, setShowFixModal] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const loadUsers = async () => {
            setIsLoading(true);
            try {
                await refreshUsersCache();
                const freshUsers = getAllUsers();
                if (Array.isArray(freshUsers)) {
                    setUsers(freshUsers);
                } else {
                    setUsers([]);
                }
            } catch (e) {
                console.error("Errore caricamento utenti", e);
                setUsers([]);
            }
            setIsLoading(false);
        };

        loadUsers();

        getSetting<MarketingConfig>(SETTINGS_KEYS.MARKETING_PRICES_V2)
            .then(config => {
                if (config && config.aiLimits) {
                    setLimitsConfig(config.aiLimits);
                }
            });

    }, []);

    const handleRefreshList = async () => {
        setIsLoading(true);
        try {
            await refreshUsersCache();
            const freshUsers = getAllUsers();
            setUsers(freshUsers || []);
        } catch (e) {
            console.error("Errore sync utenti", e);
        }
        setIsLoading(false);
    };

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

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

        if (!canManageUser(user)) {
            alert("Non hai i permessi per sospendere questo utente.");
            return;
        }

        const newStatus: UserStatus = user.status === 'active' ? 'suspended' : 'active';

        setIsLoading(true);

        await updateUser({ ...user, status: newStatus });

        await handleRefreshList();

        showToast(
            `Utente ${user.name} ${newStatus === 'active' ? 'riattivato' : 'sospeso'}`,'success'
        );
    };

    const confirmDelete = async () => {

        if (!deleteTarget) return;

        setIsDeleting(true);

        try {

            await deleteUser(deleteTarget.id);

            await handleRefreshList();

            showToast("Utente eliminato definitivamente.", 'success');

            setDeleteTarget(null);

        } catch (e: any) {

            console.error("Errore cancellazione:", e);

            showToast(e.message || "Impossibile eliminare l'utente.", 'error');

            if (e.message.includes("RLS")) {
                setShowFixModal(true);
            }

        } finally {

            setIsDeleting(false);

        }
    };

    const handleDeleteRequest = (user: User) => {

        if (!canManageUser(user)) {
            alert("Non hai i permessi.");
            return;
        }

        setDeleteTarget({
            id: user.id,
            name: user.name
        });
    };

    const handleSort = (key: SortKey) => {

        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const filteredAndSortedUsers = useMemo(() => {

        let result = users.filter(u => {

            const matchesSearch =
                (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesRole =
                roleFilter === 'all' || u.role === roleFilter;

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

                return sortDir === 'asc'
                    ? dateA - dateB
                    : dateB - dateA;
            }

            if (typeof valA === 'string' && typeof valB === 'string') {

                return sortDir === 'asc'
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }

            return 0;
        });

    }, [users, searchTerm, roleFilter, envFilter, sortKey, sortDir]);

    return (
        <div className="h-full flex flex-col relative">

            {toast && (
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-50 text-sm font-bold flex items-center gap-2 border ${toast.type === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-red-600 border-red-400 text-white'}`}>
                    {toast.type === 'success'
                        ? <CheckCircle className="w-5 h-5"/>
                        : <AlertTriangle className="w-5 h-5"/>}
                    {toast.msg}
                </div>
            )}

            {showFixModal && (
                <RlsFixModal onClose={() => setShowFixModal(false)} />
            )}

            {showCreateModal && (
                <CreateUserModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleCreateSuccess}
                    availableRoles={getCreatableRoles()}
                />
            )}

            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSuccess={handleEditSuccess}
                    onShowFixModal={() => setShowFixModal(true)}
                    availableRoles={getCreatableRoles()}
                />
            )}

            {deleteTarget && (
                <DeleteUserModal
                    userName={deleteTarget.name}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={confirmDelete}
                    isDeleting={isDeleting}
                />
            )}

            <UserToolbar
                filteredCount={filteredAndSortedUsers.length}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                roleFilter={roleFilter}
                onRoleFilterChange={setRoleFilter}
                envFilter={envFilter}
                onEnvFilterChange={setEnvFilter}
                onCreate={() => setShowCreateModal(true)}
                onRefresh={handleRefreshList}
                isLoading={isLoading}
            />

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
