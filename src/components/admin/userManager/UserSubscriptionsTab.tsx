import type { User } from '@/types/users';
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getSubscriptionsWithPlans, SubscriptionJoined } from '../../../services/marketingService';

export const UserSubscriptionsTab = () => {
    const [subscriptions, setSubscriptions] = useState<SubscriptionJoined[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSubs = async () => {
            setIsLoading(true);
            try {
                const data = await getSubscriptionsWithPlans();
                setSubscriptions(data);
            } catch (err) {
                console.error("Error fetching subscriptions:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubs();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg h-full overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">Abbonamenti Attivi e Storici</h3>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm text-slate-300">
                    <thead>
                        <tr className="bg-slate-800/50">
                            <th className="p-3 border-b border-slate-700">User ID</th>
                            <th className="p-3 border-b border-slate-700">Plan Name</th>
                            <th className="p-3 border-b border-slate-700">Start Date</th>
                            <th className="p-3 border-b border-slate-700">End Date</th>
                            <th className="p-3 border-b border-slate-700">Price Paid</th>
                            <th className="p-3 border-b border-slate-700">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subscriptions.map(sub => {
                            const planName = sub.pricing_versions?.plans?.name ?? '—';

                            return (
                                <tr key={sub.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                                    <td className="p-3 font-mono text-xs text-slate-500">{sub.user_id?.substring(0, 8) || 'Sponsor'}</td>
                                    <td className="p-3 font-bold text-white">{planName}</td>
                                    <td className="p-3">{new Date(sub.start_date).toLocaleDateString()}</td>
                                    <td className="p-3">{new Date(sub.end_date).toLocaleDateString()}</td>
                                    <td className="p-3 text-emerald-400 font-mono">{sub.price_paid} {sub.currency_paid}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${sub.status === 'ACTIVE' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                            {sub.status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {subscriptions.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-6 text-center text-slate-500">Nessun abbonamento trovato.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
