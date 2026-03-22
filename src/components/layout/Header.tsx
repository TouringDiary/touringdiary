
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, LogIn, Lock, X, Menu, Info, Send, ShieldCheck, BookOpen, MapPin, CloudSun, Loader2, User as UserIcon, PanelLeftOpen, PanelLeftClose, Sparkles, LogOut, AlertTriangle } from 'lucide-react';
import { getUnreadCount } from '@/services/notificationService'; 
import { useModal } from '@/context/ModalContext';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';
// import { checkAiQuota } from '../../services/aiUsageService'; 
import { BrandLogo } from '../common/BrandLogo';
import { NarrativeCompass } from './NarrativeCompass';

// CONTEXT CONSUMER
import { useUser } from '@/context/UserContext';
import { useGps } from '@/context/GpsContext';
import { useUI } from '@/context/UIContext';
import { useNavigation } from '@/context/NavigationContext';

export interface HeaderProps {
    // Props residue solo se strettamente UI/locali
    onBack: () => void;
    onGoHome: () => void;
    showBack: boolean;
    onAdmin: () => void;
    onOpenStaticPage: (page: 'about' | 'contacts' | 'terms' | 'privacy') => void;
    onOpenProfile?: () => void;
    activeCityId: string | null;
    flashHelp?: boolean; 
}

const MASCOT_ICON = (
    <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#4F46E5" stroke="#fff" strokeWidth="5"/>
        <path d="M20 40 Q50 30 80 40" stroke="#818CF8" strokeWidth="4" fill="none"/>
        <circle cx="35" cy="45" r="5" fill="white"/>
        <circle cx="65" cy="45" r="5" fill="white"/>
        <path d="M40 65 Q50 75 60 65" stroke="white" strokeWidth="4" strokeLinecap="round"/>
    </svg>
);

