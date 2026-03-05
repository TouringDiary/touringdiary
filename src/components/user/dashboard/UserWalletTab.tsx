
import React, { useState } from 'react';
import { Wallet, Ticket, X, QrCode, CheckCircle, ScanLine, Utensils, Landmark, ShoppingBag, Monitor, Star } from 'lucide-react';
import { UserReward, RewardCategory } from '../../../services/gamificationService';

interface Props {
    rewards: UserReward[];
    onMarkUsed: (instanceId: string) => void;
}

const getCategoryTheme = (cat: string) => {
    switch(cat) {
        case 'food': return { bg: 'bg-amber-600', text: 'text-amber-500', border: 'border-amber-500', icon: Utensils, label: 'Cibo', modalHeader: 'bg-amber-600' };
        case 'culture': return { bg: 'bg-purple-600', text: 'text-purple-500', border: 'border-purple-500', icon: Landmark, label: 'Cultura', modalHeader: 'bg-purple-600' };
        case 'shopping': return { bg: 'bg-emerald-600', text: 'text-emerald-500', border: 'border-emerald-500', icon: ShoppingBag, label: 'Shopping', modalHeader: 'bg-emerald-600' };
        case 'tech': return { bg: 'bg-blue-600', text: 'text-blue-500', border: 'border-blue-500', icon: Monitor, label: 'Digitale', modalHeader: 'bg-blue-600' };
        default: return { bg: 'bg-slate-600', text: 'text-slate-500', border: 'border-slate-500', icon: Star, label: 'Generale', modalHeader: 'bg-slate-600' };
    }
};

export const UserWalletTab = ({ rewards, onMarkUsed }: Props) => {
    const [filter, setFilter] = useState<'all' | RewardCategory>('all');
    const [activeCoupon, setActiveCoupon] = useState<UserReward | null>(null);

    const filteredRewards = filter === 'all' ? rewards : rewards.filter(r => r.category === filter);

    const handleUseCoupon = () => {
        if (activeCoupon) {
            onMarkUsed(activeCoupon.instanceId);
            setActiveCoupon(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 h-full flex flex-col">
            
            {/* QR MODAL */}
            {activeCoupon && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setActiveCoupon(null)}></div>
                    <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
                        <div className={`p-8 relative overflow-hidden ${getCategoryTheme(activeCoupon.category || 'general').modalHeader}`}>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                            <div className="absolute top-4 right-4 p-2 bg-white/20 rounded-full" onClick={() => setActiveCoupon(null)}>
                                <X className="w-5 h-5 text-white cursor-pointer"/>
                            </div>
                            <div className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 border border-white/20 shadow-lg">
                                <Ticket className="w-8 h-8 text-white"/>
                            </div>
                            <h3 className="text-3xl font-display font-black text-white leading-none mb-1">{activeCoupon.title}</h3>
                            <p className="text-white/80 font-medium text-sm">Mostra questo codice alla cassa</p>
                        </div>
                        <div className="p-8 flex flex-col items-center text-center bg-white flex-1">
                            <div className="w-full aspect-square bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center mb-6 relative">
                                <QrCode className="w-32 h-32 text-slate-900"/>
                                <div className="absolute bottom-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scan Me</div>
                            </div>
                            <div className="text-4xl font-mono font-black text-slate-900 tracking-wider mb-2">{activeCoupon.code}</div>
                            <p className="text-xs text-slate-400 font-bold uppercase mb-8">Valido fino al: 31/12/2025</p>
                            <button onClick={handleUseCoupon} className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 text-sm uppercase tracking-widest">
                                Segna come Utilizzato
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2"><Wallet className="w-6 h-6 text-indigo-500"/> Il mio Wallet</h3>
                    <p className="text-slate-400 text-sm">I tuoi coupon sbloccati.</p>
                </div>
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${filter === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Tutti</button>
                    <button onClick={() => setFilter('food')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${filter === 'food' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Cibo</button>
                    <button onClick={() => setFilter('culture')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${filter === 'culture' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Cultura</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-4 custom-scrollbar">
                {filteredRewards.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
                        <Ticket className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                        <p className="text-lg">Il tuo portafoglio è vuoto.</p>
                    </div> 
                ) : (
                    filteredRewards.map(reward => { 
                        const theme = getCategoryTheme(reward.category || 'general');
                        return (
                            <div key={reward.instanceId} className={`relative h-40 bg-[#020617] rounded-xl flex overflow-hidden border border-slate-800 group hover:border-slate-600 transition-all ${reward.status === 'used' ? 'opacity-60 grayscale' : ''}`}>
                                <div className="flex-1 p-4 relative flex flex-col justify-between z-10 border-r-2 border-dashed border-slate-800">
                                    <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#020617] rounded-full border border-slate-800 z-20"></div>
                                    <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#020617] rounded-full border border-slate-800 z-20"></div>
                                    
                                    <div className="flex justify-between items-start">
                                        <div className={`p-2 rounded-lg ${theme.bg} bg-opacity-20`}>
                                            <theme.icon className={`w-5 h-5 ${theme.text}`}/>
                                        </div>
                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${reward.status === 'active' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                                            {reward.status === 'active' ? 'ATTIVO' : 'USATO'}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-sm leading-tight mb-1 line-clamp-2">{reward.title}</h4>
                                        <p className="text-[10px] text-slate-500 font-mono">{new Date(reward.dateClaimed).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="w-14 bg-slate-950 flex flex-col items-center justify-center relative cursor-pointer hover:bg-slate-900 transition-colors" onClick={() => setActiveCoupon(reward)}>
                                    {reward.status === 'active' ? (
                                        <div className="transform -rotate-90 whitespace-nowrap"><span className={`text-[10px] font-black uppercase tracking-widest ${theme.text}`}>MOSTRA</span></div>
                                    ) : (
                                        <CheckCircle className="w-6 h-6 text-slate-700"/>
                                    )}
                                    {reward.status === 'active' && <ScanLine className="w-5 h-5 text-white absolute bottom-3 animate-pulse"/>}
                                </div>
                            </div>
                        ); 
                    })
                )}
            </div>
        </div>
    );
};
