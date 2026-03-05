
import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, ArrowRight, CheckCircle, AlertCircle, Loader2, Zap, Shield, Briefcase, UserCheck, Gift, FlaskConical } from 'lucide-react';
import { authenticateUser, registerUser, refreshUsersCache } from '../../services/userService';
import { addNotification } from '../../services/notificationService'; 
import { User as UserType } from '../../types/users';
import { getSessionItem, removeSessionItem } from '../../services/storageService';
import { getGlobalImage } from '../../services/settingsService';
import { useSystemMessage } from '../../hooks/useSystemMessage';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAuthSuccess: (user: UserType) => void;
}

export const AuthModal = ({ isOpen, onClose, onAuthSuccess }: AuthModalProps) => {
    const [view, setView] = useState<'login' | 'register' | 'verify' | 'dev_quick'>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Load dynamic background from centralized service
    const authBg = getGlobalImage('auth_bg');

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    
    // Referral State (Step 2)
    const [referralCode, setReferralCode] = useState('');
    const [hasPendingReferral, setHasPendingReferral] = useState(false);

    const [pendingUser, setPendingUser] = useState<UserType | null>(null);
    const [demoUsers, setDemoUsers] = useState<UserType[]>([]);

    // TESTI DINAMICI DAL DB
    const { getText: getWelcomeMsg } = useSystemMessage('auth_welcome');
    const welcomeMsg = getWelcomeMsg();

    useEffect(() => {
        if (isOpen) {
            setView('login');
            setError(null);
            setIsLoading(false);
            setEmail('');
            setPassword('');
            setFirstName('');
            setLastName('');
            
            // CHECK REFERRAL CODE IN SESSION STORAGE (SAFE)
            const pendingRef = getSessionItem('pending_referral_code');
            if (pendingRef) {
                setReferralCode(pendingRef);
                setHasPendingReferral(true);
            } else {
                setReferralCode('');
                setHasPendingReferral(false);
            }
            
            refreshUsersCache().then(allUsers => {
                let testAccounts = allUsers.filter(u => u.isTestAccount === true);
                if (testAccounts.length === 0) {
                    testAccounts = allUsers.filter(u => u.role === 'admin_all' || u.role === 'admin_limited').slice(0, 5);
                }
                const sortedTests = testAccounts.sort((a, b) => {
                    const roleOrder: Record<string, number> = { 'admin_all': 0, 'admin_limited': 1, 'business': 2, 'user': 3 };
                    return (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
                });
                setDemoUsers(sortedTests.slice(0, 8));
            });
        }
    }, [isOpen]);

    // GESTIONE PRIORITARIA TASTO ESC
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [isOpen, onClose]);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\s/g, '').trim();
        setEmail(val);
        setError(null);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        await new Promise(r => setTimeout(r, 500));

        const result = await authenticateUser(email, password);
        
        if (result.success && result.user) {
            // Pulizia codice referral se l'utente fa login invece di registrarsi (non serve più)
            removeSessionItem('pending_referral_code');
            onAuthSuccess(result.user);
        } else {
            setError(result.error || 'Credenziali non valide.');
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (password.length < 6) {
            setError("La password deve essere di almeno 6 caratteri.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
             setError("Formato email non valido. Controlla di aver inserito '@' e il dominio.");
             return;
        }

        setIsLoading(true);
        
        // Passiamo referralCode al servizio
        const cleanData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            password: password,
            referralCode: referralCode.trim().toUpperCase() || undefined
        };
        
        const result = await registerUser(cleanData);

        if (result.success && result.user) {
            // Successo: Rimuovi codice dalla sessione
            removeSessionItem('pending_referral_code');
            
            setPendingUser(result.user);
            try {
                addNotification(
                    result.user.id,
                    'system',
                    'Benvenuto su Touring Diary!',
                    'Completa il tuo profilo per guadagnare i primi 50 XP e sbloccare funzioni esclusive.',
                    { section: 'rewards' } 
                );
            } catch (e) {
                console.error("Errore invio notifica benvenuto", e);
            }
            setView('verify');
            setIsLoading(false);
        } else {
            setError(result.error || 'Errore sconosciuto durante la registrazione.');
            setIsLoading(false);
        }
    };

    const handleFinalizeRegistration = async () => {
        if (pendingUser) {
            const loginResult = await authenticateUser(email, password);
            if (loginResult.success && loginResult.user) {
                onAuthSuccess(loginResult.user);
            } else {
                setError("Account creato ma non attivo. Se hai 'Confirm Email' attivo su Supabase, controlla la posta.");
            }
        }
    };

    const handleQuickLogin = (mockUser: UserType) => {
        onAuthSuccess(mockUser);
    };

    const getRoleIcon = (role: string) => {
        switch(role) {
            case 'admin_all': return <Shield className="w-4 h-4 text-amber-500 fill-amber-500"/>;
            case 'admin_limited': return <Shield className="w-4 h-4 text-indigo-400"/>;
            case 'business': return <Briefcase className="w-4 h-4 text-blue-400"/>;
            default: return <UserCheck className="w-4 h-4 text-emerald-400"/>;
        }
    };

    const getRoleName = (role: string) => {
         switch(role) {
            case 'admin_all': return 'Admin-All';
            case 'admin_limited': return 'Admin-Limited';
            case 'business': return 'Partner / Negoziante';
            case 'user': return 'Turista';
            default: return role;
        }
    };
    
    const getQuickLoginName = (u: UserType) => {
        return u.name || u.email.split('@')[0];
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex animate-in zoom-in-95 max-h-[90vh]">
                
                {/* LEFT SIDE: VISUAL (Hidden on Mobile) */}
                <div className="hidden md:flex w-1/2 relative bg-slate-800 flex-col items-center justify-center p-12 text-center overflow-hidden">
                    <div className="absolute inset-0">
                        {authBg && <img src={authBg} alt="Auth Background" className="w-full h-full object-cover opacity-40"/>}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-950/50 to-transparent"></div>
                    
                    <div className="relative z-10">
                        <h2 className="text-4xl font-display font-bold text-white mb-4 shadow-black drop-shadow-lg whitespace-pre-line">
                            {welcomeMsg.title}
                        </h2>
                        <p className="text-slate-300 text-lg leading-relaxed mb-8 font-light">
                            {welcomeMsg.body}
                        </p>
                        
                        <div className="flex gap-2 justify-center">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse delay-75"></div>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-150"></div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: FORMS */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col relative bg-slate-900 overflow-y-auto">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-lg z-20">
                        <X className="w-6 h-6"/>
                    </button>

                    {/* VIEW: DEV QUICK LOGIN */}
                    {view === 'dev_quick' ? (
                        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8">
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400"/> Collaudo Rapido
                                </h3>
                                <p className="text-slate-400 text-xs mt-1 uppercase tracking-wide font-bold">Utenze Test dal Database</p>
                            </div>
                            
                            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[400px]">
                                {demoUsers.length > 0 ? demoUsers.map(u => (
                                    <button 
                                        key={u.id}
                                        onClick={() => handleQuickLogin(u)}
                                        className={`w-full border p-3 rounded-xl flex items-center gap-3 transition-all text-left group relative overflow-hidden ${
                                            u.role === 'admin_all' ? 'bg-amber-900/10 border-amber-500/50 hover:bg-amber-900/30' : 
                                            u.role === 'admin_limited' ? 'bg-purple-900/10 border-purple-500/50 hover:bg-purple-900/30' : 
                                            u.role === 'business' ? 'bg-blue-900/10 border-blue-500/50 hover:bg-blue-900/30' : 
                                            'bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-indigo-500'
                                        }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center font-bold text-white border border-slate-600 group-hover:border-indigo-400 shadow-md overflow-hidden">
                                            {u.avatar && !u.avatar.includes('ui-avatars') ? <img src={u.avatar} className="w-full h-full object-cover"/> : u.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-white truncate">{getQuickLoginName(u)}</div>
                                            <div className="flex items-center gap-2 text-xs text-slate-400 group-hover:text-slate-300">
                                                {getRoleIcon(u.role)}
                                                <span className="capitalize font-mono">{getRoleName(u.role)}</span>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white"/>
                                    </button>
                                )) : (
                                    <div className="text-center text-slate-500 text-xs py-10 border border-dashed border-slate-800 rounded-xl">
                                        Nessuna utenza di collaudo trovata.<br/>
                                        Creane una dal pannello Admin &gt; Utenti.
                                    </div>
                                )}
                            </div>

                            <button onClick={() => setView('login')} className="mt-6 text-sm text-slate-500 hover:text-white underline text-center w-full">
                                Torna al login classico
                            </button>
                        </div>
                    ) : view === 'verify' ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-right-8">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-emerald-500/50">
                                <CheckCircle className="w-10 h-10 text-emerald-400 animate-bounce"/>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Registrazione Completata!</h3>
                            <p className="text-slate-400 mb-8">
                                Il tuo account <strong className="text-white">{email}</strong> è pronto.
                                <br/>
                                <span className="text-xs italic text-slate-500">(Se hai "Confirm Email" attivo su Supabase, controlla la posta.)</span>
                            </p>

                            <div className="w-full bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                <button 
                                    onClick={handleFinalizeRegistration}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg"
                                >
                                    <Zap className="w-4 h-4"/> Accedi Subito
                                </button>
                            </div>
                            
                            {error && (
                                <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-xs text-red-300">
                                    {error}
                                </div>
                            )}
                            
                            <button onClick={() => setView('login')} className="mt-6 text-sm text-slate-500 hover:text-white underline">
                                Torna al Login
                            </button>
                        </div>
                    ) : (
                        // VIEW: LOGIN / REGISTER FORM
                        <div className="flex-1 flex flex-col justify-center animate-in fade-in">
                            <div className="flex gap-6 mb-6 border-b border-slate-800 pb-1">
                                <button 
                                    onClick={() => setView('login')}
                                    className={`pb-3 text-sm font-bold uppercase tracking-widest transition-all ${view === 'login' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Accedi
                                </button>
                                <button 
                                    onClick={() => setView('register')}
                                    className={`pb-3 text-sm font-bold uppercase tracking-widest transition-all ${view === 'register' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Registrati
                                </button>
                            </div>

                            <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-4">
                                {view === 'register' && (
                                    <>
                                        <div className="flex gap-4">
                                            <div className="space-y-1 flex-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase">Nome</label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-500"/>
                                                    <input 
                                                        type="text" 
                                                        value={firstName}
                                                        onChange={e => setFirstName(e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:border-amber-500 outline-none"
                                                        placeholder="Mario"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1 flex-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase">Cognome</label>
                                                <input 
                                                    type="text" 
                                                    value={lastName}
                                                    onChange={e => setLastName(e.target.value)}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:border-amber-500 outline-none"
                                                    placeholder="Rossi"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* REFERRAL CODE INPUT */}
                                        <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex justify-between items-end">
                                                <label className={`text-[10px] font-bold uppercase flex items-center gap-1 ${hasPendingReferral ? 'text-emerald-500' : 'text-slate-500'}`}>
                                                    {hasPendingReferral ? <Gift className="w-3 h-3"/> : null}
                                                    Codice Amico (Opzionale)
                                                </label>
                                                {hasPendingReferral && <span className="text-[9px] bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-bold uppercase tracking-wider animate-pulse">Bonus Attivo</span>}
                                            </div>
                                            <input 
                                                type="text" 
                                                value={referralCode}
                                                onChange={e => { setReferralCode(e.target.value.toUpperCase()); setHasPendingReferral(false); }}
                                                className={`w-full bg-slate-900 border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none uppercase tracking-widest font-mono ${hasPendingReferral ? 'border-emerald-500 focus:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-slate-700 focus:border-amber-500'}`}
                                                placeholder="CODICE-123"
                                            />
                                            {hasPendingReferral && <p className="text-[10px] text-emerald-400 font-medium ml-1">Codice rilevato dal link! Ti spettano +20 Crediti AI.</p>}
                                        </div>
                                    </>
                                )}

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500"/>
                                        <input 
                                            type="email" 
                                            value={email}
                                            onChange={handleEmailChange}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:border-amber-500 outline-none"
                                            placeholder="nome@esempio.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Password</label>
                                        {view === 'login' && <a href="#" className="text-[10px] text-indigo-400 hover:text-indigo-300">Recupera password?</a>}
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500"/>
                                        <input 
                                            type="password" 
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:border-amber-500 outline-none"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg flex items-center gap-2 text-xs text-red-300 animate-pulse">
                                        <AlertCircle className="w-4 h-4 shrink-0"/> 
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <ArrowRight className="w-5 h-5"/>}
                                    {view === 'login' ? 'Accedi' : 'Crea Account'}
                                </button>
                            </form>

                            {/* DEV SHORTCUT */}
                            <div className="mt-6 border-t border-slate-800 pt-4 flex justify-center">
                                <button 
                                    onClick={() => setView('dev_quick')}
                                    className="bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-400 hover:text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border border-indigo-500/30"
                                >
                                    <Zap className="w-3 h-3 fill-current"/> Test Mode: Login Rapido
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
