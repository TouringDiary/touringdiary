import React, { useRef } from 'react';
import { Medal, Trophy, ChevronRight, FileText, Utensils, Landmark, ShoppingBag, Monitor, Star, Shield, Lock, ArrowUp } from 'lucide-react';
import { User, Reward, RewardCategory, SuggestionRequest } from '../../../types/index';
import { LevelInfo } from '../../../services/gamificationService';
import { DraggableSlider, DraggableSliderHandle } from '../../common/DraggableSlider';
import { getRoleLabel } from '../../../services/userService';
import { safeArray } from '../../../utils/safeTypes';
import { UserAvatar } from '@/components/user/profile/UserAvatar';
import { WorkspaceQuickAccess } from '@/components/collaboration/workspace/WorkspaceQuickAccess';
import { useAreRewardsEnabled } from '@/hooks/useAreRewardsEnabled';
import { RewardsFreezeNotice } from '@/components/gamification/RewardsFreezeNotice';

interface Props {
    user: User;
    currentLevel: LevelInfo;
    currentXP: number;
    progress: any;
    catalogRewards: Reward[];
    myRewards: any[];
    onClaimReward: (reward: Reward, isUnlocked: boolean) => void;
    suggestions: SuggestionRequest[];
    onClose: () => void;
}

const getCategoryTheme = (cat: RewardCategory) => {
    switch (cat) {
        case 'food': return { text: 'text-amber-500' };
        case 'culture': return { text: 'text-purple-500' };
        case 'shopping': return { text: 'text-emerald-500' };
        case 'tech': return { text: 'text-blue-500' };
        default: return { text: 'text-slate-500' };
    }
};

