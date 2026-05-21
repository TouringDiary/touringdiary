import React, { useState, useEffect } from 'react';
import { getPricingVersions, FormattedPricingVersion } from '../../../services/dataService';
import { Loader2 } from 'lucide-react';
import { ModelAwareLimits } from '../../../services/subscriptionService';

const AiLimitsTab: React.FC = () => {
    const [pricingVersions, setPricingVersions] = useState<FormattedPricingVersion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadLimits = async () => {
            try {
                setIsLoading(true);
                const versions = await getPricingVersions();
                setPricingVersions(versions);
                setError(null);
            } catch (err) {
                console.error("AiLimitsTab load error:", err);
                setError("Impossibile caricare i limiti AI.");
            } finally {
                setIsLoading(false);
            }
        };

        loadLimits();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 p-6 text-center">{error}</div>;
    }

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg animate-in fade-in">
            <h2 className="text-2xl font-bold text-amber-400 mb-2">Configurazione Limiti AI (Sola Lettura)</h2>
            <p className="text-gray-400 mb-6">
                Mostra le quote AI incorporate in ogni piano tariffario attualmente attivo nel sistema tramite <code>pricing_versions</code>.
            </p>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-700/50">
                            <th className="p-3 border-b border-gray-600 text-gray-300 font-semibold">Nome Piano</th>
                            <th className="p-3 border-b border-gray-600 text-gray-300 font-semibold">Tipo</th>
                            <th className="p-3 border-b border-gray-600 text-gray-300 font-semibold">Durata</th>
                            <th className="p-3 border-b border-gray-600 text-amber-300 font-semibold">Flash / Mese</th>
                            <th className="p-3 border-b border-gray-600 text-indigo-300 font-semibold">Pro / Mese</th>
                            <th className="p-3 border-b border-gray-600 text-red-300 font-semibold">Daily Soft-Limit</th>
                            <th className="p-3 border-b border-gray-600 text-gray-300 font-semibold">Burst</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pricingVersions.map((version) => {
                            const limits = version.ai_limits as ModelAwareLimits | undefined;
                            
                            return (
                                <tr key={version.pricing_version_id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                    <td className="p-3 text-white font-medium">{version.plan_name}</td>
                                    <td className="p-3 text-gray-400 text-sm">{version.plan_type}</td>
                                    <td className="p-3 text-gray-400 text-sm">{version.duration_days} giorni</td>
                                    <td className="p-3 font-mono text-amber-400">
                                        {limits?.models?.flash ?? '0'}
                                    </td>
                                    <td className="p-3 font-mono text-indigo-400">
                                        {limits?.models?.pro ?? '0'}
                                    </td>
                                    <td className="p-3 font-mono text-red-400">
                                        {limits?.soft_daily_limit ?? '0'}
                                    </td>
                                    <td className="p-3 text-sm">
                                        {limits?.burst_allowed ? (
                                            <span className="bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded">Attivo</span>
                                        ) : (
                                            <span className="bg-red-900/50 text-red-400 px-2 py-1 rounded">Bloccato</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {pricingVersions.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-6 text-center text-gray-500">Nessun plan rilevato.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AiLimitsTab;