export const Header = ({ 
    onBack, onGoHome, showBack, onAdmin, onOpenStaticPage, 
    activeCityId,
    flashHelp = false
}: HeaderProps) => {
  
  // CONTEXT HOOKS
  const { user, handleLogout } = useUser();
  const { userLocation, isLocating, toggleGps } = useGps();
  const { isMobile, mobileShowWeather, toggleMobileWeather, isSidebarOpen, toggleSidebar } = useUI();
  const { openModal } = useModal();
  // Navigazione consumata qui solo se necessario logica interna, ma props passate dal MainLayout sono ok per ora
  // In futuro si può pulire del tutto.

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const [aiQuota, setAiQuota] = useState({ count: 0, limit: 20 });
  const [showQuotaTooltip, setShowQuotaTooltip] = useState(false);
  
  // Hook Stili Dinamici
  const diaryBtnStyle = useDynamicStyles('header_diary_btn', isMobile);

  const handleRestartTour = () => {
      window.dispatchEvent(new Event('restart-onboarding'));
  };

  const isAdmin = user.role === 'admin_all' || user.role === 'admin_limited';

  useEffect(() => {
    const checkNotifications = () => {
        if (user && user.role !== 'guest') {
            setUnreadCount(getUnreadCount(user.id));
        } else {
            setUnreadCount(0);
        }
    };
    
    // const fetchQuota = async () => {
    //     const q = await checkAiQuota(user);
    //     setAiQuota({ count: q.count, limit: q.limit });
    // };

    checkNotifications();
    // fetchQuota();
    
    const interval = setInterval(checkNotifications, 3000); 
    // const intervalQuota = setInterval(fetchQuota, 30000); 

    return () => {
        clearInterval(interval);
        // clearInterval(intervalQuota);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const STATIC_MENU_ITEMS = [
    { id: 'about', label: 'Chi Siamo', Icon: Info },
    { id: 'contacts', label: 'Contatti', Icon: Send },
    { divider: true },
    { id: 'privacy', label: 'Privacy Policy', Icon: ShieldCheck },
    { id: 'terms', label: 'Termini e Condizioni', Icon: BookOpen },
  ];

  const squareBtnClass = `h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-lg md:rounded-xl border transition-all shadow-sm active:scale-90 shrink-0`;
  const iconSize = "w-4 h-4 md:w-5 md:h-5"; 

  const activeBtnClass = "bg-emerald-900/30 border-emerald-500/50 text-emerald-400";
  const inactiveBtnClass = "bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800";
  const amberBtnClass = "bg-amber-600 border-amber-500 text-white shadow-amber-900/20";
  const skyBtnClass = "bg-sky-900/30 border-sky-500/50 text-sky-400";
  
  const remaining = Math.max(0, aiQuota.limit - aiQuota.count);

  // Helper per aprire profilo
  const handleProfileClick = () => {
      if (user.role === 'guest') {
          openModal('auth');
      } else {
          openModal('userDashboard', { tab: 'overview' });
      }
      setIsMenuOpen(false);
  };

  return (
    <header 
        id="tour-header-container"
        className="w-full h-full flex items-center justify-between px-3 md:px-6 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-xl relative"
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none w-full max-w-[200px] md:max-w-lg h-full flex items-center justify-center">
          <NarrativeCompass activeCityId={activeCityId} />
      </div>

      <div className="flex items-center gap-2 shrink min-w-0 mr-1 z-10 relative">
        <div 
             id="tour-home-btn" 
             onClick={onGoHome} 
             className="cursor-pointer group shrink-0 active:scale-95 transition-transform"
             title="Torna alla Home"
        >
             <BrandLogo className="h-10 md:h-12" variant="light" showText={!isMobile || !showBack} />
        </div>

        {showBack && (
            <div className="hidden md:flex items-center ml-4 pl-4 border-l border-slate-800 animate-in fade-in slide-in-from-left-4 duration-300 shrink-0">
                <button 
                    onClick={onBack} 
                    className="px-3 py-1.5 flex items-center gap-2 group cursor-pointer bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-700 transition-colors" 
                    title="Torna Indietro"
                >
                    <ArrowLeft className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-400 group-hover:text-white uppercase tracking-wide">Indietro</span>
                </button>
            </div>
        )}
      </div>

      <div className="flex items-center gap-0.5 md:gap-3 ml-auto shrink-0 justify-end z-20 relative">
        
        <div 
             className="relative hidden md:flex items-center mr-2 cursor-help"
             onMouseEnter={() => setShowQuotaTooltip(true)}
             onMouseLeave={() => setShowQuotaTooltip(false)}
        >
             <div className="flex flex-col items-center justify-center bg-indigo-950/50 border border-indigo-500/30 px-2 py-1 rounded-xl shadow-sm hover:bg-indigo-900/50 transition-colors min-w-[56px]">
                 <div className="flex items-center gap-1">
                     <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse"/>
                     <span className="text-sm font-black text-indigo-100 leading-none">{remaining}</span>
                 </div>
                 <span className="text-[8px] font-bold text-indigo-400/80 uppercase tracking-widest leading-none mt-0.5">Crediti</span>
             </div>
             
             {showQuotaTooltip && (
                 <div className="absolute top-full right-0 mt-2 bg-slate-900 border border-indigo-500/50 p-3 rounded-xl shadow-2xl w-48 z-[100] animate-in fade-in zoom-in-95">
                     <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Capacità AI Mensile</p>
                     <div className="flex justify-between items-center text-sm text-white font-mono font-bold mb-2">
                         <span>{aiQuota.count} / {aiQuota.limit}</span>
                         <span className={remaining > 0 ? "text-emerald-400" : "text-red-500"}>{Math.round((aiQuota.count/aiQuota.limit)*100)}% Usato</span>
                     </div>
                     <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                         <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${(aiQuota.count/aiQuota.limit)*100}%` }}></div>
                     </div>
                     <p className="text-[10px] text-slate-500 italic">Include: Base Livello + Bonus Referral</p>
                 </div>
             )}
        </div>

        {showBack && (
             <button 
                onClick={onBack} 
                className={`md:hidden ${squareBtnClass} bg-slate-800 border-slate-700 text-amber-500 hover:text-white hover:bg-slate-700`}
                title="Indietro"
            >
                <ArrowLeft className={iconSize} />
            </button>
        )}

        <button 
            id="tour-toggle-sidebar"
            onClick={toggleSidebar}
            className={`hidden md:flex h-10 rounded-xl px-4 gap-2 border items-center justify-center transition-all ${isSidebarOpen ? amberBtnClass : inactiveBtnClass}`}
        >
            {isSidebarOpen ? <PanelLeftOpen className="w-5 h-5"/> : <PanelLeftClose className="w-5 h-5"/>}
            <span className={`${diaryBtnStyle} hidden lg:inline leading-none pt-1`}>Diario di Viaggio</span>
        </button>
        
        <div className="md:hidden">
            <button 
                onClick={toggleMobileWeather} 
                className={`${squareBtnClass} ${mobileShowWeather ? skyBtnClass : inactiveBtnClass}`}
            >
                <CloudSun className={iconSize}/>
            </button>
        </div>

        <button 
            id="tour-gps-toggle"
            onClick={toggleGps}
            disabled={isLocating}
            className={`${squareBtnClass} ${userLocation ? activeBtnClass : inactiveBtnClass} ${isLocating ? 'cursor-wait' : ''}`}
            title={userLocation ? "Disattiva GPS" : "Attiva GPS"}
        >
            {isLocating ? <Loader2 className={`${iconSize} animate-spin text-amber-500`}/> : userLocation ? <MapPin className={`${iconSize} animate-pulse fill-current`}/> : <MapPin className={iconSize}/>}
        </button>
        
        <div id="tour-profile-btn" className="relative group hidden md:block">
            {user.role === 'guest' ? (
                <button onClick={() => openModal('auth')} className={`${squareBtnClass} ${inactiveBtnClass}`} title="Accedi"><LogIn className={iconSize} /></button>
            ) : (
                <button onClick={() => openModal('userDashboard', { tab: 'overview' })} className={`${squareBtnClass} bg-slate-800 border-slate-600 overflow-hidden hover:border-slate-400 transition-colors`} title="Profilo">
                    {user.avatar && !user.avatar.includes('ui-avatars') ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover"/> : <span className="text-sm font-bold text-white">{user.name.charAt(0)}</span>}
                </button>
            )}
            
            {unreadCount > 0 && (
                <div className="absolute -top-2 -right-2 min-w-[20px] h-[20px] bg-rose-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-slate-950 pointer-events-none animate-in zoom-in px-1 leading-none shadow-sm z-10">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </div>
            )}
        </div>
        
        <div className="relative shrink-0" ref={menuRef}>
            <button 
                id="tour-trigger-button" 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className={`
                    ${squareBtnClass} 
                    ${flashHelp 
                        ? 'bg-yellow-400 border-yellow-300 ring-4 ring-yellow-500/50 animate-pulse scale-110 shadow-[0_0_20px_rgba(250,204,21,0.6)] text-black' 
                        : 'border-transparent hover:bg-slate-800 hover:border-slate-700 text-slate-300'
                    } 
                    relative
                `}
            >
                {isMenuOpen ? <X className={iconSize} /> : <Menu className={iconSize} />}
                {isMobile && !isMenuOpen && unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-600 rounded-full border border-slate-900"></div>
                )}
            </button>

            {isMenuOpen && (
                <div className="absolute top-12 right-0 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 z-[5000]">
                    <nav className="flex flex-col p-2">
                        
                        <div className="md:hidden border-b border-slate-800 pb-2 mb-2">
                             <button 
                                onClick={handleProfileClick}
                                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors group"
                            >
                                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center overflow-hidden shrink-0 shadow-sm group-hover:border-indigo-400 transition-colors">
                                    {user.role === 'guest' ? (
                                        <LogIn className="w-4 h-4 text-slate-400"/>
                                    ) : user.avatar && !user.avatar.includes('ui-avatars') ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover"/>
                                    ) : (
                                        <span className="text-sm font-bold text-white">{user.name.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <span className={`text-sm font-bold block truncate ${user.role === 'guest' ? 'text-slate-300' : 'text-white'}`}>
                                        {user.role === 'guest' ? 'Accedi o Registrati' : user.name}
                                    </span>
                                    {user.role !== 'guest' && <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider group-hover:text-indigo-400 transition-colors">Vedi Profilo</span>}
                                </div>
                                {unreadCount > 0 && (
                                    <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        </div>
                        
                        {isAdmin && (
                            <button onClick={() => { onAdmin(); setIsMenuOpen(false); }} className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold flex items-center gap-3 group transition-colors text-left w-full mb-2 shadow-lg">
                                <Lock className="w-4 h-4" /> Pannello Admin
                            </button>
                        )}

                        <div className="border-b border-slate-800 pb-2 mb-2">
                            <button 
                                onClick={() => { handleRestartTour(); setIsMenuOpen(false); }} 
                                className="px-4 py-3 hover:bg-slate-800 rounded-lg text-sm text-indigo-400 font-bold flex items-center gap-3 w-full bg-slate-900 shadow-sm border border-slate-800"
                            >
                                <div className="w-5 h-5 flex items-center justify-center">{MASCOT_ICON}</div> 
                                Guida all'uso
                            </button>
                        </div>
                        
                        {STATIC_MENU_ITEMS.map((item, index) => (
                            item.divider ? <div key={`div-${index}`} className="h-px bg-slate-800 my-1"></div> : <button key={item.id} onClick={() => {onOpenStaticPage(item.id as any); setIsMenuOpen(false);}} className="px-4 py-3 hover:bg-slate-800 rounded-lg text-sm text-slate-300 flex items-center gap-3 group transition-colors text-left w-full">{/* @ts-ignore */}<item.Icon className="w-4 h-4 text-slate-500 group-hover:text-amber-500 transition-colors" /><span className="font-bold group-hover:text-white transition-colors">{item.label}</span></button>
                        ))}
                        
                        {user.role !== 'guest' && (
                             <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="md:hidden px-4 py-3 hover:bg-red-900/20 text-red-400 rounded-lg text-sm font-bold flex items-center gap-3 w-full mt-2 border-t border-slate-800">
                                <LogOut className="w-4 h-4"/> Esci
                             </button>
                        )}
                    </nav>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};
export default Header;