export const UserOverviewTab = ({
    user, currentLevel, currentXP, progress, catalogRewards, myRewards, onClaimReward, suggestions
}: Props) => {
    const unlockedSliderRef = useRef<DraggableSliderHandle>(null);
    const lockedSliderRef = useRef<DraggableSliderHandle>(null);
    const rewardsEnabled = useAreRewardsEnabled();

    const displayName = user.name.replace(/\s*\(.*?\)\s*/g, '').trim();

    // upcomingRewards: non riscattabili ora (livello insufficiente OPPURE freeze globale premi)
    const unlockedRewards = rewardsEnabled
        ? catalogRewards.filter(r => currentLevel.level >= r.requiredLevel)
        : [];
    const upcomingRewards = rewardsEnabled
        ? catalogRewards.filter(r => currentLevel.level < r.requiredLevel).sort((a, b) => a.requiredLevel - b.requiredLevel)
        : [...catalogRewards].sort((a, b) => a.requiredLevel - b.requiredLevel);

    const renderRewardCard = (reward: Reward, isUnlocked: boolean) => {
        const Icons: any = { food: Utensils, culture: Landmark, shopping: ShoppingBag, tech: Monitor, general: Star };
        const Icon = Icons[reward.category] || Star;
        const theme = getCategoryTheme(reward.category);
        const isActiveInWallet = myRewards.some(r => r.rewardId === reward.id && r.status === 'active');
        const canClaim = rewardsEnabled && isUnlocked;

        return (
            <div
                key={reward.id}
                className={`
                    w-52 h-72 flex-shrink-0 rounded-xl border flex flex-col overflow-hidden relative transition-all duration-300 snap-center
                    ${canClaim
                        ? `opacity-100 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-xl hover:-translate-y-1`
                        : `opacity-100 bg-slate-950 border-slate-800 border-dashed`
                    }
                `}
            >
                <div className="p-4 flex justify-between items-start">
                    <div className={`p-2 rounded-lg bg-slate-800 ${canClaim ? theme.text : 'text-slate-400'}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wide border ${canClaim ? 'bg-emerald-900/20 text-emerald-500 border-emerald-500/30' : 'bg-slate-900 text-slate-500 border-slate-700'}`}>
                        LIVELLO {reward.requiredLevel}
                    </span>
                </div>
                <div className="px-4 flex-1">
                    <h4 className={`text-lg font-bold leading-tight mb-2 ${canClaim ? 'text-white' : 'text-slate-300'}`}>{reward.title}</h4>
                    <p className={`text-xs line-clamp-3 leading-relaxed ${canClaim ? 'text-slate-500' : 'text-slate-400'}`}>{reward.description}</p>
                </div>
                <div className="p-4 border-t border-slate-800/50 mt-auto">
                    {rewardsEnabled ? (
                        <button
                            onClick={() => onClaimReward(reward, isUnlocked)}
                            disabled={!canClaim}
                            className={`w-full py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${canClaim ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg' : 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'}`}
                        >
                            {canClaim ? (isActiveInWallet ? 'Nel Wallet' : 'Riscatta') : <><Lock className="w-3 h-3" /> Bloccato</>}
                        </button>
                    ) : (
                        <div className="w-full py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 bg-slate-900 text-slate-500 border border-slate-800">
                            <Lock className="w-3 h-3" /> Prossimamente
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-10 relative">

            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-700 relative overflow-hidden shadow-xl">
                <div className="relative z-floating-panel w-full">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <UserAvatar name={user.name} avatarUrl={user.avatar} size="lg" className="border-4 border-slate-800 shadow-2xl" />
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-slate-900 text-xl border-2 border-slate-700 rounded-full flex items-center justify-center shadow-lg">{currentLevel.icon}</div>
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-display font-bold text-white leading-tight">{displayName}</h2>
                                {user.slug && (
                                    <p className="text-sm text-slate-400 mt-1">@{user.slug}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {user.role !== 'user' && (
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${user.role === 'admin_all' ? 'bg-purple-900/30 text-purple-300 border-purple-500/30' : 'bg-blue-900/30 text-blue-300 border-blue-500/30'}`}>
                                            <Shield className="w-3 h-3" /> {getRoleLabel(user.role)}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1 bg-slate-950/50 px-2 py-0.5 rounded border border-slate-600/50">
                                        <Medal className={`w-3 h-3 ${currentLevel.color}`} />
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
                            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white drop-shadow-md z-floating-panel tracking-widest uppercase">
                                {progress.nextLevel ? `${currentXP} / ${progress.nextLevel.minXp} XP` : `LIVELLO MASSIMO`}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <WorkspaceQuickAccess className="px-1" />

            {!rewardsEnabled && (
                <RewardsFreezeNotice variant="banner" />
            )}

            {rewardsEnabled && unlockedRewards.length > 0 && (
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-4 flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5" /> Ricompense Sbloccate
                    </h3>
                    <DraggableSlider ref={unlockedSliderRef} className="pb-4 gap-4">
                        {unlockedRewards.map(reward => renderRewardCard(reward, true))}
                    </DraggableSlider>
                </div>
            )}

            <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" /> {rewardsEnabled ? 'Prossimi Obiettivi' : 'Premi in arrivo'}
                </h3>
                <DraggableSlider ref={lockedSliderRef} className="pb-4 gap-4">
                    {upcomingRewards.map((reward, idx) => {
                        const prevReward = idx > 0 ? upcomingRewards[idx - 1] : null;
                        const showSeparator = idx === 0 || (prevReward && prevReward.requiredLevel !== reward.requiredLevel);

                        return (
                            <React.Fragment key={reward.id}>
                                {showSeparator && (
                                    <div className="flex flex-col justify-center items-center h-72 mx-2">
                                        <div className="h-full w-px bg-slate-800 border-l border-dashed border-slate-700/50 relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700 px-2 py-4 rounded-full flex flex-col items-center gap-1 shadow-lg z-floating-panel">
                                                <ArrowUp className="w-3 h-3 text-slate-500" />
                                                <span className="text-[9px] font-black text-white uppercase vertical-rl" style={{ writingMode: 'vertical-rl' }}>LIV {reward.requiredLevel}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {renderRewardCard(reward, false)}
                            </React.Fragment>
                        );
                    })}
                    {upcomingRewards.length === 0 && rewardsEnabled && (
                        <div className="text-slate-500 italic text-xs py-10 w-full text-center border-2 border-dashed border-slate-800 rounded-xl">Hai sbloccato tutto! Sei una leggenda.</div>
                    )}
                </DraggableSlider>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><FileText className="w-24 h-24" /></div>
                <h3 className="text-xl font-bold text-white mb-2 relative z-floating-panel">Le Mie Segnalazioni</h3>
                <p className="text-slate-400 text-sm relative z-floating-panel mb-4">{safeArray<SuggestionRequest>(suggestions).length} contributi inviati alla community.</p>
                <div className="flex items-center text-indigo-400 text-xs font-bold uppercase tracking-wider relative z-floating-panel">Grazie per il tuo contributo <ChevronRight className="w-4 h-4" /></div>
            </div>
        </div>
    );
};
