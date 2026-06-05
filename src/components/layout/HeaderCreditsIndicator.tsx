import React, { useRef } from 'react';
import { Sparkles, Zap, Info } from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import { useUser } from '@/context/UserContext';
import { HeaderPopover, HeaderPopoverHandle } from '@/components/ui/header/HeaderPopover';

export const HeaderCreditsIndicator = () => {
    const { user, aiQuota } = useUser();
    const { openModal } = useModal();
    const popoverRef = useRef<HeaderPopoverHandle>(null);

    if (!user || user.role === 'guest') return null;

    // Calcolo totali granulari (Frontend-side aggregation fallback)
    const totalFlashRemaining = aiQuota?.flash_remaining ?? (
        (aiQuota?.subscription_flash_remaining || 0) + 
        (aiQuota?.extra_credit_packs_flash_remaining || 0) + 
        (aiQuota?.admin_bonus_flash_remaining || 0)
    );
    
    const totalProRemaining = aiQuota?.pro_remaining ?? (
        (aiQuota?.subscription_pro_remaining || 0) + 
        (aiQuota?.extra_credit_packs_pro_remaining || 0) + 
        (aiQuota?.admin_bonus_pro_remaining || 0)
    );

    const totalRemaining = aiQuota?.total_remaining ?? (totalFlashRemaining + totalProRemaining);
    const totalLimit = (aiQuota?.flash_limit || 0) + (aiQuota?.pro_limit || 0) || 1;
    const percent = Math.min(100, (totalRemaining / totalLimit) * 100);

    // Colori basati sulla policy
    let statusColor = "text-emerald-400 border-emerald-500/30 bg-emerald-950/20";
    let iconColor = "text-emerald-400";
    
    if (totalRemaining === 0) {
        statusColor = "text-rose-400 border-rose-500/30 bg-rose-950/30 animate-pulse";
        iconColor = "text-rose-400";
    } else if (percent <= 30) {
        statusColor = "text-amber-400 border-amber-500/30 bg-amber-950/20";
        iconColor = "text-amber-400";
    }

    return (
        <HeaderPopover
            ref={popoverRef}
            trigger={
                <div
                    className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl border transition-all hover:scale-105 active:scale-95 shadow-lg ${statusColor}`}
                >
                    <div className="flex items-center gap-1.5 pointer-events-none">
                        <Sparkles className={`w-3.5 h-3.5 ${iconColor}`} />
                        <span className="text-sm font-black leading-none">{totalRemaining}</span>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-70 mt-0.5 pointer-events-none">AI Credits</span>
                </div>
            }
            className="bg-gradient-to-b from-slate-900 to-slate-950 border border-white/5 rounded-[2.5rem] p-6 w-80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
            {/* Header Area */}
            <div className="flex items-center justify-between mb-5 px-1">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">MOTORE CREDITI AI</span>
                    </div>
                    <span className="text-[8px] font-bold text-indigo-400/60 uppercase mt-0.5 tracking-tight">
                        SINCRONIZZAZIONE IN TEMPO REALE
                    </span>
                </div>
                <div className="p-1.5 rounded-full bg-white/5 border border-white/5">
                    <div className="group relative cursor-help">
                        <Info className="w-3 h-3 text-slate-600" />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                {/* 1. Row: Abbonamento */}
                <div className="group flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/10">
                            <Zap className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">ABBONAMENTO</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] text-slate-500 uppercase font-black tracking-tighter">FLASH</span>
                            <span className="text-xs font-black text-white leading-none">{aiQuota?.subscription_flash_remaining ?? 0}</span>
                        </div>
                        <div className="w-px h-6 bg-white/5" />
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] text-slate-500 uppercase font-black tracking-tighter">PRO</span>
                            <span className="text-xs font-black text-white leading-none">{aiQuota?.subscription_pro_remaining ?? 0}</span>
                        </div>
                    </div>
                </div>

                {/* 2. Row: Extra */}
                <div className="group flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/10">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">EXTRA</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] text-slate-500 uppercase font-black tracking-tighter">FLASH</span>
                            <span className="text-xs font-black text-white leading-none">{aiQuota?.extra_credit_packs_flash_remaining ?? 0}</span>
                        </div>
                        <div className="w-px h-6 bg-white/5" />
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] text-slate-500 uppercase font-black tracking-tighter">PRO</span>
                            <span className="text-xs font-black text-white leading-none">{aiQuota?.extra_credit_packs_pro_remaining ?? 0}</span>
                        </div>
                    </div>
                </div>

                {/* 3. Row: Bonus Admin */}
                <div className="group flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/10">
                            <Info className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">BONUS</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] text-slate-500 uppercase font-black tracking-tighter">FLASH</span>
                            <span className="text-xs font-black text-white leading-none">{aiQuota?.admin_bonus_flash_remaining ?? 0}</span>
                        </div>
                        <div className="w-px h-6 bg-white/5" />
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] text-slate-500 uppercase font-black tracking-tighter">PRO</span>
                            <span className="text-xs font-black text-white leading-none">{aiQuota?.admin_bonus_pro_remaining ?? 0}</span>
                        </div>
                    </div>
                </div>

                {/* Hero Balance Section */}
                <div className="relative mt-6 p-5 bg-indigo-600/10 border border-indigo-500/20 rounded-[1.75rem] overflow-hidden group">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-700" />
                    
                    <span className="relative z-10 text-[9px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-4 block">SALDO DISPONIBILE</span>
                    
                    <div className="relative z-10 grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">TOTALE FLASH</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-white tracking-tighter">{totalFlashRemaining}</span>
                                <span className="text-[10px] font-bold text-indigo-400/40 uppercase">Cr</span>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">TOTALE PRO</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-white tracking-tighter">{totalProRemaining}</span>
                                <span className="text-[10px] font-bold text-emerald-400/40 uppercase">Cr</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <button 
                    onClick={(e) => { 
                        e.stopPropagation();
                        popoverRef.current?.close();
                        openModal('buyCredits'); 
                    }}
                    className="group relative w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-2xl transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-600/20"
                >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    RICARICA ORA
                </button>
            </div>
        </HeaderPopover>
    );
};
