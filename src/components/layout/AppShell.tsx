import React, { useEffect, useRef } from 'react';
import { Z_GLOBAL_CHROME } from '@/constants/zIndex';
import { FOCUS_SURFACE_ATTR, workspaceRequiresStableSidebar } from '@/focus/focusModeRegistry';
import { useFocusMode } from '@/focus';
import { useUI } from '@/context/UIContext';

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
 * AppShell — macro layout skeleton.
 * Chrome surfaces use globalChrome tier; sidebar shell stays at base (no document z-index).
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
    const { isWorkspace, workspaceId } = useFocusMode();
    const { setIsSidebarOpen } = useUI();

    const headerWrapperRef = useRef<HTMLDivElement>(null);
    const lastMeasuredHeight = useRef<number>(0);

    const requiresStableSidebar = workspaceRequiresStableSidebar({ workspaceId });

    useEffect(() => {
        if (requiresStableSidebar && !isSidebarOpen) {
            setIsSidebarOpen(true);
        }
    }, [requiresStableSidebar, isSidebarOpen, setIsSidebarOpen]);

    useEffect(() => {
        if (!headerWrapperRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const height = Math.ceil(entry.target.getBoundingClientRect().height);

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

            <div
                ref={headerWrapperRef}
                className="flex flex-col shrink-0 relative"
                style={{ zIndex: Z_GLOBAL_CHROME }}
                data-focus-surface={FOCUS_SURFACE_ATTR.globalChrome}
            >
                <div className="relative shrink-0 transition-transform duration-300">
                    {newsTicker}
                </div>

                <div className="relative shrink-0 bg-[#0f172a] border-b border-slate-800 shadow-md">
                    <div className="h-header-mob md:h-header">
                        {header}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">

                <aside
                    className={`
                        hidden lg:flex flex-col bg-[#0b0f1a]
                        transition-[width,opacity] duration-300 ease-in-out overflow-hidden relative
                        ${isWorkspace ? 'border-r-0' : 'border-r border-slate-800/50'}
                        ${isSidebarOpen ? 'w-sidebar 2xl:w-sidebar-wide opacity-100' : 'w-0 opacity-0'}
                    `}
                    data-focus-surface={FOCUS_SURFACE_ATTR.baseContent}
                >
                    <div className="h-full w-sidebar 2xl:w-sidebar-wide overflow-hidden flex flex-col">
                        {sidebar}
                    </div>
                </aside>

                <main
                    className="flex-1 relative min-w-0 overflow-hidden bg-slate-950 flex flex-col"
                    data-focus-surface={FOCUS_SURFACE_ATTR.baseContent}
                >
                    {children}
                </main>

            </div>

            {mobileNav && (
                <div
                    className="lg:hidden relative"
                    style={{ zIndex: Z_GLOBAL_CHROME }}
                    data-focus-surface={FOCUS_SURFACE_ATTR.globalChrome}
                >
                    {mobileNav}
                </div>
            )}

        </div>
    );
};
