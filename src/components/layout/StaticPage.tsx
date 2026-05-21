import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { getStaticPageContent } from '../../services/contentService';
import { useConfig } from '@/context/ConfigContext';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';


interface StaticPageProps {
    type: string;
    isOpen?: boolean;
    onBack: () => void;
}

type PageContent = {
    title: string;
    content: string;
    hero_image_url?: string;
};

export const StaticPage: React.FC<StaticPageProps> = ({ type, isOpen = true, onBack }) => {
    if (!isOpen) return null;
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

    useGlobalModalEscape(isOpen, onBack);

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

    return createPortal(
        <div 
            className="fixed inset-0 flex items-center justify-center td-modal-overlay bg-black/90 backdrop-blur-sm animate-in fade-in pointer-events-auto" 
            onClick={onBack}
            style={{ zIndex: Z_OVERLAY }}
        >
            <div 
                className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl w-[95vw] max-w-4xl h-[90vh] flex flex-col overflow-hidden" 
                onClick={e => e.stopPropagation()}
                style={{ zIndex: Z_MODAL }}
            >
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

                <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-slate-950">
                    {loading && (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
                            <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
                            <p className="font-bold uppercase tracking-widest text-xs">Recupero contenuto...</p>
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center justify-center h-full py-20">
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
        </div>,
        document.body
    );
};

export default StaticPage;



