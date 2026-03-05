
import React, { useState, useMemo } from 'react';
import { History, ChevronUp, ChevronDown, UserCheck, Store, ShoppingBag, Mail, Star, CheckCircle, XCircle, CalendarPlus, Ban, Clock, Eye, Trash2, CheckSquare, Square, AlertOctagon, Users, MessageSquare } from 'lucide-react';
import { SponsorRequest, CitySummary } from '../../../types/index';
import { getDismissedAlerts, dismissPartnerAlert, getSponsorRating } from '../../../services/sponsorService';
import { PaginationControls } from '../../common/PaginationControls';

interface SponsorTableProps {
    requests: SponsorRequest[]; 
    allRequests?: SponsorRequest[]; 
    manifest: CitySummary[];
    onInitialApproval: (id: string) => void;
    onReject: (id: string) => void;
    onActivate: (id: string, amount: number) => void;
    onOpenCrm: (vatNumber: string) => void;
    onPreview: (req: SponsorRequest) => void;
    onExtend: (id: string) => void;
    onCancel: (id: string) => void;
    onDelete?: (id: string, name: string) => void;
    isSuperAdmin?: boolean;

    currentPage: number;
    maxPage: number;
    onNext: () => void;
    onPrev: () => void;
    totalItems: number;
    
    selectedIds?: Set<string>;
    onToggleSelection?: (id: string) => void;
}

const getPriceForRequest = (req: SponsorRequest) => {
    if (req.amount && req.amount > 0) return req.amount;
    if (req.type === 'shop') return 80;
    if (req.type === 'guide') return 45;
    if (req.tier === 'gold') return 120;
    if (req.tier === 'silver') return 50;
    return 0;
};

