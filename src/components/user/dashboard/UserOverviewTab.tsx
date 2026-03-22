
import React, { useRef, useState } from 'react';
import { Medal, Trophy, Map, ChevronRight, FileText, Utensils, Landmark, ShoppingBag, Monitor, Star, Shield, Lock, ArrowUp, Zap, Plus, Minus, Trash2 } from 'lucide-react';
import { User, Reward, RewardCategory } from '../../../types/index';
import { LevelInfo } from '../../../services/gamificationService';
import { DraggableSlider, DraggableSliderHandle } from '../../common/DraggableSlider';
import { getRoleLabel } from '../../../services/userService';
import { useUser } from '@/context/UserContext';
import { DeleteConfirmationModal } from '../../common/DeleteConfirmationModal';
import { useItinerary } from '@/context/ItineraryContext';

interface Props {
    user: User;
    currentLevel: LevelInfo;
    currentXP: number;
    progress: any;
    catalogRewards: Reward[];
    myRewards: any[];
    onClaimReward: (reward: Reward, isUnlocked: boolean) => void;
    savedProjects: any[];
    onLoadProject: (p: any) => void;
    suggestions: any[];
    onExpandSection: (sec: 'trips' | 'reports') => void;
    onClose: () => void;
}

const getCategoryTheme = (cat: RewardCategory) => {
    switch(cat) {
        case 'food': return { text: 'text-amber-500' };
        case 'culture': return { text: 'text-purple-500' };
        case 'shopping': return { text: 'text-emerald-500' };
        case 'tech': return { text: 'text-blue-500' };
        default: return { text: 'text-slate-500' };
    }
};

