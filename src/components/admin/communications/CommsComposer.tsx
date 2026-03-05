
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bell, Mail, AlertTriangle, Loader2, Sparkles, Smartphone, Monitor, User, Info, X, MapPin, Smile, Image as ImageIcon, Megaphone, Search } from 'lucide-react';
import { logCommunicationAsync } from '../../../services/communicationService';
import { addNotification } from '../../../services/notificationService';
import { AiChatAssistant } from './AiChatAssistant';
import { uploadPublicMedia } from '../../../services/mediaService';
import { dataURLtoFile, compressImage } from '../../../utils/common';
// FIX: Rimossa getUsers (deprecata), usiamo refreshUsersCache
import { refreshUsersCache } from '../../../services/userService';
import { User as UserType } from '../../../types/users';

interface CommsComposerProps {
    onSent: () => void;
    showToast: (msg: string, type: 'success' | 'error') => void;
    initialDraft?: { subject: string, body: string } | null;
}

const TARGET_OPTIONS = [
    { value: 'all_users', label: 'Tutti gli utenti' },
    { value: 'single_user', label: 'Utente Singolo' },
    { value: 'sponsors', label: 'Solo Sponsor' },
    { value: 'shops', label: 'Solo Negozi' },
    { value: 'guides', label: 'Solo Guide Turistiche' },
    { value: 'tour_operators', label: 'Solo Tour Operator' },
    { value: 'users', label: 'Solo Utenti' },
    { value: 'inactive_30', label: 'Inattivi da 30 gg' },
];

const EMOJIS = ['😀', '😍', '✈️', '🌍', '🍕', '📸', '🌊', '☀️', '🏛️', '🍝', '🍷', '🎉', '🔥', '❤️', '😎', '⚠️', '📣', '🎁'];

type MsgType = 'info' | 'alert' | 'promo' | 'news';

const MSG_TYPE_CONFIG: Record<MsgType, { label: string, color: string, icon: any, border: string }> = {
    info: { label: 'Info', color: 'bg-blue-500', icon: Info, border: 'border-blue-500' },
    alert: { label: 'Alert', color: 'bg-red-500', icon: AlertTriangle, border: 'border-red-500' },
    promo: { label: 'Promo', color: 'bg-purple-500', icon: Sparkles, border: 'border-purple-500' },
    news: { label: 'News', color: 'bg-emerald-500', icon: Megaphone, border: 'border-emerald-500' }
};

