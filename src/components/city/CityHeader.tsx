
import React, { useState, useEffect } from 'react';
import { Globe, Info, Map, Building2, Calendar, Navigation, Briefcase, BookOpen, ScrollText, ShoppingCart, X, User, Compass, Bus, Share2 } from 'lucide-react';
import { CityDetails } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { useDynamicStyles } from '../../hooks/useDynamicStyles';
import { useShare } from '../../hooks/useShare';

interface Props {
  city: CityDetails;
  onOpenInfo: (tab: 'guides' | 'services' | 'events' | 'tour_operators') => void;
  onOpenPatron: () => void;
  onOpenSurroundings: () => void;
  onOpenCulture: () => void;
  onOpenShop: () => void;
  onOpenSponsor: (tier?: 'gold' | 'silver') => void;
  onOpenHistory?: () => void;
  onToggleLocation?: () => void;
  isLocationActive?: boolean;
}

export const CityHeader = ({ city, onOpenInfo, onOpenPatron, onOpenSurroundings, onOpenCulture, onOpenShop, onOpenSponsor, onOpenHistory, onToggleLocation, isLocationActive = false }: Props) => {
  const { details } = city;
  const { share } = useShare();

  // Rilevamento Mobile per stili dinamici
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Hook Stili Dinamici dal DB
  const titleStyle = useDynamicStyles('city_header_title', isMobile);

  const handleShare = () => {
      share({
          title: city.name,
          text: `Sto esplorando ${city.name} su Touring Diary! ${city.description}`,
          params: { city: city.id }
      });
  };

  return (
    <div className="relative w-full h-[18.5rem] md:h-[19rem] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 transition-all group/header">
      
      {/* CSS Animation Keyframes for Metal Shine */}
      <style>{`
          @keyframes metal-shine {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
          }
          .animate-metal {
              background: linear-gradient(270deg, #cbd5e1, #e2e8f0, #fcd34d, #f59e0b, #e2e8f0, #cbd5e1);
              background-size: 400% 400%;
              animation: metal-shine 6s ease infinite;
          }
      `}</style>
      
      {/* --- DESKTOP LEFT PANEL (INFO) --- */}
      <div className="hidden md:flex absolute left-0 top-0 bottom-0 w-[221px] bg-[#020617] py-6 px-2 flex-col justify-center gap-4 border-r border-slate-800 z-20">
        <div className="flex flex-col items-center justify-center w-full">
            <div className="flex items-center gap-2 mb-1 justify-center w-full px-2">
                {/* DYNAMIC TITLE STYLE APPLIED HERE */}
                <h1 className={`${titleStyle || 'text-4xl font-bold font-display text-white'} text-center break-words max-w-full leading-none`}>
                    {city.name}
                </h1>
            </div>
            <div className="flex h-1 w-8 shadow-sm rounded-sm overflow-hidden flex-shrink-0 border border-white/10 mb-2">
                <div className="h-full w-1/3 bg-[#009246]"></div>
                <div className="h-full w-1/3 bg-[#ffffff]"></div>
                <div className="h-full w-1/3 bg-[#ce2b37]"></div>
            </div>
            <p className="text-slate-500 font-serif italic text-xs text-center line-clamp-2 px-1 leading-tight mb-2">{details.subtitle}</p>
            {onOpenHistory && (
                <button onClick={onOpenHistory} className="flex items-center gap-1.5 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-amber-900/50 px-3 py-0.5 rounded-full transition-all group w-auto justify-center">
                    <ScrollText className="w-3 h-3 text-amber-600 group-hover:text-amber-500 transition-colors"/>
                    <span className="text-[9px] font-bold uppercase text-slate-400 group-hover:text-white tracking-wide">Storia & Origini</span>
                </button>
            )}
        </div>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent flex-shrink-0"></div>
        <div className="flex flex-col items-center justify-center w-full gap-1">
            {details.officialWebsite && (
                <a href={details.officialWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group hover:bg-slate-900/30 px-2 py-0.5 rounded transition-colors" title="Vai al sito ufficiale">
                    <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-indigo-500/50 transition-all flex-shrink-0">
                        <Globe className="w-3 h-3 text-indigo-400 group-hover:text-white transition-colors"/>
                    </div>
                    <span className="text-[9px] font-bold uppercase text-slate-400 group-hover:text-white tracking-wide truncate max-w-[150px]">SITO UFFICIALE</span>
                </a>
            )}
            <div className="flex items-center gap-2 mt-1 cursor-pointer" onClick={onOpenPatron}>
                 <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-amber-500/50 transition-all flex-shrink-0"><Info className="w-3 h-3 text-amber-400"/></div>
                 <span className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">SANTO PATRONO</span>
            </div>
            <button onClick={onOpenPatron} className="text-center text-xl font-handwriting font-bold text-amber-500 hover:text-white transition-colors truncate max-w-full px-2 leading-none">{details.patron || 'Patrono N/A'}</button>
        </div>
      </div>

      {/* --- BACKGROUND IMAGE --- */}
      <div className="absolute inset-0 md:left-[221px] z-0">
         <ImageWithFallback 
            src={details.heroImage} 
            alt={city.name} 
            priority={true} 
            className="w-full h-full object-cover transition-transform duration-[30s] group-hover/header:scale-105"
        />
         <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90 md:opacity-100"></div>
      </div>

      {/* --- MOBILE TEXT OVERLAY --- */}
      <div className="md:hidden absolute inset-0 z-10 p-5 pt-8 pointer-events-none flex flex-col justify-between">
          
          <div className="shrink-0 mt-6">
              {/* DYNAMIC TITLE STYLE APPLIED HERE TOO (Mobile version automatically handled by hook) */}
              <h1 className={`${titleStyle || 'text-[26px] font-bold font-display text-white'} leading-none drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] shadow-black`} style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}>
                  {city.name}
              </h1>
              <div className="h-0.5 w-10 bg-gradient-to-r from-green-500 via-white to-red-500 my-2 shadow-lg"></div>
              {/* Slightly smaller subtitle */}
              <p className="text-slate-100 font-serif italic text-[11px] line-clamp-2 max-w-[75%] mb-4 leading-snug drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" style={{ textShadow: '1px 1px 2px rgba(0,0,0,1)' }}>{details.subtitle}</p>
          </div>
          
      </div>

      {/* --- MOBILE TOP RIGHT CLUSTER --- */}
      <div className="md:hidden absolute top-4 right-4 z-30 flex flex-col items-end gap-3 pointer-events-auto">
          <div className="flex items-center gap-2">
              <button onClick={handleShare} className="bg-slate-800/80 p-2 rounded-xl border border-white/10 shadow-2xl text-white active:scale-90 transition-transform backdrop-blur-md">
                  <Share2 className="w-4 h-4"/>
              </button>
              <button onClick={onOpenShop} className="bg-indigo-600 p-2 rounded-xl border border-indigo-400/30 shadow-2xl text-white active:scale-90 transition-transform">
                  <ShoppingCart className="w-4 h-4"/>
              </button>
              <button onClick={onOpenCulture} className="bg-emerald-600 p-2 rounded-xl border border-emerald-400/30 shadow-2xl text-white active:scale-90 transition-transform">
                  <BookOpen className="w-4 h-4"/>
              </button>
          </div>
      </div>

      {/* --- MOBILE BOTTOM ACTIONS ROW --- */}
      <div className="md:hidden absolute bottom-[5.5rem] left-0 right-0 px-2 z-30 pointer-events-auto flex justify-between items-center">
            {/* WEBSITE LINK LEFT ALIGNED */}
            {details.officialWebsite && (
                  <a href={details.officialWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 transition-all active:scale-95 shadow-lg">
                      <Globe className="w-3 h-3 text-indigo-400"/>
                      <span className="text-[9px] font-black text-white uppercase tracking-widest">Sito Web</span>
                  </a>
            )}

            {/* HISTORY RIGHT ALIGNED */}
            {onOpenHistory && (
                 <button onClick={onOpenHistory} className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-500/30 transition-all active:scale-95 shadow-xl ml-auto">
                     <span className="text-[9px] font-black text-white uppercase tracking-widest">Storia & Origini</span>
                     <ScrollText className="w-3.5 h-3.5 text-amber-500"/>
                </button>
            )}
      </div>

      {/* --- DESKTOP ACTION BAR --- */}
      <div className="hidden md:flex absolute top-4 left-[calc(221px+1rem)] right-4 z-30 pointer-events-none justify-between items-start">
          <div className="flex gap-2 pointer-events-auto">
              <button onClick={onOpenShop} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl border border-indigo-400/50 shadow-2xl flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-95 group">
                    <ShoppingCart className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform"/>
                    <span className="text-xs font-black uppercase tracking-wider">SHOPPING</span>
              </button>
              <button onClick={handleShare} className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-xl border border-slate-600 shadow-xl flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-95">
                    <Share2 className="w-4 h-4"/>
                    <span className="text-xs font-black uppercase tracking-wider">Condividi</span>
              </button>
          </div>
          
          <button 
                onClick={() => onOpenSponsor('gold')} 
                className="pointer-events-auto animate-metal hover:brightness-110 text-slate-900 font-black px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 text-xs uppercase tracking-widest flex items-center gap-2 transform hover:-translate-y-0.5 transition-all active:scale-95 border border-white/50"
          >
              <Briefcase className="w-4 h-4"/> SPONSOR
          </button>
      </div>

      {/* --- MOBILE SECONDARY NAV PILL (COMPACTED 100% WIDTH) --- */}
      <div className="md:hidden absolute bottom-4 left-2 right-2 z-30 pointer-events-auto">
          <div className="bg-slate-950/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/50 shadow-2xl grid grid-cols-5 gap-1 w-full">
              {[
                  { id: 'tour_operators', label: 'Tour Op.', icon: Bus, action: () => onOpenInfo('tour_operators') },
                  { id: 'guides', label: 'Guide', icon: User, action: () => onOpenInfo('guides') },
                  { id: 'services', label: 'Servizi', icon: Building2, action: () => onOpenInfo('services') },
                  { id: 'events', label: 'Eventi', icon: Calendar, action: () => onOpenInfo('events') },
                  { id: 'surroundings', label: 'Dintorni', icon: Compass, action: onOpenSurroundings },
              ].map((btn, idx) => (
                  <button 
                      key={btn.id}
                      onClick={btn.action} 
                      className="flex flex-col items-center justify-center gap-0.5 active:scale-95 transform text-slate-300 active:text-amber-400 transition-colors w-full h-full py-1"
                  >
                      <btn.icon className="w-5 h-5"/>
                      <span className="text-[7px] font-black uppercase tracking-tight truncate w-full text-center leading-none mt-0.5">{btn.label}</span>
                  </button>
              ))}
          </div>
      </div>

      {/* --- DESKTOP SECONDARY NAV --- */}
      <div className="hidden md:flex absolute bottom-4 left-[calc(221px+1rem)] z-30 pointer-events-none">
          <button onClick={onOpenCulture} className="pointer-events-auto bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl border border-emerald-400/50 shadow-2xl flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-95 group">
              <BookOpen className="w-4 h-4 text-white group-hover:scale-110 transition-transform"/>
              <span className="text-xs font-black uppercase tracking-wider">Angolo Cultura</span>
          </button>
      </div>
      <div className="hidden md:flex absolute bottom-4 right-4 z-30 pointer-events-auto">
          <div className="bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/50 shadow-2xl">
              <div className="flex items-center gap-0.5">
                  {[
                      { id: 'tour_operators', label: 'Tour Operator', icon: Bus, action: () => onOpenInfo('tour_operators') },
                      { id: 'guides', label: 'Guide Turistiche', icon: User, action: () => onOpenInfo('guides') },
                      { id: 'services', label: 'Servizi', icon: Building2, action: () => onOpenInfo('services') },
                      { id: 'events', label: 'Eventi', icon: Calendar, action: () => onOpenInfo('events') },
                      { id: 'surroundings', label: 'Dintorni', icon: Compass, action: onOpenSurroundings },
                  ].map((btn, idx, arr) => (
                      <React.Fragment key={btn.id}>
                        <button onClick={btn.action} className="px-3 py-2 rounded hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 transition-all group/btn shrink-0">
                            <btn.icon className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-amber-400 transition-colors"/>
                            <span className="text-[10px] font-bold uppercase tracking-wide">{btn.label}</span>
                        </button>
                        {idx < arr.length - 1 && <div className="w-px h-4 bg-slate-800 shrink-0 mx-0.5"></div>}
                      </React.Fragment>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};
