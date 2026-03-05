
import React from 'react';
import { Info, Truck, CreditCard } from 'lucide-react';
import { ShopPartner } from '../../types/index';

interface ShopInfoProps {
    shop: ShopPartner;
}

export const ShopInfo: React.FC<ShopInfoProps> = ({ shop }) => {
    return (
        <div className="">
            <div className="mb-6">
                {/* STILE UNIFORMATO: SUB-HEADER */}
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1 flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-amber-500"/> Info & Servizi
                </h4>
                {/* STILE UNIFORMATO: MAIN-HEADER */}
                <h3 className="text-2xl md:text-3xl font-display font-bold text-amber-500 tracking-tight leading-none">
                    Politiche Professionali
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Truck className="w-4 h-4"/> Logistica & Consegne
                    </label>
                    <div className="w-full bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5 text-sm text-slate-300 leading-relaxed min-h-[100px]">
                        {shop.shippingInfo || "Nessuna informazione sulla spedizione specificata."}
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <CreditCard className="w-4 h-4"/> Pagamenti Accettati
                    </label>
                    <div className="w-full bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5 text-sm text-slate-300 leading-relaxed min-h-[100px]">
                            {shop.paymentInfo || "Nessuna informazione sui pagamenti specificata."}
                    </div>
                </div>
            </div>
        </div>
    );
};
