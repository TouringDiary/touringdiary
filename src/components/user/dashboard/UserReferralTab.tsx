
import React, { useState, useEffect } from 'react';
import { Copy, Check, Gift, Zap, ArrowRight, Loader2, Award, AlertTriangle, Share2, Facebook, Linkedin, Twitter, Instagram, Users, ExternalLink, ShieldCheck, Coins, Plus, Wallet } from 'lucide-react';
import { refreshUsersCache, getAllUsers, getUserById } from '../../../services/userService';
import { getActiveSocialTemplates } from '../../../services/socialMarketingService';
import { addNotification } from '../../../services/notificationService';
import { User as UserType, SocialTemplate } from '../../../types/index';
import { useSystemMessage } from '../../../hooks/useSystemMessage';
import { SocialCardGenerator } from '../../user/referral/SocialCardGenerator';
import { DraggableSlider } from '../../common/DraggableSlider';

interface Props {
    user: UserType;
    onUpdateUser?: (updatedUser: UserType) => void;
    onSwitchToOverview?: () => void;
}

// Icona WhatsApp SVG Ufficiale
const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 19.88C10.57 19.88 9.11 19.48 7.84 18.73L7.54 18.55L4.42 19.37L5.25 16.33L4.95 15.85C4.15 14.58 3.73 13.11 3.73 11.61C3.73 7.03 7.46 3.3 12.05 3.3C14.28 3.3 16.37 4.17 17.95 5.75C19.53 7.33 20.4 9.42 20.4 11.65C20.4 16.23 16.67 19.88 12.05 19.88ZM16.61 14.33C16.36 14.21 15.14 13.61 14.92 13.52C14.69 13.44 14.53 13.4 14.36 13.64C14.19 13.89 13.72 14.45 13.58 14.61C13.44 14.78 13.29 14.8 13.04 14.67C12.79 14.55 11.99 14.28 11.05 13.44C10.31 12.78 9.82 11.97 9.67 11.72C9.53 11.47 9.65 11.34 9.78 11.21C9.89 11.1 10.03 10.92 10.15 10.78C10.27 10.64 10.31 10.53 10.4 10.37C10.48 10.2 10.44 10.06 10.38 9.94C10.32 9.82 9.82 8.6 9.62 8.1C9.42 7.62 9.21 7.68 9.06 7.67H8.58C8.41 7.67 8.15 7.73 7.92 7.98C7.7 8.23 7.06 8.83 7.06 10.05C7.06 11.27 7.95 12.45 8.07 12.61C8.19 12.78 9.82 15.28 12.3 16.35C12.89 16.61 13.35 16.76 13.71 16.87C14.3 17.06 14.84 17.03 15.27 16.97C15.75 16.9 16.74 16.37 16.94 15.79C17.15 15.21 17.15 14.72 17.08 14.61C17.01 14.5 16.86 14.46 16.61 14.33Z" />
    </svg>
);

// Stile standardizzato per i box
const SECTION_BOX_STYLE = "bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4";

