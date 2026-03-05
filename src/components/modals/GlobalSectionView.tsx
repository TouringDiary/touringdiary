
import React, { useState, useEffect } from 'react';
// Fix: Added ArrowLeft to lucide-react imports to resolve "Cannot find name" error
import { X, Camera, BookOpen, MessageSquare, Trophy, Globe, Store, ArrowLeft } from 'lucide-react';
import { User as UserType, PremadeItinerary } from '../../types/index';
import { LiveFeedTab } from '../community/LiveFeedTab';
import { QaForumTab } from '../community/QaForumTab';
import { RankingTab } from '../community/RankingTab';
import { CommunityItinerariesTab } from '../community/CommunityItinerariesTab';
import { ItineraryDetail } from '../itineraries/ItineraryDetail';

interface GlobalSectionViewProps {
    section: 'itineraries' | 'community' | 'sponsors';
    onClose: () => void;
    onUserUpdate?: (user: UserType) => void;
    user: UserType;
    initialTab?: 'live' | 'qa' | 'diari';
    initialSelectedPostId?: string;
    onOpenAuth?: () => void; // ADDED PROP
}

export const GlobalSectionView = ({ section, onClose, onUserUpdate, user, initialTab = 'live', initialSelectedPostId, onOpenAuth }: GlobalSectionViewProps) => {
    const [activeTab, setActiveTab] = useState<'live' | 'diari' | 'qa' | 'classifica' | 'partner'>(initialTab as any);
    const [viewingItinerary, setViewingItinerary] = useState<PremadeItinerary | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (viewingItinerary) setViewingItinerary(null);
                else onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, viewingItinerary]);

    useEffect(() => {
        if (section === 'community' && initialTab) setActiveTab(initialTab as any);
        else if (section === 'itineraries') setActiveTab('diari'); 
        else if (section === 'sponsors') setActiveTab('partner');
    }, [section, initialTab]);

    const renderContent = () => {
        if (viewingItinerary) {
            return (
                <div className="h-full bg-[#020617] animate-in fade-in slide-in-from-right-4">
                    <ItineraryDetail 
                        itinerary={viewingItinerary} 
                        onBack={() => setViewingItinerary(null)}
                        onImportConfirm={(stays, start) => {
                             // Logica per importare nel diario personale dal modale community
                             console.log("Importing to personal diary...", stays, start);
                             alert("Itinerario clonato nel tuo Diario di Viaggio!");
                             onClose();
                        }}
                        user={user}
                        onOpenAuth={onOpenAuth}
                    />
                </div>
            );
        }

        switch (activeTab) {
            case 'live': return <LiveFeedTab user={user} onUserUpdate={onUserUpdate} />;
            case 'diari': return <CommunityItinerariesTab user={user} onViewItinerary={setViewingItinerary} />;
            case 'qa': return <QaForumTab user={user} initialSelectedPostId={initialSelectedPostId} />;
            case 'classifica': return <RankingTab user={user} />;
            case 'partner':
                return (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed animate-in fade-in">
                        <Store className="w-16 h-16 opacity-20 mb-4"/>
                        <h3 className="text-xl font-bold text-white mb-2">Directory Partner</h3>
                        <p className="max-w-sm text-center text-sm uppercase tracking-widest font-bold">In questa sezione appariranno tutti i nostri partner certificati.</p>
                    </div>
                );
            default: return <LiveFeedTab user={user} onUserUpdate={onUserUpdate} />;
        }
    };

    return (
        <div className="fixed top-24 bottom-0 left-0 right-0 z-[900] flex items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-[#020617] w-full max-w-7xl h-full md:rounded-3xl border-0 md:border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between px-4 py-4 md:px-8 border-b border-slate-800 bg-[#0f172a] shrink-0 gap-4">
                    <div className="flex items-center justify-between w-full md:w-auto">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg border border-indigo-400/30 hidden md:block">
                                <Globe className="w-6 h-6 text-white"/>
                            </div>
                            <div>
                                <h2 className="text-xl md:text-2xl font-display font-bold text-white tracking-wide">
                                    {viewingItinerary ? 'Dettaglio Diario Community' : 'Community Hub'}
                                </h2>
                                <p className="text-xs text-slate-400 hidden md:block">{viewingItinerary ? `Consultando il piano di ${viewingItinerary.author}` : 'Esplora, condividi e connettiti con altri viaggiatori.'}</p>
                            </div>
                        </div>
                        
                        {/* MOBILE CLOSE BUTTON (RIGHT OF TITLE) */}
                        <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors md:hidden shadow-lg ml-3">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                    
                    {!viewingItinerary && (
                        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0">
                            {[ 
                                { id: 'live', label: 'Live Feed', icon: Camera }, 
                                { id: 'diari', label: 'Diari di Viaggio', icon: BookOpen }, 
                                { id: 'qa', label: 'Q&A Local', icon: MessageSquare }, 
                                { id: 'classifica', label: 'Classifiche', icon: Trophy },
                                { id: 'partner', label: 'Partner', icon: Store }
                            ].map(tab => (
                                <button 
                                    key={tab.id} 
                                    onClick={() => setActiveTab(tab.id as any)} 
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap border ${activeTab === tab.id ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/20' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'}`}
                                >
                                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-slate-500'}`}/> {tab.label}
                                </button>
                            ))}
                            {/* STANDARD RED CLOSE BUTTON (DESKTOP) */}
                            <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors hidden md:block shadow-lg">
                                <X className="w-6 h-6"/>
                            </button>
                        </div>
                    )}
                    {viewingItinerary && (
                        <button onClick={() => setViewingItinerary(null)} className="flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase border border-slate-700 transition-all">
                            <ArrowLeft className="w-4 h-4"/> Torna alla lista
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-[#0b1120] relative">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
