import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Zap, ShieldCheck, ArrowRight, Loader2, Info } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';


interface Package {
    id: string;
    name: string;
    description: string;
    flash_credits: number;
    pro_credits: number;
    price_eur: number;
    original_price_eur?: number; // Supporto per campagne future
    discount_badge?: string;     // Supporto per campagne future
    is_recommended: boolean;
}

interface BuyCreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({ isOpen, onClose }) => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasingId, setPurchasingId] = useState<string | null>(null);
    const firstButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const lastActiveElement = document.activeElement as HTMLElement;

        const timer = setTimeout(() => {
            firstButtonRef.current?.focus();
        }, 100);

        return () => {
            lastActiveElement?.focus();
            clearTimeout(timer);
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const fetchPackages = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('extra_credit_packages')
                    .select('*')
                    .eq('is_active', true)
                    .order('sort_order', { ascending: true });
                
                if (error) throw error;
                setPackages(data || []);
            } catch (err) {
                console.error("Failed to fetch packages:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();
    }, [isOpen]);

    // ESC Key Management
    useGlobalModalEscape(isOpen, onClose);

    const handleBuy = async (pkg: Package) => {
        setPurchasingId(pkg.id);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/purchase-extra-credits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ packageId: pkg.id })
            });

            const result = await response.json();
            if (result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else {
                throw new Error(result.error || 'Failed to create checkout session');
            }
        } catch (err: any) {
            console.error("Purchase error:", err);
            alert(err.message === 'LOCAL_MODE_DISABLED_FOR_PUBLIC' 
                ? "Simulazione acquisto disabilitata per utenti non admin." 
                : "Errore durante l'avvio dell'acquisto. Riprova più tardi.");
        } finally {
            setPurchasingId(null);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div 
            className="td-modal-overlay pointer-events-auto flex items-center justify-center p-0 md:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300"
            style={{ zIndex: Z_OVERLAY }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div 
                className="relative bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
                style={{ zIndex: Z_MODAL }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button Standard */}
                <CloseButton onClose={onClose} variant="primary" position="absolute" className="top-6 right-6" />

                {/* Header */}
                <div className="p-6 md:px-10 md:py-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-900/10 to-slate-900 relative">
                    <div className="z-floating-panel">
                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            <Sparkles className="w-8 h-8 text-indigo-400" />
                            Ricarica Crediti AI
                        </h2>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    {/* Legenda */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl flex gap-3 items-center">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <Zap className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                                <span className="font-black text-blue-400 text-[10px] uppercase tracking-widest block leading-none">Flash Credits</span>
                                <p className="text-[9px] text-slate-400 font-medium mt-1">Risposte rapide e roadbook sintetici.</p>
                            </div>
                        </div>
                        <div className="bg-violet-500/5 border border-violet-500/10 p-4 rounded-2xl flex gap-3 items-center">
                            <div className="p-2 bg-violet-500/10 rounded-xl">
                                <Sparkles className="w-4 h-4 text-violet-400" />
                            </div>
                            <div>
                                <span className="font-black text-violet-400 text-[10px] uppercase tracking-widest block leading-none">Pro Credits</span>
                                <p className="text-[9px] text-slate-400 font-medium mt-1">Pianificazione avanzata e precisione.</p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="h-64 flex flex-col justify-center items-center gap-4">
                            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Caricamento Offerte...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {packages.map((pkg, idx) => {
                                const isFlash = pkg.flash_credits > 0;
                                const creditsCount = isFlash ? pkg.flash_credits : pkg.pro_credits;
                                const typeLabel = isFlash ? 'FLASH' : 'PRO';
                                const typeColor = isFlash ? 'text-blue-400' : 'text-violet-400';

                                // Gestione Campaign-Ready Price
                                const hasDiscount = pkg.original_price_eur && pkg.original_price_eur > pkg.price_eur;

                                return (
                                    <div 
                                        key={pkg.id}
                                        className={`bg-slate-800/40 border-2 ${pkg.is_recommended ? 'border-amber-500/50 ring-4 ring-amber-500/5' : 'border-slate-800'} hover:border-indigo-500/30 rounded-[2rem] p-6 transition-all group flex flex-col h-full relative overflow-hidden text-center`}
                                    >
                                        {pkg.is_recommended && (
                                            <div className="absolute top-0 right-0 px-4 py-1.5 bg-amber-500 text-[8px] font-black text-slate-950 uppercase tracking-widest shadow-lg z-floating-panel rounded-bl-2xl">
                                                Consigliato
                                            </div>
                                        )}
                                        
                                        {/* Titolo Card - Refactor Finale */}
                                        <div className="mb-4">
                                            <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${typeColor}`}>{typeLabel}</span>
                                            <div className="flex items-baseline justify-center gap-2 -mt-1">
                                                <span className="text-2xl font-black text-white">{creditsCount}</span>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">credits</span>
                                            </div>
                                        </div>

                                        {/* Prezzo Campaign-Ready - Refactor Finale */}
                                        <div className="mb-6 pt-4 border-t border-slate-800/50">
                                            <div className="flex flex-col items-center">
                                                {hasDiscount ? (
                                                    <>
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="text-slate-500 line-through text-sm font-bold">€{pkg.original_price_eur?.toFixed(2)}</span>
                                                            {pkg.discount_badge && (
                                                                <span className="bg-emerald-500/15 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                                                                    {pkg.discount_badge}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className="font-black text-emerald-400 text-2xl">
                                                                €{pkg.price_eur.toFixed(2)}
                                                            </span>
                                                            <span className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">IVA inc.</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="text-3xl font-black text-white">
                                                            €{pkg.price_eur.toFixed(2)}
                                                        </span>
                                                        <span className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">IVA inc.</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 flex flex-col justify-center mb-6">
                                            {/* Blocco Validità - Refactor Finale */}
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-bold text-white uppercase tracking-wider">365 Giorni</span>
                                                <div className="border-t border-indigo-500/40 w-10 my-1 opacity-80" />
                                                <span className="text-[9px] uppercase text-indigo-400 font-black tracking-[0.2em]">Validità</span>
                                            </div>
                                        </div>

                                        <button 
                                            ref={idx === 0 ? firstButtonRef : null}
                                            onClick={() => handleBuy(pkg)}
                                            disabled={purchasingId !== null}
                                            className={`w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-50`}
                                        >
                                            {purchasingId === pkg.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    Scegli Piano
                                                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="p-6 bg-slate-800/30 border-t border-slate-800 flex items-start gap-4">
                    <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <p className="text-[9px] text-slate-500 leading-relaxed font-medium uppercase tracking-tight">
                        I crediti acquistati vengono aggiunti al tuo saldo immediatamente dopo la conferma del pagamento. 
                        Validità garantita per un anno solare dall'acquisto.
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};



