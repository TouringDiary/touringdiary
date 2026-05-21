import React, { useEffect, useRef } from 'react';
import { LAYOUT } from '../../constants/layout';
import { useModal } from '@/context/ModalContext';

interface AppShellProps {
    newsTicker?: React.ReactNode;
    header: React.ReactNode;
    sidebar: React.ReactNode;
    mobileNav?: React.ReactNode;
    children: React.ReactNode;
    isSidebarOpen: boolean;
    isUiVisible?: boolean;
}

/**
 * AppShell - Lo scheletro strutturale dell'applicazione.
 * Gestisce il layout macroscopico (Header, Sidebar, Main) usando le costanti centralizzate.
 */
export const AppShell: React.FC<AppShellProps> = ({
    newsTicker,
    header,
    sidebar,
    mobileNav,
    children,
    isSidebarOpen,
    isUiVisible = true
}) => {
    const { activeModal } = useModal();
    const isSuitcaseOpen = activeModal === 'packingList';

    // Riferimento per il calcolo dinamico dell'altezza header
    const headerWrapperRef = useRef<HTMLDivElement>(null);
    const lastMeasuredHeight = useRef<number>(0);

    useEffect(() => {
        if (!headerWrapperRef.current) return;

        // Misura iniziale e monitoraggio cambiamenti (resize, banner comparsi/spariti)
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                // Utilizziamo borderBoxSize per includere eventuali bordi/padding nel calcolo
                const height = Math.ceil(entry.target.getBoundingClientRect().height);
                
                // Protezione contro loop: aggiorna solo se il valore cambia sensibilmente
                if (height !== lastMeasuredHeight.current) {
                    lastMeasuredHeight.current = height;
                    document.documentElement.style.setProperty('--header-height', `${height}px`);
                }
            }
        });

        observer.observe(headerWrapperRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="h-screen w-screen overflow-hidden bg-slate-950 flex flex-col font-sans text-slate-200 selection:bg-amber-500/30">

            {/* WRAPPER SUPERIORE PER MISURAZIONE DINAMICA */}
            <div ref={headerWrapperRef} className="flex flex-col shrink-0">
                {/* ZONA 1: NEWS TICKER (Top Layer) */}
                <div className="relative z-dropdown shrink-0 transition-transform duration-300">
                    {newsTicker}
                </div>

                {/* ZONA 2: HEADER (FISSO, NON SCOMPARE MAI) */}
                <div
                    className="relative z-dropdown shrink-0 bg-[#0f172a] border-b border-slate-800 shadow-md"
                >
                    <div className="h-header-mob md:h-header">
                        {header}
                    </div>
                </div>
            </div>

            {/* ZONA 3: CORPO CENTRALE (Sidebar + Main) */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* 3a. Sidebar Desktop (SPOSTATA A SINISTRA) */}
                <aside
                    className={`
                        hidden lg:flex flex-col bg-[#0b0f1a]
                        transition-[width,opacity,z-index] duration-300 ease-in-out overflow-hidden relative
                        ${isSuitcaseOpen ? 'border-r-0' : 'border-r border-slate-800/50'}
                        ${isSidebarOpen ? 'w-sidebar 2xl:w-sidebar-wide opacity-100' : 'w-0 opacity-0'}
                    `}
                    style={{ zIndex: LAYOUT.Z.SIDEBAR }}
                >
                    {/* Contenitore interno a larghezza fissa per evitare reflow contenuto */}
                    <div className="h-full w-sidebar 2xl:w-sidebar-wide overflow-hidden flex flex-col">
                        {sidebar}
                    </div>

                </aside>

                {/* 3b. Main Content */}
                <main className="flex-1 relative min-w-0 overflow-hidden bg-slate-950 flex flex-col">
                    {children}
                </main>

            </div>

            {/* ZONA 4: MOBILE NAV */}
            {mobileNav && (
                <div className="lg:hidden relative z-dropdown">
                    {mobileNav}
                </div>
            )}

        </div>
    );
};
