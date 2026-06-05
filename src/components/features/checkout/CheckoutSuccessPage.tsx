import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { useUser } from '@/context/UserContext';
import { getCurrentUserProfile } from '@/services/userService';

export const CheckoutSuccessPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUser, refreshAiQuota } = useUser();
    const sessionId = searchParams.get('session_id');
    const isMock = searchParams.get('mock') === 'true';
    
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);

    const finalizeCheckout = useCallback(async () => {
        if (!sessionId) {
            setStatus('error');
            setError('Session ID mancante. Impossibile verificare l\'acquisto.');
            return;
        }

        try {
            if (isMock) {
                // Finalizza il checkout mock in modo sicuro lato backend
                const { data, error: finalizeError } = await supabase.functions.invoke('purchase-extra-credits', {
                    body: {
                        action: 'finalize',
                        sessionId
                    }
                });

                if (finalizeError || !data?.success) {
                    throw new Error(finalizeError?.message || data?.error || 'Errore durante la finalizzazione del mock');
                }
            }

            // Refresh dei dati utente e della quota AI
            const updatedUser = await getCurrentUserProfile();
            if (updatedUser) {
                setUser(updatedUser);
            }
            
            await refreshAiQuota();
            
            setStatus('success');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Errore durante la finalizzazione dell\'acquisto.';
            console.error("Checkout finalization error:", err);
            setStatus('error');
            setError(message);
        }
    }, [sessionId, isMock, setUser, refreshAiQuota]);

    useEffect(() => {
        finalizeCheckout();
    }, [finalizeCheckout]);

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
                {/* Header Decorativo */}
                <div className="h-32 bg-gradient-to-br from-indigo-600/20 via-slate-900 to-slate-900 relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-10"></div>
                    {status === 'success' && (
                        <div className="relative">
                            <div className="absolute -inset-4 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
                            <CheckCircle2 className="w-16 h-16 text-indigo-500 relative z-10" />
                        </div>
                    )}
                    {status === 'loading' && (
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                    )}
                    {status === 'error' && (
                        <AlertCircle className="w-16 h-16 text-rose-500" />
                    )}
                </div>

                <div className="p-8 md:p-12 text-center space-y-6">
                    {status === 'loading' && (
                        <>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Elaborazione in corso...</h2>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                Stiamo verificando la transazione con i sistemi di pagamento. Un attimo di pazienza.
                            </p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-white uppercase tracking-tight">Acquisto completato</h2>
                                <div className="flex items-center justify-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Successo</span>
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                </div>
                            </div>
                            
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                I tuoi crediti sono stati elaborati correttamente e sono ora disponibili nel tuo wallet.
                            </p>

                            <div className="pt-4">
                                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID Sessione</span>
                                    <span className="text-[10px] font-mono text-slate-400 truncate ml-4 max-w-[200px]">{sessionId}</span>
                                </div>
                            </div>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Qualcosa è andato storto</h2>
                            <p className="text-rose-400/80 text-sm font-medium leading-relaxed">
                                {error || 'Non è stato possibile confermare l\'acquisto. Se il pagamento è andato a buon fine, i crediti verranno accreditati a breve.'}
                            </p>
                        </>
                    )}

                    <div className="pt-6">
                        <button
                            onClick={handleGoHome}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-xs uppercase tracking-widest active:scale-95"
                        >
                            OK
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-800/30 border-t border-slate-800 text-center">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">
                        Touring Diary &copy; 2026 &bull; Pagamento Sicuro via Stripe
                    </p>
                </div>
            </div>
        </div>
    );
};