export const CommsComposer = ({ onSent, showToast, initialDraft }: CommsComposerProps) => {
    const [subject, setSubject] = useState(initialDraft?.subject || '');
    const [body, setBody] = useState(initialDraft?.body || '');
    const [target, setTarget] = useState('all_users');
    const [channel, setChannel] = useState<'notification' | 'email' | 'system_alert'>('notification');
    const [msgType, setMsgType] = useState<MsgType>('info');
    
    // User Selection States (Async Loaded)
    const [usersList, setUsersList] = useState<UserType[]>([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    // UI States
    const [isSending, setIsSending] = useState(false);
    const [showAiChat, setShowAiChat] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    // Logo Upload
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // FIX RADICALE: Caricamento asincrono utenti solo quando serve
    useEffect(() => {
        if (target === 'single_user') {
            const loadUsers = async () => {
                setIsLoadingUsers(true);
                try {
                    const freshUsers = await refreshUsersCache();
                    setUsersList(freshUsers);
                } catch (e) {
                    showToast("Errore caricamento lista utenti", 'error');
                } finally {
                    setIsLoadingUsers(false);
                }
            };
            loadUsers();
        }
    }, [target]);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingLogo(true);
        try {
            const compressedBase64 = await compressImage(file);
            const compressedFile = dataURLtoFile(compressedBase64, file.name);
            const url = await uploadPublicMedia(compressedFile, 'comms_assets');
            if (url) setLogoUrl(url);
        } catch (err) {
            showToast("Errore caricamento logo", 'error');
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const addEmoji = (emoji: string) => {
        setBody(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const handleSend = async () => {
        if (!subject.trim() || !body.trim()) {
            showToast("Oggetto e Messaggio sono obbligatori.", 'error');
            return;
        }
        
        if (target === 'single_user' && !selectedUserId) {
             showToast("Seleziona un utente destinatario.", 'error');
             return;
        }
        
        setIsSending(true);
        try {
            // 1. LOG COMUNICAZIONE (Audit)
            await logCommunicationAsync({
                sender: 'Admin',
                targetGroup: target === 'single_user' ? `USER:${selectedUserId}` : target,
                subject: `[${msgType.toUpperCase()}] ${subject}`,
                body: body + (logoUrl ? `\n[LOGO: ${logoUrl}]` : ''),
                status: 'sent',
                type: channel
            });

            // 2. INVIO EFFETTIVO NOTIFICA (DB)
            if (target === 'single_user') {
                await addNotification(
                    selectedUserId,
                    channel === 'system_alert' ? 'system_alert' : 'info',
                    subject,
                    body,
                    { section: 'community' } // Default link to community/profile
                );
            } else {
                // Logica massiva mockata per sicurezza in questa fase
                console.log("Mass notification simulated");
            }
            
            setSubject('');
            setBody('');
            setLogoUrl(null);
            showToast("Messaggio inviato con successo!", 'success');
            onSent();
        } catch (e) {
            showToast("Errore durante l'invio.", 'error');
        } finally {
            setIsSending(false);
        }
    };
    
    // Filter users for search
    const filteredUsers = usersList.filter(u => 
        u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    ).slice(0, 10);

    return (
        <div className="flex h-full relative overflow-hidden">
            
            {/* AI CHAT SIDEBAR (OVERLAY) */}
            {showAiChat && (
                <AiChatAssistant 
                    currentContext={{ subject, body, target }}
                    onApply={(s, b) => { setSubject(s); setBody(b); }}
                    onClose={() => setShowAiChat(false)}
                />
            )}

            <div className="flex-1 flex flex-col xl:flex-row h-full gap-6 p-6 overflow-y-auto custom-scrollbar pb-24">
                
                {/* LEFT COLUMN: EDITOR */}
                <div className="flex-1 flex flex-col gap-6 min-w-0">
                    
                    {/* 1. CONFIGURAZIONE */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Configurazione Invio</h3>
                            <button 
                                onClick={() => setShowAiChat(!showAiChat)}
                                className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${showAiChat ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-indigo-400 border-indigo-500/30 hover:bg-indigo-900/20'}`}
                            >
                                <Sparkles className="w-3.5 h-3.5"/> {showAiChat ? 'Chiudi AI' : 'Apri AI Co-Pilot'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Canale</label>
                                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                                    {[
                                        { id: 'notification', label: 'Push App', icon: Bell },
                                        { id: 'email', label: 'Email', icon: Mail },
                                        { id: 'system_alert', label: 'Alert', icon: AlertTriangle }
                                    ].map((opt) => (
                                        <button 
                                            key={opt.id}
                                            onClick={() => setChannel(opt.id as any)} 
                                            className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all flex flex-col items-center gap-1 ${channel === opt.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                                        >
                                            <opt.icon className="w-4 h-4"/> {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Destinatari</label>
                                <select 
                                    value={target} 
                                    onChange={e => setTarget(e.target.value)} 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 outline-none h-[54px] font-medium appearance-none cursor-pointer hover:border-slate-600 transition-colors"
                                >
                                    {TARGET_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* SINGLE USER SELECTION */}
                        {target === 'single_user' && (
                            <div className="mt-4 pt-4 border-t border-slate-800 animate-in slide-in-from-top-2">
                                <label className="text-[10px] font-bold text-indigo-400 uppercase block mb-2">
                                    Seleziona Utente Specifico {isLoadingUsers && <Loader2 className="inline w-3 h-3 animate-spin ml-2"/>}
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500"/>
                                    <input 
                                        type="text" 
                                        placeholder="Cerca per nome o email..."
                                        value={userSearch}
                                        onChange={e => setUserSearch(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-indigo-500 outline-none mb-2"
                                    />
                                    {userSearch && (
                                        <div className="max-h-40 overflow-y-auto custom-scrollbar bg-slate-950 border border-slate-800 rounded-xl p-2 space-y-1">
                                            {filteredUsers.length > 0 ? filteredUsers.map(u => (
                                                <button 
                                                    key={u.id}
                                                    onClick={() => { setSelectedUserId(u.id); setUserSearch(u.name + ' (' + u.email + ')'); }}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex justify-between ${selectedUserId === u.id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                                                >
                                                    <span>{u.name}</span>
                                                    <span className="opacity-50 font-normal">{u.email}</span>
                                                </button>
                                            )) : <div className="text-slate-500 text-xs text-center py-2">Nessun utente trovato.</div>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. EDITOR CONTENUTO */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex-1 flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Contenuto Messaggio</h3>
                            <div className="flex gap-2">
                                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-400 transition-colors relative">
                                    <Smile className="w-4 h-4"/>
                                    {showEmojiPicker && (
                                        <div className="absolute top-full right-0 mt-2 p-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 grid grid-cols-6 gap-1 w-48">
                                            {EMOJIS.map(em => (
                                                <button key={em} onClick={() => addEmoji(em)} className="hover:bg-slate-700 p-1 rounded text-lg">{em}</button>
                                            ))}
                                        </div>
                                    )}
                                </button>
                                <button onClick={() => fileInputRef.current?.click()} className={`p-2 hover:bg-slate-800 rounded-lg transition-colors ${logoUrl ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`} title="Carica Logo">
                                    {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin"/> : <ImageIcon className="w-4 h-4"/>}
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload}/>
                            </div>
                        </div>

                        <div className="space-y-4 flex-1 flex flex-col">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Oggetto / Titolo</label>
                                <input 
                                    value={subject} 
                                    onChange={e => setSubject(e.target.value)} 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-bold text-lg focus:border-indigo-500 outline-none placeholder:text-slate-700" 
                                    placeholder="Es. Novità estive in arrivo!"
                                />
                            </div>

                            <div className="flex-1 flex flex-col">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Corpo del messaggio</label>
                                <textarea 
                                    value={body} 
                                    onChange={e => setBody(e.target.value)} 
                                    className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-sm focus:border-indigo-500 outline-none resize-none leading-relaxed placeholder:text-slate-700" 
                                    placeholder="Scrivi qui il tuo messaggio..."
                                />
                            </div>

                            {/* TASTI CATEGORIA (IN CALCE) */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Tipologia (Influisce sullo stile)</label>
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {(Object.keys(MSG_TYPE_CONFIG) as MsgType[]).map(type => {
                                        const cfg = MSG_TYPE_CONFIG[type];
                                        const isActive = msgType === type;
                                        return (
                                            <button 
                                                key={type} 
                                                onClick={() => setMsgType(type)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all border ${isActive ? `${cfg.border} bg-slate-800 text-white` : 'border-slate-800 bg-slate-900 text-slate-500 hover:border-slate-600'}`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${cfg.color}`}></div>
                                                {cfg.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2 pb-2">
                        <button 
                            onClick={handleSend} 
                            disabled={isSending} 
                            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-10 py-4 rounded-2xl font-black uppercase text-sm shadow-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 border border-indigo-400/20"
                        >
                            {isSending ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>} 
                            {isSending ? 'Invio in corso...' : 'Invia Comunicazione'}
                        </button>
                    </div>
                </div>

                {/* RIGHT COLUMN: PREVIEW */}
                <div className="w-full xl:w-[400px] shrink-0 flex flex-col gap-4">
                    <div className={`bg-slate-900 border rounded-2xl p-5 h-full shadow-2xl relative overflow-hidden transition-colors ${MSG_TYPE_CONFIG[msgType].border.replace('border-', 'border-opacity-30 border-')}`}>
                        
                        {/* Dynamic Top Bar Color based on Type */}
                        <div className={`absolute top-0 left-0 w-full h-1.5 ${MSG_TYPE_CONFIG[msgType].color}`}></div>
                        
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            {channel === 'email' ? <Monitor className="w-4 h-4"/> : <Smartphone className="w-4 h-4"/>} 
                            Anteprima {channel === 'email' ? 'Email' : 'Push'}
                        </h3>

                        {channel === 'notification' || channel === 'system_alert' ? (
                            /* PHONE PREVIEW */
                            <div className="bg-black border-[6px] border-slate-800 rounded-[2.5rem] p-4 h-[600px] relative shadow-2xl mx-auto max-w-[300px] overflow-hidden">
                                {/* Dynamic Island */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-24 bg-slate-800 rounded-b-xl z-20"></div>
                                {/* Wallpaper */}
                                <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600" className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Wallpaper"/>
                                
                                <div className="relative z-10 mt-12 mx-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-3 shadow-lg animate-in slide-in-from-top-4 duration-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-1.5">
                                            {logoUrl ? (
                                                <img src={logoUrl} className="w-5 h-5 rounded-md object-cover bg-black" alt="Logo"/>
                                            ) : (
                                                <div className="w-5 h-5 bg-amber-500 rounded-md flex items-center justify-center text-black shadow-sm">
                                                    <MapPin className="w-3 h-3 fill-current"/>
                                                </div>
                                            )}
                                            <span className="text-[10px] font-black uppercase text-white/90 tracking-wide">TOURING DIARY</span>
                                        </div>
                                        <span className="text-[9px] text-white/70">Adesso</span>
                                    </div>
                                    {/* Type Badge in Notification */}
                                    <div className="flex items-center gap-1 mb-1">
                                         <div className={`w-1.5 h-1.5 rounded-full ${MSG_TYPE_CONFIG[msgType].color}`}></div>
                                         <span className="text-[8px] font-bold text-white/80 uppercase">{MSG_TYPE_CONFIG[msgType].label}</span>
                                    </div>
                                    <div className="font-bold text-white text-sm mb-0.5 leading-tight">{subject || "Nessun Titolo"}</div>
                                    <div className="text-xs text-white/90 leading-snug line-clamp-4">{body || "Nessun contenuto..."}</div>
                                </div>
                            </div>
                        ) : (
                            /* EMAIL PREVIEW */
                            <div className="bg-white rounded-xl h-[600px] border border-slate-200 overflow-hidden flex flex-col shadow-inner relative">
                                <div className="bg-slate-50 border-b border-slate-200 p-3 flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                                </div>
                                <div className="p-6 flex-1 overflow-y-auto relative">
                                    {/* Brand Header inside Email */}
                                    <div className="flex justify-center mb-6">
                                         {logoUrl ? (
                                            <img src={logoUrl} className="h-12 object-contain" alt="Logo"/>
                                         ) : (
                                            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">TOURING DIARY</h1>
                                         )}
                                    </div>
                                    
                                    <div className={`text-xs font-bold uppercase tracking-widest mb-2 px-2 py-1 w-fit rounded ${MSG_TYPE_CONFIG[msgType].color.replace('bg-', 'text-')} bg-opacity-10`}>
                                        {MSG_TYPE_CONFIG[msgType].label}
                                    </div>

                                    <h2 className="text-xl font-bold text-slate-900 mb-4 font-display leading-tight">{subject || "Nessun Titolo"}</h2>
                                    
                                    <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-serif">
                                        {body || "Nessun contenuto..."}
                                    </div>
                                    
                                    <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                                        <button className={`text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg ${MSG_TYPE_CONFIG[msgType].color}`}>Scopri di più</button>
                                        <p className="text-[10px] text-slate-400 mt-6">© 2025 Touring Diary. Tutti i diritti riservati.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
