
import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { User as UserType } from '../../types/index';
import { refreshUsersCache } from '../../services/userService';
import { getCurrentLevel } from '../../services/gamificationService';

interface RankingTabProps {
    user: UserType;
}

export const RankingTab = ({ user }: RankingTabProps) => {
    const [leaderboard, setLeaderboard] = useState<UserType[]>([]);
    const [userRank, setUserRank] = useState<number | null>(null);

    useEffect(() => {
        const load = async () => {
             const allUsers = await refreshUsersCache();
             const sorted = [...allUsers].sort((a, b) => (b.xp || 0) - (a.xp || 0));
             setLeaderboard(sorted);
             
             if (user && user.id) {
                 const rank = sorted.findIndex(u => u.id === user.id) + 1;
                 setUserRank(rank > 0 ? rank : null);
             }
        };
        load();
    }, [user]);

    return (
        <div className="max-w-4xl mx-auto pb-10 animate-in fade-in">
            {user && user.role !== 'guest' && userRank && (
                <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-6 rounded-2xl border border-indigo-500/30 shadow-2xl mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-800 border-4 border-indigo-500 flex items-center justify-center text-xl font-bold text-white shadow-lg relative">
                            {user.avatar && !user.avatar.includes('ui-avatars') ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" /> : user.name.charAt(0)}
                            <div className="absolute -bottom-2 -right-2 bg-indigo-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-slate-900">{getCurrentLevel(user.xp).level}</div>
                        </div>
                        <div><h3 className="text-xl font-bold text-white">La tua posizione</h3><p className="text-indigo-300 text-sm">Hai {user.xp || 0} XP • Livello {getCurrentLevel(user.xp).name}</p></div>
                    </div>
                    <div className="text-right"><span className="text-4xl font-display font-bold text-white">#{userRank}</span><span className="block text-xs text-indigo-300 uppercase font-bold tracking-widest">In Classifica</span></div>
                </div>
            )}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 bg-[#0f172a] flex justify-between items-center"><h3 className="font-bold text-white flex items-center gap-2 text-lg"><Trophy className="w-5 h-5 text-amber-500"/> Top Travelers</h3><div className="text-xs text-slate-500 font-mono">Aggiornato ora</div></div>
                <div className="divide-y divide-slate-800">
                    {leaderboard.map((u, index) => {
                        const isMe = user && u.id === user.id;
                        let rankColor = 'text-slate-400';
                        if (index === 0) rankColor = 'text-amber-500';
                        if (index === 1) rankColor = 'text-slate-300';
                        if (index === 2) rankColor = 'text-amber-700';
                        return (
                            <div key={u.id} className={`flex items-center justify-between p-4 ${isMe ? 'bg-indigo-900/10' : 'hover:bg-slate-800/30'} transition-colors`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 text-center font-black text-lg ${rankColor}`}>#{index + 1}</div>
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white border border-slate-700 overflow-hidden">{u.avatar && !u.avatar.includes('ui-avatars') ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.name.charAt(0)}</div>
                                    <div><div className={`font-bold text-sm ${isMe ? 'text-indigo-400' : 'text-white'}`}>{u.name} {isMe && '(Tu)'}</div><div className="text-[10px] text-slate-500">{getCurrentLevel(u.xp).name}</div></div>
                                </div>
                                <div className="font-mono font-bold text-emerald-400">{u.xp || 0} XP</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
