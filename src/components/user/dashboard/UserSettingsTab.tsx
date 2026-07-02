
import React, { useEffect, useState } from 'react';
import { Settings, Key, Bell, Mail, Trash2, Loader2, type LucideIcon } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { UserAvatar } from '@/components/user/profile/UserAvatar';
import {
  ProfileIdentityFields,
} from '@/components/user/profile/ProfileIdentityFields';
import { validateUsernameForSubmit } from '@/services/profileService';
import {
  normalizeUsernameToSlug,
} from '@/domain/profile/username';
import {
  updateProfileAvatarUrl,
  updateProfileSlug,
  uploadProfileAvatar,
} from '@/services/profileService';
import { mapProfileToUser } from '@/services/userService';
import { supabase } from '@/services/supabaseClient';

interface SettingCardProps {
    icon: LucideIcon;
    title: string;
    desc: string;
    badge?: string;
    children: React.ReactNode;
}

interface ToggleProps {
    active: boolean;
    onToggle: () => void;
}

const SettingCard = ({ icon: Icon, title, desc, children, badge }: SettingCardProps) => (
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

const Toggle = ({ active, onToggle }: ToggleProps) => (
    <button onClick={onToggle} className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative ${active ? 'bg-indigo-600' : 'bg-slate-800'}`}>
        <div className={`w-4 h-4 rounded-full bg-white transition-all shadow-md ${active ? 'translate-x-6' : 'translate-x-0'}`}></div>
    </button>
);

export const UserSettingsTab = () => {
    const { user, setUser } = useUser();
    const [settingsConfig, setSettingsConfig] = useState({
        notifEmail: true,
        notifPush: true,
        publicProfile: false,
        shareItinerary: true
    });
    const [editingProfile, setEditingProfile] = useState(false);
    const [username, setUsername] = useState(user.slug ?? '');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar ?? null);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);

    useEffect(() => {
        setUsername(user.slug ?? '');
        setAvatarPreview(user.avatar ?? null);
    }, [user.slug, user.avatar]);

    useEffect(() => {
        if (!avatarFile) return;
        const url = URL.createObjectURL(avatarFile);
        setAvatarPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [avatarFile]);

    const handleSaveProfile = async () => {
        setProfileError(null);
        setProfileSuccess(false);
        setProfileSaving(true);

        try {
            const validationError = await validateUsernameForSubmit(username, user.id);
            if (validationError) {
                setProfileError(validationError);
                return;
            }

            const slug = normalizeUsernameToSlug(username);
            if (slug !== user.slug) {
                const slugResult = await updateProfileSlug(user.id, slug);
                if (!slugResult.success) {
                    setProfileError(slugResult.error ?? 'Errore Nome utente.');
                    return;
                }
            }

            let nextAvatar = user.avatar;
            if (avatarFile) {
                const uploaded = await uploadProfileAvatar(user.id, avatarFile);
                if (!uploaded) {
                    setProfileError('Caricamento foto non riuscito.');
                    return;
                }
                const avatarResult = await updateProfileAvatarUrl(user.id, uploaded);
                if (!avatarResult.success) {
                    setProfileError(avatarResult.error ?? 'Errore foto profilo.');
                    return;
                }
                nextAvatar = uploaded;
            }

            const { data: profile, error: profileFetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileFetchError) {
                console.error('[UserSettingsTab] profile reload failed:', profileFetchError.message);
            }

            if (profile) {
                setUser(mapProfileToUser(profile));
            } else {
                setUser({ ...user, slug, avatar: nextAvatar });
            }

            setAvatarFile(null);
            setEditingProfile(false);
            setProfileSuccess(true);
        } finally {
            setProfileSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 pb-12">
            <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-3"><Settings className="w-6 h-6 text-indigo-500"/> Configurazione Account</h3>
                <p className="text-slate-500 text-sm">Gestisci i tuoi dati e le preferenze dell&apos;applicazione.</p>
            </div>
            <div className="space-y-4">
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Profilo & Sicurezza</h5>

                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg space-y-4">
                    <div className="flex items-center gap-4">
                        <UserAvatar name={user.name} avatarUrl={avatarPreview ?? user.avatar} size="lg" />
                        <div>
                            <p className="text-white font-bold">{user.name}</p>
                            {user.slug ? (
                                <p className="text-sm text-slate-400">@{user.slug}</p>
                            ) : (
                                <p className="text-sm text-amber-400">Nome utente da impostare</p>
                            )}
                        </div>
                    </div>

                    {editingProfile ? (
                        <div className="space-y-4 pt-2 border-t border-slate-800">
                            <ProfileIdentityFields
                                displayName={user.name}
                                username={username}
                                onUsernameChange={setUsername}
                                avatarPreviewUrl={avatarPreview}
                                onAvatarFileChange={setAvatarFile}
                                excludeUserId={user.id}
                            />
                            {profileError && (
                                <p className="text-xs text-red-400">{profileError}</p>
                            )}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => void handleSaveProfile()}
                                    disabled={profileSaving}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 disabled:opacity-60"
                                >
                                    {profileSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                                    Salva
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingProfile(false);
                                        setUsername(user.slug ?? '');
                                        setAvatarFile(null);
                                        setAvatarPreview(user.avatar ?? null);
                                        setProfileError(null);
                                    }}
                                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase"
                                >
                                    Annulla
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setEditingProfile(true)}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all"
                        >
                            Modifica Nome utente e foto
                        </button>
                    )}

                    {profileSuccess && !editingProfile && (
                        <p className="text-xs text-emerald-400">Profilo aggiornato.</p>
                    )}
                </div>

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