export const SponsorTable = ({ 
    requests, 
    allRequests = [],
    manifest, 
    onInitialApproval, 
    onReject, 
    onActivate, 
    onOpenCrm, 
    onPreview,
    onExtend,
    onCancel,
    onDelete,
    isSuperAdmin = false,
    currentPage,
    maxPage,
    onNext,
    onPrev,
    totalItems,
    selectedIds,
    onToggleSelection
}: SponsorTableProps) => {
    
    const [dismissedVats, setDismissedVats] = useState<string[]>(getDismissedAlerts());
    const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});

    const displayData = useMemo(() => {
        const groups: Record<string, SponsorRequest[]> = {};
        requests.forEach(req => {
            const key = req.vatNumber ? req.vatNumber : req.id;
            if (!groups[key]) groups[key] = [];
            groups[key].push(req);
        });
        return Object.values(groups).map(group => {
            return group.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
    }, [requests]);

    const toggleHistory = (id: string) => {
        setExpandedHistory(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleDismissAlert = (vat: string) => {
        dismissPartnerAlert(vat);
        setDismissedVats(prev => [...prev, vat]);
    };

    const hasBadHistory = (vat?: string, currentId?: string) => {
        if (!vat) return false;
        return allRequests.some(r => 
            r.vatNumber === vat && 
            r.id !== currentId && 
            (r.status === 'rejected' || r.status === 'cancelled')
        );
    };

    if (displayData.length === 0) {
        return (
            <div className="text-slate-500 text-center py-12 bg-slate-900/30 border border-slate-800 border-dashed rounded-xl italic text-lg">
                Nessun elemento trovato con i filtri attuali.
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-20">
            <div className="grid gap-4">
                {displayData.map(group => {
                    const req = group[0]; 
                    const historyItems = group.slice(1);
                    
                    const cityDetails = manifest.find(c => c.id === req.cityId);
                    
                    // Count only INBOUND unread messages from user
                    const totalUnreadCount = group.reduce((sum, r) => sum + (r.partnerLogs?.filter(l => l.direction === 'inbound' && l.isUnread).length || 0), 0);
                    
                    const isBadPartner = hasBadHistory(req.vatNumber, req.id);
                    const showBadHistoryAlert = isBadPartner && !dismissedVats.includes(req.vatNumber || '');
                    
                    const isGuide = req.type === 'guide';
                    const isActivity = req.type === 'activity' || req.type === 'shop' || (!isGuide && req.poiCategory);
                    
                    let currentRating = null;
                    if (req.status === 'approved' || req.status === 'expired') {
                        currentRating = getSponsorRating(req.id);
                    }
                    
                    let borderClass = 'border-slate-800';
                    let bgClass = 'bg-slate-900';
                    
                    if (req.status === 'approved') borderClass = 'border-emerald-500/30';
                    else if (req.status === 'rejected') { borderClass = 'border-red-500/30'; bgClass = 'bg-red-950/5'; }
                    else if (req.status === 'cancelled') { borderClass = 'border-slate-600'; bgClass = 'bg-slate-900 opacity-60'; }

                    if (showBadHistoryAlert) {
                        borderClass = 'border-red-500 border-2 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
                    } else if (isGuide && req.status !== 'rejected' && req.status !== 'cancelled') {
                        borderClass = 'border-indigo-500/30';
                    }
                    
                    const isSelected = selectedIds?.has(req.id);
                    const isExpanded = expandedHistory[req.id];

                    return (
                        <div key={req.id} className={`${bgClass} rounded-xl border flex flex-col transition-all animate-in fade-in slide-in-from-bottom-2 ${borderClass} overflow-hidden relative shadow-lg ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}>
                            
                            {isSuperAdmin && onToggleSelection && (
                                <div className="absolute top-2 right-2 z-[50]">
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSelection(req.id); }} className={`p-1.5 rounded-lg shadow-lg border transition-all ${isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-black/50 border-white/20 text-slate-300 hover:bg-black/70'}`}>
                                        {isSelected ? <CheckSquare className="w-5 h-5"/> : <Square className="w-5 h-5"/>}
                                    </button>
                                </div>
                            )}

                            {showBadHistoryAlert && (
                                <div className="bg-red-600 text-white text-xs font-bold px-4 py-3 flex items-center justify-between animate-pulse relative z-10 shadow-lg pl-10">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white text-red-600 p-1 rounded-full"><AlertOctagon className="w-5 h-5"/></div>
                                        <span className="text-sm uppercase tracking-wide">ATTENZIONE: Partner con storico negativo</span>
                                    </div>
                                    <button onClick={() => req.vatNumber && handleDismissAlert(req.vatNumber)} className="flex items-center gap-1 bg-black/30 hover:bg-black/50 px-3 py-1.5 rounded transition-colors text-[10px] uppercase font-bold border border-white/20">
                                        <XCircle className="w-3.5 h-3.5"/> Ignora
                                    </button>
                                </div>
                            )}

                            <div className="bg-slate-950/80 px-6 py-3 border-b border-slate-800 flex flex-wrap gap-x-8 gap-y-2 items-center pl-10 md:pl-6">
                                <div className="flex flex-col"><span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">REGIONE</span><span className="text-[10px] font-bold text-slate-400 uppercase">{cityDetails?.adminRegion || 'CAMPANIA'}</span></div>
                                <div className="flex flex-col"><span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">CITTÀ</span><span className="text-[11px] font-black text-white">{cityDetails?.name || 'Sconosciuta'}</span></div>
                            </div>

                            <div className="p-6 flex flex-col md:flex-row gap-6 justify-between items-start pl-12 md:pl-6">
                                <div className="flex-1 w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-0.5 rounded text-sm font-bold uppercase tracking-wider ${req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-500' : req.status === 'rejected' ? 'bg-red-500/20 text-red-500' : req.status === 'cancelled' ? 'bg-slate-700 text-slate-400' : 'bg-slate-700 text-slate-400'}`}>{req.status.replace('_', ' ')}</span>
                                            {isGuide ? <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded border border-indigo-400 flex items-center gap-1"><UserCheck className="w-3 h-3"/> GUIDA</span> : <>{req.tier === 'gold' && <span className="bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded border border-amber-600">GOLD</span>}{req.tier === 'silver' && <span className="bg-slate-300 text-slate-900 text-xs font-bold px-2 py-0.5 rounded border border-slate-400">SILVER</span>}</>}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`p-2 rounded-lg ${isGuide ? 'bg-indigo-900/30 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>{isGuide ? <UserCheck className="w-5 h-5"/> : <Store className="w-5 h-5"/>}</div>
                                        <h3 className="text-2xl font-bold text-white cursor-pointer hover:text-indigo-400 transition-colors" onClick={() => req.vatNumber && onOpenCrm(req.vatNumber)}>{req.companyName}</h3>
                                        {isActivity && <div className="ml-3 bg-blue-900/40 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold text-blue-300 uppercase tracking-wide flex items-center gap-1.5" title="Profilo Attività/Bottega"><ShoppingBag className="w-3 h-3"/> Vetrina</div>}
                                        {/* UNREAD INDICATOR */}
                                        {totalUnreadCount > 0 && <span className="bg-rose-600 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse ml-2 cursor-pointer" onClick={() => req.vatNumber && onOpenCrm(req.vatNumber)}><Mail className="w-3 h-3"/> {totalUnreadCount}</span>}
                                    </div>

                                    <div className="text-base text-slate-300 mb-4 flex flex-wrap gap-4">
                                        <span className="flex items-center gap-1"><Users className="w-4 h-4 text-slate-500"/> {req.contactName}</span>
                                        <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4 text-slate-500"/> {req.email}</span>
                                    </div>

                                    {(req.status === 'approved' || req.status === 'expired' || req.status === 'cancelled') && (
                                        <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                            <div><span className="text-xs text-slate-500 uppercase font-bold block mb-0.5 tracking-wide">Attivazione</span><span className="text-base font-bold text-slate-200">{req.startDate || '--'}</span></div>
                                            <div><span className="text-xs text-slate-500 uppercase font-bold block mb-0.5 tracking-wide">Scadenza</span><span className={`text-base font-bold ${req.status === 'expired' ? 'text-red-400' : 'text-emerald-400'}`}>{req.endDate || '--'}</span></div>
                                            <div><span className="text-xs text-slate-500 uppercase font-bold block mb-0.5 tracking-wide">Rating</span><div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-current"/> <span className="font-bold text-white">{currentRating !== null ? currentRating : 'N/A'}</span></div></div>
                                            <div><span className="text-xs text-slate-500 uppercase font-bold block mb-0.5 tracking-wide">Piano</span><span className="text-base font-bold text-slate-200">{req.plan?.replace('_', ' ') || '--'}</span></div>
                                        </div>
                                    )}

                                    {historyItems.length > 0 && (
                                        <div className="mt-2 bg-slate-950/30 rounded-lg border border-slate-800/50 overflow-hidden">
                                            <button onClick={() => toggleHistory(req.id)} className="w-full flex justify-between items-center px-4 py-2 bg-slate-800/50 hover:bg-slate-800 transition-colors text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                <span className="flex items-center gap-2"><History className="w-3.5 h-3.5"/> Storico Rinnovi ({historyItems.length})</span>
                                                {isExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                                            </button>
                                            {isExpanded && (
                                                <div className="p-2 space-y-1">
                                                    {historyItems.map((h, hIdx) => (
                                                        <div key={h.id || `hist-${hIdx}`} className="grid grid-cols-4 items-center gap-2 p-2 bg-slate-900/50 rounded text-xs text-slate-400 hover:bg-slate-800 transition-colors">
                                                            <div className="col-span-1 font-mono">{h.date.split('-')[0]}</div>
                                                            <div className="col-span-1"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${h.status === 'expired' ? 'bg-slate-700 text-slate-400' : h.status === 'approved' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/20 text-red-400'}`}>{h.status}</span></div>
                                                            <div className="col-span-1 font-bold text-slate-300">€{h.amount || 0}</div>
                                                            <div className="col-span-1 text-right text-[10px] font-mono opacity-50">{h.startDate} - {h.endDate}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {req.status === 'pending' && (
                                            <>
                                                <button onClick={() => onInitialApproval(req.id)} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold uppercase flex items-center gap-1 transition-colors shadow-lg"><CheckCircle className="w-4 h-4"/> Approva</button>
                                                <button onClick={() => onReject(req.id)} className="bg-slate-800 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold uppercase flex items-center gap-1 transition-colors border border-slate-700"><XCircle className="w-4 h-4"/> Rifiuta</button>
                                            </>
                                        )}
                                        {req.status === 'waiting_payment' && (
                                            <button onClick={() => onActivate(req.id, getPriceForRequest(req))} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold uppercase flex items-center gap-1 transition-colors shadow-lg animate-pulse"><CheckCircle className="w-4 h-4"/> Registra Incasso</button>
                                        )}
                                        {req.status === 'approved' && (
                                            <>
                                                <button onClick={() => onExtend(req.id)} className="bg-slate-800 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold uppercase flex items-center gap-1 transition-colors border border-slate-700 hover:border-indigo-500"><CalendarPlus className="w-4 h-4"/> Estendi</button>
                                                <button onClick={() => onCancel(req.id)} className="bg-slate-800 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold uppercase flex items-center gap-1 transition-colors border border-slate-700 hover:border-red-500"><Ban className="w-4 h-4"/> Termina</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-2 w-full md:w-40 min-w-[160px]">
                                    {req.vatNumber && <button onClick={() => req.vatNumber && onOpenCrm(req.vatNumber)} className="w-full text-sm font-bold uppercase flex items-center justify-center gap-2 px-3 py-3 rounded border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-indigo-400 transition-colors"><Clock className="w-4 h-4"/> CRM / Chat</button>}
                                    <button onClick={() => onPreview(req)} className="w-full text-sm text-slate-400 hover:text-white flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-3 rounded mt-auto transition-colors font-bold uppercase border border-slate-700"><Eye className="w-4 h-4"/> Anteprima</button>
                                    
                                    {isSuperAdmin && onDelete && (
                                        <button 
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(req.id, req.companyName); }}
                                            className="w-full text-sm text-red-500 hover:text-white bg-red-900/10 hover:bg-red-600 border border-red-900/20 px-3 py-3 rounded transition-colors font-bold uppercase flex items-center justify-center gap-2 mt-2 pointer-events-auto"
                                            title="Cancellazione Definitiva"
                                        >
                                            <Trash2 className="w-4 h-4"/> Elimina
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <PaginationControls 
                currentPage={currentPage} 
                maxPage={maxPage} 
                onNext={onNext} 
                onPrev={onPrev} 
                totalItems={totalItems} 
            />
        </div>
    );
};