export const UserReferralTab = ({ user, onUpdateUser, onSwitchToOverview }: Props) => {
    const [referrals, setReferrals] = useState<UserType[]>([]);
    const [templates, setTemplates] = useState<SocialTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [codeToRedeem, setCodeToRedeem] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [redeemResult, setRedeemResult] = useState<{ success: boolean, msg: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [referrer, setReferrer] = useState<UserType | null>(null);
    const [referralLink, setReferralLink] = useState('');
    
    const [isDesktop, setIsDesktop] = useState(false);

    const sliderRef = React.useRef<any>(null);

    // Testo condivisione dal DB
    const { getText } = useSystemMessage('social_share_global');
    const shareTemplate = getText({ url: referralLink, code: user.referralCode });

    useEffect(() => {
        setIsDesktop(window.matchMedia('(min-width: 1024px)').matches);
        
        if (typeof window !== 'undefined') {
            let baseUrl = window.location.origin;
            if (baseUrl.startsWith('blob:') || baseUrl === 'null') {
                baseUrl = 'https://touringdiary-it.com';
            }
            setReferralLink(`${baseUrl}?ref=${user.referralCode}`);
        }
    }, [user.referralCode]);

    useEffect(() => {
        loadData();
    }, [user.id]);

    const loadData = async () => {
        if (user.role === 'guest' || user.id === 'guest') {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            await refreshUsersCache();
            const allUsers = getAllUsers();
            const list = allUsers.filter(u => u.referredBy === user.id);
            const socialTpls = await getActiveSocialTemplates();
            
            setReferrals(list);
            setTemplates(socialTpls);
            
            if (user.referredBy) {
                const guide = getUserById(user.referredBy);
                setReferrer(guide || null);
            }
        } catch (e) {
            console.error("Errore caricamento referral", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (textToCopy?: string) => {
        const text = textToCopy || referralLink;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getShareText = () => {
        if (!shareTemplate.body) {
             return `Ciao! Sto organizzando il mio viaggio con Touring Diary! È incredibile e GRATIS!\nUsa il mio codice ${user.referralCode} per avere crediti extra.\nLink: ${referralLink}`;
        }
        return shareTemplate.body;
    };

    const handleSocialShare = (platform: 'whatsapp' | 'facebook' | 'twitter' | 'linkedin' | 'copy') => {
        const text = encodeURIComponent(getShareText());
        const url = encodeURIComponent(referralLink);
        
        let link = '';
        switch (platform) {
            case 'whatsapp': 
                // FIX: Use Web WhatsApp on Desktop to prevent download page issue
                const waBase = isDesktop ? 'https://web.whatsapp.com/send' : 'https://api.whatsapp.com/send';
                link = `${waBase}?text=${text}`; 
                break;
            case 'facebook': link = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
            case 'twitter': link = `https://twitter.com/intent/tweet?text=${text}&url=${url}`; break;
            case 'linkedin': link = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`; break;
            case 'copy': handleCopy(decodeURIComponent(text)); return;
        }
        window.open(link, '_blank');
    };

    const handleRedeem = async () => {
        alert("La funzione di riscatto codice è temporaneamente disabilitata.");
        // if (!codeToRedeem.trim()) return;
        // setIsRedeeming(true);
        // setRedeemResult(null);

        // const result = await redeemReferralCode(user.id, codeToRedeem);
        // setRedeemResult({ success: result.success, msg: result.message });
        
        // if (result.success) {
        //     await refreshUsersCache();
        //     const updatedUser = getUserById(user.id);
        //     if (updatedUser && onUpdateUser) onUpdateUser(updatedUser); 
        //     addNotification(
        //         user.id,
        //         'reward_unlocked',
        //         'Codice Riscattato!',
        //         'Hai ottenuto +20 Crediti AI Extra.',
        //         { section: 'profile' }
        //     );
        //     loadData();
        // }
        // setIsRedeeming(false);
    };

    // CALCOLO CREDITI TOTALI
    const bonusFromGuide = user.referredBy ? 20 : 0;
    const bonusFromFriends = referrals.length * 20;
    const totalEarnedCredits = bonusFromGuide + bonusFromFriends;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 pb-12">
            
            {/* 1. HERO SECTION (FISSO IN ALTO) */}
            <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 overflow-hidden shadow-2xl border border-indigo-400/30">
                <div className="absolute top-0 right-0 p-12 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                
                <div className="relative z-10 flex flex-col items-center text-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-widest mb-4 border border-white/20 shadow-lg">
                            <Gift className="w-3.5 h-3.5"/> Programma Referral
                        </div>
                        <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-2 leading-tight">
                            Porta un Amico,<br/> Viaggiate Gratis
                        </h2>
                        <div className="text-indigo-100 text-sm max-w-md mx-auto leading-relaxed">
                            <p className="mb-2">Condividi il tuo codice. Per ogni amico che si iscrive, entrambi ricevete <strong>+20 Crediti AI Extra</strong>.</p>
                            
                            {onSwitchToOverview && (
                                <button 
                                    onClick={onSwitchToOverview} 
                                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-white underline decoration-amber-500/50 hover:decoration-white transition-all mt-1"
                                >
                                    Scopri tutti i vantaggi e i premi esclusivi nel tuo Profilo <ExternalLink className="w-3 h-3"/>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 flex flex-col items-center gap-4 w-full max-w-sm">
                        <span className="text-indigo-200 text-xs font-bold uppercase tracking-wider">Il tuo Link Unico</span>
                        <div className="flex items-center gap-2 w-full">
                            <div className="text-sm font-mono font-bold text-white tracking-wide bg-black/20 px-4 py-3 rounded-xl border border-white/10 flex-1 text-center truncate select-all">
                                {referralLink}
                            </div>
                            <button 
                                onClick={() => handleCopy()}
                                className="bg-white text-indigo-600 hover:bg-indigo-50 p-3 rounded-xl shadow-lg transition-all active:scale-95"
                                title="Copia Link"
                            >
                                {copied ? <Check className="w-5 h-5"/> : <Copy className="w-5 h-5"/>}
                            </button>
                        </div>
                        
                        {/* SOCIAL SHARE ROW */}
                        <div className="grid grid-cols-5 gap-2 w-full mt-2">
                            <button onClick={() => handleSocialShare('whatsapp')} className="bg-[#25D366] hover:bg-[#20bd5a] text-white p-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center group" title="WhatsApp"><WhatsAppIcon className="w-6 h-6"/></button>
                            <button onClick={() => handleSocialShare('facebook')} className="bg-[#1877F2] hover:bg-[#166fe5] text-white p-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center" title="Facebook"><Facebook className="w-6 h-6 fill-current"/></button>
                            <button onClick={() => handleSocialShare('twitter')} className="bg-black hover:bg-slate-900 text-white p-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center" title="X (Twitter)"><Twitter className="w-6 h-6 fill-current"/></button>
                            <button onClick={() => handleSocialShare('linkedin')} className="bg-[#0077b5] hover:bg-[#006fa3] text-white p-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center" title="LinkedIn"><Linkedin className="w-6 h-6 fill-current"/></button>
                            <button onClick={() => handleSocialShare('copy')} className="bg-slate-100 hover:bg-white text-slate-600 p-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center" title="Copia Testo Completo">{copied ? <Check className="w-6 h-6 text-emerald-500"/> : <Instagram className="w-6 h-6"/>}</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. & 3. UNIFIED BOX: GUIDA & VIAGGIATORI */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col">
                
                {/* HEADER: TOTALONE */}
                <div className="bg-[#0f172a] p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                     <div className="flex items-center gap-3">
                         <div className="p-3 bg-indigo-600/20 rounded-xl text-indigo-400 border border-indigo-500/20">
                            <Wallet className="w-6 h-6"/>
                         </div>
                         <div>
                             <h3 className="text-xl font-bold text-white leading-none">Il tuo Bottino</h3>
                             <p className="text-xs text-slate-500 mt-1">Crediti accumulati con il programma</p>
                         </div>
                     </div>

                     <div className="flex items-center gap-6 bg-slate-900/50 p-2 px-4 rounded-xl border border-slate-800">
                         <div className="text-right">
                             <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Totale Guadagnato</span>
                             <div className="text-3xl font-black text-white flex items-center justify-end gap-1">
                                 {totalEarnedCredits} <span className="text-sm font-bold text-slate-600">crediti</span>
                             </div>
                         </div>
                         <div className="w-px h-10 bg-slate-700"></div>
                         <div className="flex flex-col gap-1 text-xs min-w-[80px]">
                             <div className="flex justify-between items-center w-full">
                                 <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Guide:</span>
                                 <span className={`font-mono font-bold ${bonusFromGuide > 0 ? 'text-indigo-400' : 'text-slate-600'}`}>+{bonusFromGuide}</span>
                             </div>
                             <div className="flex justify-between items-center w-full">
                                 <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Inviti:</span>
                                 <span className={`font-mono font-bold ${bonusFromFriends > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>+{bonusFromFriends}</span>
                             </div>
                         </div>
                     </div>
                </div>

                {/* CONTENT GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                    
                    {/* LEFT COL: LA TUA GUIDA */}
                    <div className="p-6 md:p-8 bg-slate-900/30">
                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-indigo-500"/> La tua Guida di TD
                        </h4>
                        
                        {!user.referredBy ? (
                            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-inner">
                                <p className="text-xs text-slate-400 mb-3">Hai un codice amico? Inseriscilo qui per ottenere subito il tuo bonus.</p>
                                <div className="space-y-3">
                                    <input 
                                        type="text" 
                                        placeholder="Inserisci codice (es. MARIO-X92)" 
                                        value={codeToRedeem}
                                        onChange={e => { setCodeToRedeem(e.target.value.toUpperCase()); setRedeemResult(null); }}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono placeholder:text-slate-600 focus:border-indigo-500 outline-none uppercase text-sm"
                                    />
                                    <button 
                                        onClick={handleRedeem}
                                        disabled={!codeToRedeem || isRedeeming}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-3 rounded-xl font-bold uppercase text-xs tracking-wider shadow-lg flex items-center justify-center gap-2"
                                    >
                                        {isRedeeming ? <Loader2 className="w-4 h-4 animate-spin"/> : <ArrowRight className="w-4 h-4"/>}
                                        Riscatta Codice
                                    </button>
                                </div>
                                {redeemResult && (
                                    <div className={`mt-3 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${redeemResult.success ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-900/20 text-red-400 border border-red-500/30'}`}>
                                        {redeemResult.success ? <Check className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
                                        {redeemResult.msg}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-indigo-900/10 border border-indigo-500/20 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-indigo-500 flex items-center justify-center font-bold text-slate-300 overflow-hidden shadow-lg shrink-0">
                                        {referrer?.avatar && !referrer.avatar.includes('ui-avatars') ? <img src={referrer.avatar} className="w-full h-full object-cover"/> : referrer?.name?.charAt(0) || '?'}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-white font-bold text-sm truncate">{referrer?.name || 'Utente Sconosciuto'}</h4>
                                        <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wide">Ti ha invitato</p>
                                    </div>
                                </div>
                                <div className="text-center bg-indigo-900/40 px-3 py-1.5 rounded-xl border border-indigo-500/30 shrink-0">
                                    <span className="block text-[8px] text-indigo-300 font-black uppercase tracking-widest">BONUS</span>
                                    <span className="text-lg font-black text-white leading-none">+20</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COL: I TUOI VIAGGIATORI */}
                    <div className="p-6 md:p-8 bg-slate-900">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <Users className="w-4 h-4 text-emerald-500"/> I tuoi Viaggiatori
                            </h4>
                            <span className="text-xs text-slate-500 font-bold bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                                {referrals.length} Amici
                            </span>
                        </div>
                        
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-1 space-y-3">
                            {isLoading ? (
                                <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-600"/></div>
                            ) : referrals.length > 0 ? (
                                referrals.map((friend) => (
                                    <div key={friend.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-all">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-400 overflow-hidden shrink-0">
                                                {friend.avatar && !friend.avatar.includes('ui-avatars') ? <img src={friend.avatar} className="w-full h-full object-cover"/> : friend.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-slate-200 font-bold text-xs truncate">{friend.name}</h4>
                                                <p className="text-[9px] text-slate-500 truncate">{new Date(friend.registrationDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-center bg-emerald-900/10 px-2 py-1 rounded border border-emerald-500/20 shrink-0">
                                            <span className="text-emerald-400 text-xs font-black flex items-center gap-0.5"><Plus className="w-3 h-3"/> 20</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center gap-2">
                                    <Award className="w-8 h-8 text-slate-700"/>
                                    <p className="text-slate-500 text-xs font-medium px-4">Ancora nessun invito accettato.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. VIRAL KIT */}
            <div className={SECTION_BOX_STYLE}>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Share2 className="w-5 h-5 text-pink-500"/> Viral Kit
                        </h3>
                        <p className="text-xs text-slate-400">Cartoline pronte per le tue storie.</p>
                    </div>
                </div>
                
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center text-slate-500 py-12">
                            <Loader2 className="w-8 h-8 animate-spin"/>
                    </div>
                ) : (
                    <div className="w-full overflow-hidden">
                        {templates.length > 0 ? (
                            <DraggableSlider ref={sliderRef} className="pb-4 gap-4">
                                {templates.map(tpl => (
                                    <div key={tpl.id} className="w-48 flex-shrink-0 snap-center">
                                        <SocialCardGenerator template={tpl} user={user} />
                                    </div>
                                ))}
                            </DraggableSlider>
                        ) : (
                            <div className="h-40 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-800 rounded-xl">
                                <p className="text-slate-500 text-xs italic">Nessun template disponibile al momento.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
