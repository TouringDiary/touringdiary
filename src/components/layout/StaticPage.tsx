import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { getStaticPageContent } from '../../services/contentService';
import { useConfig } from '@/context/ConfigContext';

interface StaticPageProps {
    type: string;
    onBack: () => void;
    onOpenSponsor: (tier: string) => void;
}

type PageContent = {
    title: string;
    content: string;
    hero_image_url?: string;
};

export const StaticPage: React.FC<StaticPageProps> = ({ type, onBack }) => {
    const pageKey = type;
    const [page, setPage] = useState<PageContent | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    const { configs } = useConfig();
    // Safely access the design components, providing an empty object as a fallback.
    const design = configs?.design_system?.components || {};

    useEffect(() => {
        const loadPage = async () => {
            if (!pageKey) {
                setError('Pagina non specificata.');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const pageData = await getStaticPageContent(pageKey);
                if (pageData) {
                    setPage(pageData);
                } else {
                    setError('Pagina non trovata.');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadPage();
    }, [pageKey]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onBack();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onBack]);

    // Combine base prose classes with dynamic classes from the Design System.
    // The 'css_class' property of each rule contains the Tailwind CSS classes.
    const proseClasses = [
        'prose',
        'prose-invert',
        'lg:prose-xl',
        'mx-auto',
        design.legal_h1?.css_class,
        design.legal_h2?.css_class,
        design.legal_p?.css_class,
        design.legal_list?.css_class
    ].filter(Boolean).join(' '); // Filter out any undefined values and join into a single string.

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[4000] flex items-center justify-center animate-in fade-in" onClick={onBack}>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl w-[95vw] max-w-4xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <header className="relative flex items-center justify-between p-4 md:p-6 border-b border-slate-800 shrink-0">
                    <h2 className="text-xl md:text-2xl font-bold text-white pr-12">
                        {loading ? 'Caricamento...' : page?.title || error || 'Informazioni'}
                    </h2>
                    <button 
                        onClick={onBack}
                        className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                        aria-label="Chiudi"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </header>

                {/* Apply spacing from Design System to the main content area, with a fallback. */}
                <main className={`flex-grow overflow-y-auto ${design.legal_spacing?.css_class}`}>
                    {loading && (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Loader2 className="w-12 h-12 text-amber-500 animate-spin"/>
                            <p className="text-slate-500 uppercase font-black text-xs tracking-widest">Caricamento Contenuto...</p>
                        </div>
                    )}
                    {error && (
                         <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <div className="w-16 h-16 flex items-center justify-center bg-red-900/50 text-red-500 rounded-full mb-4">
                                <X className="w-8 h-8"/>
                            </div>
                            <h3 className="text-xl font-bold text-white">Errore</h3>
                            <p className="text-red-400">{error}</p>
                        </div>
                    )}
                    {!loading && !error && page && (
                        <article className={proseClasses}>
                            <div dangerouslySetInnerHTML={{ __html: page.content || '' }} />
                        </article>
                    )}
                </main>
            </div>
        </div>
    );
};

export default StaticPage;