export const UserOverviewTab = ({ 
    user, currentLevel, currentXP, progress, catalogRewards, myRewards, onClaimReward,
    savedProjects, onLoadProject, suggestions, onExpandSection, onClose 
}: Props) => {
    
    const { setUser } = useUser();
    const { deleteProject } = useItinerary();
    
    // Sliders Refs
    const unlockedSliderRef = useRef<DraggableSliderHandle>(null);
    const lockedSliderRef = useRef<DraggableSliderHandle>(null);
    
    // Delete State
    const [projectToDelete, setProjectToDelete] = useState<{id: string, name: string} | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const displayName = user.name.replace(/\s*\(.*?\)\s*/g, '').trim();

    // SPLIT LOGIC
    const unlockedRewards = catalogRewards.filter(r => currentLevel.level >= r.requiredLevel);
    const lockedRewards = catalogRewards.filter(r => currentLevel.level < r.requiredLevel).sort((a,b) => a.requiredLevel - b.requiredLevel);

    const isAdminAll = user.role === 'admin_all';
    
    const handleDeleteClick = (e: React.MouseEvent, proj: any) => {
        e.stopPropagation();
        setProjectToDelete({ id: proj.id, name: proj.name });
    };
    
    const confirmDeleteProject = async () => {
        if (!projectToDelete) return;
        setIsDeleting(true);
        try {
            await deleteProject(projectToDelete.id);
            setProjectToDelete(null);
        } catch (e) {
            console.error("Delete failed", e);
        } finally {
            setIsDeleting(false);
        }
    };

    const renderRewardCard = (reward: Reward, isUnlocked: boolean) => {
        // Mappatura icone base per anteprima
        const Icons: any = { food: Utensils, culture: Landmark, shopping: ShoppingBag, tech: Monitor, general: Star };
        const Icon = Icons[reward.category] || Star;
        const theme = getCategoryTheme(reward.category);
        const isActiveInWallet = myRewards.some(r => r.rewardId === reward.id && r.status === 'active');

        return (
             <div 
                key={reward.id} 
                className={`
                    w-52 h-72 flex-shrink-0 rounded-xl border flex flex-col overflow-hidden relative transition-all duration-300 snap-center
                    ${isUnlocked 
                        ? `opacity-100 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-xl hover:-translate-y-1` 
                        : `opacity-100 bg-slate-950 border-slate-800 border-dashed`
                    }
                `}
            >
                <div className="p-4 flex justify-between items-start">
                    <div className={`p-2 rounded-lg bg-slate-800 ${isUnlocked ? theme.text : 'text-slate-400'}`}>
                        <Icon className="w-6 h-6"/>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wide border ${isUnlocked ? 'bg-emerald-900/20 text-emerald-500 border-emerald-500/30' : 'bg-slate-900 text-slate-500 border-slate-700'}`}>
                        LIVELLO {reward.requiredLevel}
                    </span>
                </div>
                <div className="px-4 flex-1">
                    <h4 className={`text-lg font-bold leading-tight mb-2 ${isUnlocked ? 'text-white' : 'text-slate-300'}`}>{reward.title}</h4>
                    <p className={`text-xs line-clamp-3 leading-relaxed ${isUnlocked ? 'text-slate-500' : 'text-slate-400'}`}>{reward.description}</p>
                </div>
                <div className="p-4 border-t border-slate-800/50 mt-auto">
                    <button 
                        onClick={() => onClaimReward(reward, isUnlocked)}
                        disabled={!isUnlocked}
                        className={`w-full py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${isUnlocked ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg' : 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'}`}
                    >
                        {isUnlocked ? (isActiveInWallet ? 'Nel Wallet' : 'Riscatta') : <><Lock className="w-3 h-3"/> Bloccato</>}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-10 relative">
            
            {/* DELETE MODAL */}
            <DeleteConfirmationModal
                isOpen={!!projectToDelete}
                onClose={() => setProjectToDelete(null)}
                onConfirm={confirmDeleteProject}
                title="Eliminare Viaggio?"
                message={`Vuoi davvero eliminare "${projectToDelete?.name}"? L'azione è irreversibile.`}
                isDeleting={isDeleting}
                variant="danger"
            />

            {/* 1. HEADER PROFILO & XP BAR */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-700 relative overflow-hidden shadow-xl">
                <div className="relative z-10 w-full">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-2xl font-bold text-white shadow-2xl border-4 border-slate-800 overflow-hidden">{user.avatar && !user.avatar.includes('ui-avatars') ? <img src={user.avatar} className="w-full h-full object-cover"/> : user.name.charAt(0)}</div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-slate-900 text-xl border-2 border-slate-700 rounded-full flex items-center justify-center shadow-lg">{currentLevel.icon}</div>
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-display font-bold text-white leading-tight">{displayName}</h2>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                     {/* BADGE RUOLO SISTEMA */}
                                     {user.role !== 'user' && (
                                         <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${user.role === 'admin_all' ? 'bg-purple-900/30 text-purple-300 border-purple-500/30' : 'bg-blue-900/30 text-blue-300 border-blue-500/30'}`}>
                                             <Shield className="w-3 h-3"/> {getRoleLabel(user.role)}
                                         </span>
                                     )}
                                     {/* BADGE LIVELLO GIOCO */}
                                     <div className="flex items-center gap-1 bg-slate-950/50 px-2 py-0.5 rounded border border-slate-600/50">
                                         <Medal className={`w-3 h-3 ${currentLevel.color}`}/>
                                         <span className="text-[9px] font-black text-slate-300 uppercase tracking-wide">{currentLevel.name} (Liv. {currentLevel.level})</span>
                                     </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Punteggio Totale</span>
                            <span className={`text-2xl font-black uppercase tracking-widest ${currentLevel.color} drop-shadow-md`}>{currentXP} XP</span>
                        </div>
                    </div>
                    <div className="mt-2">
                        <div className="relative h-5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-red-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: `${progress.progressPercent}%` }}></div>
                            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white drop-shadow-md z-10 tracking-widest uppercase">
                                {progress.nextLevel ? `${currentXP} / ${progress.nextLevel.minXp} XP` : `LIVELLO MASSIMO`}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. RICOMPENSE SBLOCCATE */}
            {unlockedRewards.length > 0 && (
                <div>
                     <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-4 flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5"/> Ricompense Sbloccate
                    </h3>
                    <DraggableSlider ref={unlockedSliderRef} className="pb-4 gap-4">
                        {unlockedRewards.map(reward => renderRewardCard(reward, true))}
                    </DraggableSlider>
                </div>
            )}

             {/* 3. RICOMPENSE DA SBLOCCARE (CON SEPARATORI) */}
             <div>
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5"/> Prossimi Obiettivi
                </h3>
                <DraggableSlider ref={lockedSliderRef} className="pb-4 gap-4">
                    {lockedRewards.map((reward, idx) => {
                        const prevReward = idx > 0 ? lockedRewards[idx - 1] : null;
                        const showSeparator = idx === 0 || (prevReward && prevReward.requiredLevel !== reward.requiredLevel);
                        
                        return (
                            <React.Fragment key={reward.id}>
                                {showSeparator && (
                                    <div className="flex flex-col justify-center items-center h-72 mx-2">
                                        <div className="h-full w-px bg-slate-800 border-l border-dashed border-slate-700/50 relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700 px-2 py-4 rounded-full flex flex-col items-center gap-1 shadow-lg z-10">
                                                <ArrowUp className="w-3 h-3 text-slate-500"/>
                                                <span className="text-[9px] font-black text-white uppercase vertical-rl" style={{writingMode: 'vertical-rl'}}>LIV {reward.requiredLevel}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {renderRewardCard(reward, false)}
                            </React.Fragment>
                        );
                    })}
                    {lockedRewards.length === 0 && <div className="text-slate-500 italic text-xs py-10 w-full text-center border-2 border-dashed border-slate-800 rounded-xl">Hai sbloccato tutto! Sei una leggenda.</div>}
                </DraggableSlider>
            </div>

            {/* ALTRE SEZIONI - I MIEI VIAGGI ESPANSO */}
            <div className="grid grid-cols-1 gap-6">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl overflow-hidden group relative">
                    <div className="flex justify-between items-center mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-900/20 rounded-lg text-indigo-400"><Map className="w-6 h-6"/></div>
                            <div>
                                <h3 className="text-xl font-bold text-white">I Miei Viaggi</h3>
                                <p className="text-slate-400 text-sm">{savedProjects.length} itinerari salvati</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* LISTA VIAGGI CON DELETE */}
                    <div className="space-y-3 relative z-10 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {savedProjects.length > 0 ? savedProjects.map(proj => (
                            <div key={proj.id} className="flex justify-between items-center p-4 bg-slate-950/50 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group/row" onClick={() => { onLoadProject(proj); onClose(); }}>
                                <div>
                                    <h4 className="font-bold text-white text-base group-hover/row:text-indigo-300 transition-colors">{proj.name || 'Senza Nome'}</h4>
                                    <div className="text-xs text-slate-500 mt-1">{new Date(proj.createdAt).toLocaleDateString()} • {proj.items?.length || 0} tappe</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={(e) => handleDeleteClick(e, proj)}
                                        className="p-2 text-slate-600 hover:text-red-500 hover:bg-slate-900 rounded-lg transition-colors opacity-0 group-hover/row:opacity-100"
                                        title="Elimina"
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover/row:text-white transition-colors"/>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-slate-500 italic text-sm">
                                Nessun viaggio salvato. Inizia a pianificare!
                            </div>
                        )}
                    </div>
                </div>
                
                <div onClick={() => onExpandSection('reports')} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><FileText className="w-24 h-24"/></div>
                    <h3 className="text-xl font-bold text-white mb-2 relative z-10">Le Mie Segnalazioni</h3>
                    <p className="text-slate-400 text-sm relative z-10 mb-4">{suggestions.length} contributi inviati alla community.</p>
                    <div className="flex items-center text-indigo-400 text-xs font-bold uppercase tracking-wider relative z-10 group-hover:translate-x-1 transition-transform">Visualizza stato <ChevronRight className="w-4 h-4"/></div>
                </div>
            </div>
        </div>
    );
};
