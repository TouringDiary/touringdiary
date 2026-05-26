import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getStaticPageContent } from '../../services/contentService';
import { useConfig } from '@/context/ConfigContext';
import { BaseFullscreenModalShell } from '@/components/modals/shell/BaseFullscreenModalShell';

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
    const pageKey = type;
    const [page, setPage] = useState<PageContent | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const { configs } = useConfig();
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
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Errore di caricamento.');
            } finally {
                setLoading(false);
            }
        };

        loadPage();
    }, [pageKey]);

    const proseClasses = [
        'prose',
        'prose-invert',
        'lg:prose-xl',
        'mx-auto',
        design.legal_h1?.css_class,
        design.legal_h2?.css_class,
        design.legal_p?.css_class,
        design.legal_list?.css_class,
    ].filter(Boolean).join(' ');

    const header = (
        <header className="flex items-center px-4 md:px-6 py-3 border-b border-slate-800 bg-[#0f172a] pr-14">
            <h2 className="text-xl md:text-2xl font-bold text-white truncate">
                {loading ? 'Caricamento...' : page?.title || error || 'Informazioni'}
            </h2>
        </header>
    );

    return (
        <BaseFullscreenModalShell
            isOpen={isOpen}
            onClose={onBack}
            maxWidth="4xl"
            header={header}
            panelClassName="md:max-h-[calc(100dvh-var(--header-height)-2rem)]"
        >
            <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-[#020617] min-h-0">
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
        </BaseFullscreenModalShell>
    );
};

export default StaticPage;
