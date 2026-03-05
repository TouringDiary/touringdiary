
import React, { useState } from 'react';
import { History, Plus, Trash2 } from 'lucide-react';
import { PriceHistoryEntry, MarketingConfig } from '../../../types/index';

interface PriceHistoryTableProps {
    history: PriceHistoryEntry[];
    currentPrices: MarketingConfig;
    onAddEntry: (entry: PriceHistoryEntry) => void;
    onDeleteRequest: (id: string, label: string) => void; // MODIFICATO: Richiede conferma esterna
}

export const PriceHistoryTable = ({ history, currentPrices, onAddEntry, onDeleteRequest }: PriceHistoryTableProps) => {
    const [formOpen, setFormOpen] = useState(false);
    
    // Stato locale temporaneo per il form di archiviazione
    const [newEntry, setNewEntry] = useState<Partial<PriceHistoryEntry>>({
        periodLabel: '',
        validFrom: new Date().toISOString().split('T')[0],
        validTo: ''
    });

    const handleOpenForm = () => {
        let promoName = "Listino Standard";
        if (currentPrices.gold.promoActive) promoName = currentPrices.gold.promoLabel || "Promo Gold";

        // Pre-popola con i dati correnti
        setNewEntry({
            periodLabel: promoName,
            validFrom: new Date().toISOString().split('T')[0],
            validTo: '',
            silverPrice: currentPrices.silver.promoActive ? currentPrices.silver.promoPrice : currentPrices.silver.basePrice,
            goldPrice: currentPrices.gold.promoActive ? currentPrices.gold.promoPrice : currentPrices.gold.basePrice,
            shopPrice: currentPrices.shop.promoActive ? currentPrices.shop.promoPrice : currentPrices.shop.basePrice,
            guidePrice: currentPrices.guide.promoActive ? currentPrices.guide.promoPrice : currentPrices.guide.basePrice,
            promoName: currentPrices.gold.promoActive ? currentPrices.gold.promoLabel : undefined
        });
        setFormOpen(true);
    };

    const confirmAdd = () => {
        if (!newEntry.periodLabel || !newEntry.validFrom) {
            alert("Nome listino e Data Inizio sono obbligatori.");
            return;
        }

        const finalEntry: PriceHistoryEntry = {
            id: `hist_${Date.now()}`,
            archivedAt: new Date().toISOString(),
            periodLabel: newEntry.periodLabel,
            validFrom: newEntry.validFrom,
            validTo: newEntry.validTo || '',
            silverPrice: newEntry.silverPrice || 0,
            goldPrice: newEntry.goldPrice || 0,
            shopPrice: newEntry.shopPrice || 0,
            guidePrice: newEntry.guidePrice || 0,
            promoName: newEntry.promoName
        };

        onAddEntry(finalEntry);
        setFormOpen(false);
    };

    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl mt-8">
            <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 text-lg"><History className="w-5 h-5 text-slate-400"/> Storico Prezzi & Campagne</h3>
                <button onClick={handleOpenForm} className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold border border-slate-700 flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5"/> Archivia Listino Corrente
                </button>
            </div>

            {formOpen && (
                <div className="p-4 bg-indigo-900/20 border-b border-indigo-500/30 animate-in slide-in-from-top-2">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                         <div><label className="text-[9px] text-slate-400 uppercase font-bold">Etichetta Listino</label><input type="text" value={newEntry.periodLabel} onChange={e => setNewEntry({...newEntry, periodLabel: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"/></div>
                         <div><label className="text-[9px] text-slate-400 uppercase font-bold">Valido Dal</label><input type="date" value={newEntry.validFrom} onChange={e => setNewEntry({...newEntry, validFrom: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"/></div>
                         <div><label className="text-[9px] text-slate-400 uppercase font-bold">Valido Al (Opz)</label><input type="date" value={newEntry.validTo} onChange={e => setNewEntry({...newEntry, validTo: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs"/></div>
                         <div className="flex items-end gap-2">
                             <button onClick={() => setFormOpen(false)} className="flex-1 bg-slate-800 text-slate-400 hover:text-white py-2 rounded text-xs font-bold">Annulla</button>
                             <button onClick={confirmAdd} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-xs font-bold shadow-lg">Archivia</button>
                         </div>
                     </div>
                     <div className="flex gap-4 text-xs text-slate-500 font-mono bg-slate-900/50 p-2 rounded justify-between px-4">
                         <span>Snapshot:</span>
                         <span>Silver: €{newEntry.silverPrice}</span>
                         <span>Gold: €{newEntry.goldPrice}</span>
                         <span>Shop: €{newEntry.shopPrice}</span>
                         <span>Guide: €{newEntry.guidePrice}</span>
                     </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-slate-500 text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4 w-48">Campagna</th>
                            <th className="px-6 py-4">Validità</th>
                            <th className="px-6 py-4 text-center">Silver</th>
                            <th className="px-6 py-4 text-center">Gold</th>
                            <th className="px-6 py-4 text-center text-blue-400">Shop</th>
                            <th className="px-6 py-4 text-center text-indigo-400">Guide</th>
                            <th className="px-6 py-4 text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {history.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-8 text-slate-500 italic">Nessuno storico salvato.</td></tr>
                        ) : (
                            history.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white">{row.periodLabel}</div>
                                        {row.promoName && <div className="text-[10px] text-amber-500 uppercase tracking-wide font-black">{row.promoName}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                                        {row.validFrom} <span className="text-slate-600">➜</span> {row.validTo || '...'}
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-300">€{row.silverPrice}</td>
                                    <td className="px-6 py-4 text-center font-mono font-bold text-amber-500">€{row.goldPrice}</td>
                                    <td className="px-6 py-4 text-center font-mono font-bold text-blue-400">€{row.shopPrice}</td>
                                    <td className="px-6 py-4 text-center font-mono font-bold text-indigo-400">€{row.guidePrice}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => onDeleteRequest(row.id, row.periodLabel)} className="p-1.5 hover:bg-red-900/30 text-slate-500 hover:text-red-400 rounded transition-colors">
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
