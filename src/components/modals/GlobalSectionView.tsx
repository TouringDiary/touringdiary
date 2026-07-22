import React, { useState, useEffect } from 'react';
import { Camera, BookOpen, MessageSquare, Trophy, Globe, Store } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { BaseFullscreenModalShell } from '@/components/modals/shell/BaseFullscreenModalShell';
import { User as UserType } from '../../types/index';
import { LiveFeedTab } from '../community/LiveFeedTab';
import { QaForumTab } from '../community/QaForumTab';
import { RankingTab } from '../community/RankingTab';
import { ItinerariesExplorer } from '../itineraries/ItinerariesExplorer';

type CommunityTab = 'live' | 'diari' | 'qa' | 'classifica' | 'partner';

interface GlobalSectionViewProps {
    /** @deprecated Preferire section 'community' con initialTab 'diari'. Mantenuto per deep link legacy. */
    section: 'community' | 'sponsors' | 'itineraries';
    onClose: () => void;
    onUserUpdate?: (user: UserType) => void;
    user: UserType;
    initialTab?: 'live' | 'qa' | 'diari';
    initialSelectedPostId?: string;
    onOpenAuth?: () => void;
    isOpen?: boolean;
}

const TAB_LAYOUT: Record<CommunityTab, 'scroll' | 'fill'> = {
    live: 'scroll',
    diari: 'fill',
    qa: 'scroll',
    classifica: 'scroll',
    partner: 'scroll',
};

export const GlobalSectionView = ({ section, onClose, onUserUpdate, user, initialTab = 'live', initialSelectedPostId, onOpenAuth, isOpen = true }: GlobalSectionViewProps) => {
    const [activeTab, setActiveTab] = useState<CommunityTab>(initialTab as CommunityTab);

    useEffect(() => {
        if (section === 'community' && initialTab) setActiveTab(initialTab as CommunityTab);
        else if (section === 'itineraries') setActiveTab('diari');
        else if (section === 'sponsors') setActiveTab('partner');
    }, [section, initialTab]);

    if (!isOpen) return null;

    const renderContent = () => {
        switch (activeTab) {
            case 'live':
                return (
                    <LiveFeedTab user={user} onUserUpdate={onUserUpdate} onOpenAuth={onOpenAuth} />
                );
            case 'diari':
                return (
                    <ItinerariesExplorer
                        user={user}
                        onOpenAuth={onOpenAuth}
                    />
                );
            case 'qa': return <QaForumTab user={user} initialSelectedPostId={initialSelectedPostId} />;
            case 'classifica': return <RankingTab user={user} />;
            case 'partner':
                return (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed animate-in fade-in">
                        <Store className="w-16 h-16 opacity-20 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Directory Partner</h3>
                        <p className="max-w-sm text-center text-sm uppercase tracking-widest font-bold">In questa sezione appariranno tutti i nostri partner certificati.</p>
                    </div>
                );
            default:
                return (
                    <LiveFeedTab user={user} onUserUpdate={onUserUpdate} onOpenAuth={onOpenAuth} />
                );
        }
    };

    const contentLayout = TAB_LAYOUT[activeTab];

    const header = (
        <div className="flex flex-col md:flex-row md:items-center justify-between px-4 py-4 md:px-8 border-b border-slate-800 bg-[#0f172a] gap-4">
            <div className="flex items-center justify-between w-full md:w-auto">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg border border-indigo-400/30 hidden md:block">
                        <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-display font-bold text-white tracking-wide">
                            Community Hub
                        </h2>
                        <p className="text-xs text-slate-400 hidden md:block">
                            Esplora, condividi e connettiti con altri viaggiatori.
                        </p>
                    </div>
                </div>

                <div className="md:hidden">
                    <CloseButton onClose={onClose} variant="primary" withEscape={false} />
                </div>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar w-full md:w-auto pb-2 md:pb-0">
                {[
                    { id: 'live', label: 'Live Feed', icon: Camera },
                    { id: 'diari', label: 'Itinerari', icon: BookOpen },
                    { id: 'qa', label: 'Q&A Local', icon: MessageSquare },
                    { id: 'classifica', label: 'Classifiche', icon: Trophy },
                    { id: 'partner', label: 'Partner', icon: Store },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as CommunityTab)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap border ${activeTab === tab.id ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/20' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'}`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-slate-500'}`} /> {tab.label}
                    </button>
                ))}
                <div className="hidden md:block">
                    <CloseButton onClose={onClose} variant="primary" withEscape={false} />
                </div>
            </div>
        </div>
    );

    return (
        <BaseFullscreenModalShell
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="7xl"
            showCloseButton={false}
            padding="p-0"
            panelClassName="md:rounded-3xl border-0 md:border md:border-slate-700"
            header={header}
        >
            <div className={`flex-1 relative min-h-0 bg-[#0b1120] ${contentLayout === 'fill' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto custom-scrollbar'}`}>
                {renderContent()}
            </div>
        </BaseFullscreenModalShell>
    );
};
