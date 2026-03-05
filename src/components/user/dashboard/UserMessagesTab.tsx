
import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, User, ShieldCheck, MessageSquare, Briefcase, ChevronRight, Check, CheckCheck } from 'lucide-react';
import { User as UserType, SponsorRequest, PartnerLog } from '../../../types/index';
import { sendUserMessage, markUserLogsAsRead } from '../../../services/sponsorService';

interface UserMessagesTabProps {
    user: UserType;
    requests: SponsorRequest[];
    onRefresh: () => void;
}

export const UserMessagesTab = ({ user, requests, onRefresh }: UserMessagesTabProps) => {
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isMobileList, setIsMobileList] = useState(true); // Mobile view toggle

    // Seleziona automaticamente il primo se desktop o se ce n'è uno solo
    useEffect(() => {
        if (requests.length === 1 && !selectedRequestId) {
            setSelectedRequestId(requests[0].id);
            setIsMobileList(false);
        } else if (window.innerWidth >= 768 && !selectedRequestId && requests.length > 0) {
            setSelectedRequestId(requests[0].id);
        }
    }, [requests]);

    // Auto-scroll e Mark Read
    useEffect(() => {
        if (selectedRequestId && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            markUserLogsAsRead(selectedRequestId).then(onRefresh);
        }
    }, [selectedRequestId, requests]);

    const activeRequest = requests.find(r => r.id === selectedRequestId);
    const logs = activeRequest?.partnerLogs || [];

    const handleSend = async () => {
        if (!messageText.trim() || !selectedRequestId) return;
        setIsSending(true);
        try {
            await sendUserMessage(selectedRequestId, messageText);
            setMessageText('');
            onRefresh();
        } catch (e) {
            alert("Errore invio messaggio.");
        } finally {
            setIsSending(false);
        }
    };
    
    // Sort logs by date
    const sortedLogs = [...logs].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // --- RENDER LISTA CONVERSAZIONI ---
    const renderList = () => (
        <div className={`w-full md:w-80 bg-slate-900 border-r border-slate-800 flex flex-col ${selectedRequestId && !isMobileList ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-slate-800 bg-[#0f172a]">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-500"/> Conversazioni
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {requests.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        Nessuna pratica attiva.
                    </div>
                ) : (
                    requests.map(req => {
                        const unreadCount = req.partnerLogs?.filter(l => l.direction === 'outbound' && l.isUnread).length || 0;
                        return (
                            <button
                                key={req.id}
                                onClick={() => { setSelectedRequestId(req.id); setIsMobileList(false); }}
                                className={`w-full text-left p-4 border-b border-slate-800 transition-colors hover:bg-slate-800 relative group ${selectedRequestId === req.id ? 'bg-slate-800' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-sm font-bold text-white truncate max-w-[70%]">{req.companyName}</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border ${req.status === 'approved' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' : 'bg-amber-900/30 text-amber-400 border-amber-500/30'}`}>
                                        {req.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-400">
                                    <span className="truncate max-w-[80%]">{req.cityId}</span>
                                    {unreadCount > 0 && (
                                        <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 rounded-full min-w-[18px] text-center animate-pulse">{unreadCount}</span>
                                    )}
                                </div>
                                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"/>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );

    // --- RENDER CHAT ---
    const renderChat = () => {
        if (!activeRequest) return <div className="flex-1 hidden md:flex items-center justify-center text-slate-500 italic bg-[#020617]">Seleziona una conversazione</div>;

        return (
            <div className={`flex-1 flex flex-col h-full bg-[#020617] ${isMobileList ? 'hidden md:flex' : 'flex'}`}>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <button className="md:hidden p-1.5 text-slate-400 hover:text-white" onClick={() => setIsMobileList(true)}>
                            <ChevronRight className="w-5 h-5 rotate-180"/>
                        </button>
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white border-2 border-indigo-400 shadow-lg">
                            <ShieldCheck className="w-5 h-5"/>
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-sm">Supporto Partner</h4>
                            <p className="text-xs text-slate-400 flex items-center gap-1"><Briefcase className="w-3 h-3"/> {activeRequest.companyName}</p>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#050b14]" ref={scrollRef}>
                    {/* Welcome Message Placeholder */}
                    <div className="text-center my-6">
                        <span className="text-[10px] text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                            Inizio conversazione: {new Date(activeRequest.date).toLocaleDateString()}
                        </span>
                    </div>

                    {sortedLogs.length === 0 && (
                        <div className="text-center text-slate-500 text-sm italic mt-10">
                            Nessun messaggio. Scrivi qui sotto per contattare lo staff.
                        </div>
                    )}

                    {sortedLogs.map((log, idx) => {
                        const isUser = log.direction === 'inbound';
                        const isSystem = log.type === 'system';
                        
                        if (isSystem) {
                            return (
                                <div key={idx} className="flex justify-center my-4">
                                    <span className="text-[10px] text-indigo-300 bg-indigo-900/20 px-4 py-1.5 rounded-full border border-indigo-500/20 font-bold uppercase tracking-wide text-center">
                                        {log.message}
                                    </span>
                                </div>
                            );
                        }

                        return (
                            <div key={idx} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] md:max-w-[60%] p-3 rounded-2xl text-sm relative shadow-md ${isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'}`}>
                                    <p className="whitespace-pre-wrap leading-relaxed">{log.message}</p>
                                    <div className={`text-[9px] mt-1.5 flex items-center justify-end gap-1 ${isUser ? 'text-blue-200' : 'text-slate-500'}`}>
                                        {new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        {isUser && <CheckCheck className="w-3 h-3 opacity-70"/>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-slate-900 border-t border-slate-800">
                    <div className="flex gap-2 items-end bg-slate-950 p-2 rounded-xl border border-slate-800 focus-within:border-indigo-500 transition-colors">
                        <textarea 
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="Scrivi un messaggio..."
                            className="flex-1 bg-transparent text-white text-sm p-2 outline-none resize-none max-h-32 custom-scrollbar"
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!messageText.trim() || isSending}
                            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-all shadow-lg active:scale-95 mb-0.5"
                        >
                            {isSending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 text-center">Lo staff risponde solitamente entro 24 ore.</p>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full border border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-black">
            {renderList()}
            {renderChat()}
        </div>
    );
};
