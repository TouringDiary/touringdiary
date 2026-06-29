
import React, { useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { Bot, ChevronUp, ChevronDown, Loader2, MessageCircle, Send } from 'lucide-react';
import { useDynamicStyles } from '../../../hooks/useDynamicStyles';
import { getCachedSetting } from '../../../services/settingsService';
import { ImageWithFallback } from '../../common/ImageWithFallback';

import { AiRuntimeBanner } from '@/components/ai/AiRuntimeBanner';
import type { AiRuntimeStatus } from '@/services/ai/aiRuntimeStatus';
import { HERO_COMPACT, heroCompactFieldShell } from './heroCompactTokens';
import { HeroCompactTypingField } from './components/HeroCompactTypingField';
import { HeroCompactInputShell, HeroCompactInputInner } from './components/HeroCompactInputShell';
import { HeroExpandableSection } from './components/HeroExpandableSection';
import { HeroCollapsedBar } from './components/HeroCollapsedBar';
import type { HeroStackedMode } from '../HeroSection';

interface HeroAiModuleProps {
    isAiExpanded: boolean;
    isAiLoading: boolean;
    aiResponse: string;
    typingText: string;
    aiQuery: string;
    aiRuntimeStatus: AiRuntimeStatus;
    isMobileCompact?: boolean;
    isStackedLayout?: boolean;
    stackedMode?: HeroStackedMode;

    setIsAiExpanded: (v: boolean) => void;
    setAiQuery: (v: string) => void;
    setAiResponse: (v: string) => void;
    handleAiSubmit: (query?: string) => void;
}

export const HeroAiModule = (props: HeroAiModuleProps) => {
    const isMobileCompact = props.isMobileCompact ?? false;
    const isStackedLayout = props.isStackedLayout ?? false;
    const stackedMode: HeroStackedMode = props.stackedMode ?? (isStackedLayout ? 'compact' : 'desktop');

    const bgImage = getCachedSetting<string>('ai_box');

    const aiTitleStyle = useDynamicStyles('ai_title', isMobileCompact);
    const aiBlocked = !props.aiRuntimeStatus.available;

    const showFullAiContent = props.isAiExpanded || !isStackedLayout;
    const toggleExpanded = () => props.setIsAiExpanded(!props.isAiExpanded);

    const aiInputRef = useRef<HTMLTextAreaElement>(null);
    const pendingFocusRef = useRef(false);

    const focusAiInput = () => {
        const el = aiInputRef.current;
        if (!el) return;
        el.focus();
        const len = el.value.length;
        try {
            el.setSelectionRange(len, len);
        } catch {
            /* setSelectionRange not supported in some states */
        }
    };

    // Fallback only: if the synchronous focus below could not run (ref not yet
    // attached), focus once the expanded input is committed. On mobile this path
    // may not reopen the keyboard (see flushSync note), but it preserves focus.
    useEffect(() => {
        if (stackedMode === 'expanded' && pendingFocusRef.current) {
            pendingFocusRef.current = false;
            focusAiInput();
        }
    }, [stackedMode]);

    // Tapping the compact input must behave exactly like pressing the expand
    // arrow, but keep focus in the input so the mobile keyboard stays open.
    //
    // flushSync is REQUIRED here and cannot be replaced by useLayoutEffect /
    // requestAnimationFrame:
    // - The compact and expanded layouts use two DIFFERENT <textarea> elements,
    //   so expanding unmounts the focused compact input and mounts a new one.
    // - On iOS Safari (and Android) a programmatic focus() only opens/keeps the
    //   soft keyboard when it runs INSIDE the same user-gesture call stack.
    //   A useLayoutEffect/rAF callback runs in a later tick, outside that gesture,
    //   so the keyboard would close and not reopen.
    // - flushSync forces the expanded input to mount synchronously within this
    //   onFocus handler, letting us move focus to it before the gesture ends,
    //   which keeps the keyboard open without any flicker.
    const handleCompactInputFocus = () => {
        if (props.isAiExpanded) return;
        pendingFocusRef.current = true;
        flushSync(() => {
            props.setIsAiExpanded(true);
        });
        if (aiInputRef.current) {
            pendingFocusRef.current = false;
            focusAiInput();
        }
    };

    // --- Compact header (twin card, both modules closed) ---
    const renderCompactHeader = (rowClass: string) => (
        <div
            className={`flex items-center justify-between cursor-pointer relative z-home-hero-surface shrink-0 ${rowClass}`}
            onClick={toggleExpanded}
        >
            <div className="flex items-center gap-2 min-w-0">
                <div className="bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)] shrink-0 w-1 h-5" />
                <h3 className={`${aiTitleStyle} truncate`}>Il Tuo Consulente</h3>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                <div
                    className="p-1.5 bg-slate-800/50 rounded-full border border-white/10 text-white backdrop-blur-sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded();
                    }}
                >
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>
        </div>
    );

    const renderDesktopHeader = () => (
        <div
            className="flex items-center justify-between cursor-pointer lg:cursor-default relative z-home-hero-surface shrink-0 h-8 mb-2"
            onClick={toggleExpanded}
        >
            <div className="flex items-center gap-2 min-w-0">
                <div className="bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)] shrink-0 w-1.5 h-8" />
                <h3 className={`${aiTitleStyle} truncate`}>Il Tuo Consulente</h3>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                <Bot className="w-6 h-6 text-purple-500 animate-pulse" />
                <div
                    className="lg:hidden p-1.5 bg-slate-800/50 rounded-full border border-white/10 text-white backdrop-blur-sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded();
                    }}
                >
                    {props.isAiExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </div>
        </div>
    );

    // --- COMPACT TWIN (both modules closed): original side-by-side card content ---
    const renderCompactTwin = () => (
        <div className={`relative z-home-hero-surface ${HERO_COMPACT.compactTwinStack} ${HERO_COMPACT.bodyGap}`}>
            {renderCompactHeader(HERO_COMPACT.headerRowAi)}
            <div
                className={`${heroCompactFieldShell} ${HERO_COMPACT.fieldPadding}`}
                role="region"
                aria-label="Risposta consulente AI"
            >
                {aiBlocked ? (
                    <div className="min-w-0 w-full overflow-hidden">
                        <AiRuntimeBanner status={props.aiRuntimeStatus} className="w-full" />
                    </div>
                ) : props.isAiLoading ? (
                    <div className="flex items-center gap-2 min-w-0 w-full text-slate-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500 shrink-0" />
                        <span className={`${HERO_COMPACT.fieldText} text-purple-300 uppercase tracking-widest font-mono animate-pulse`}>
                            Elaborazione...
                        </span>
                    </div>
                ) : props.aiResponse ? (
                    <p className={`${HERO_COMPACT.fieldText} text-slate-200 min-w-0 w-full`}>
                        {props.aiResponse}
                    </p>
                ) : (
                    <HeroCompactTypingField
                        bare
                        text={props.typingText}
                        variant="ai"
                        onClick={() => props.handleAiSubmit(props.typingText)}
                        disabled={aiBlocked}
                    />
                )}
            </div>

            <HeroCompactInputShell>
                <HeroCompactInputInner className="pr-9">
                    <textarea
                        value={props.aiQuery}
                        onChange={(e) => props.setAiQuery(e.target.value)}
                        onFocus={handleCompactInputFocus}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (!props.isAiLoading && !aiBlocked) props.handleAiSubmit();
                            }
                        }}
                        disabled={aiBlocked}
                        placeholder={aiBlocked ? 'Consulente AI non disponibile' : "Chiedi all'AI..."}
                        rows={1}
                        className={`w-full min-w-0 bg-transparent border-none outline-none resize-none ${HERO_COMPACT.fieldInputText}`}
                    />
                </HeroCompactInputInner>
                <button
                    type="button"
                    onClick={() => props.handleAiSubmit()}
                    disabled={!props.aiQuery.trim() || props.isAiLoading || aiBlocked}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 shrink-0 p-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95"
                >
                    <Send className="w-3 h-3" />
                </button>
            </HeroCompactInputShell>
        </div>
    );

    // --- MINIMAL BAR (the other module is open) ---
    const renderMinimalBar = () => (
        <HeroCollapsedBar
            title="Il Tuo Consulente"
            titleClassName={aiTitleStyle}
            accentClassName="bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
            expanded={false}
            onClick={toggleExpanded}
        />
    );

    // --- EXPANDED HEADER (stacked, this module open) ---
    const renderExpandedHeader = () => (
        <HeroCollapsedBar
            title="Il Tuo Consulente"
            titleClassName={aiTitleStyle}
            accentClassName="bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
            expanded
            onClick={toggleExpanded}
        />
    );

    const renderAiBody = () => (
        <div className={`relative z-home-hero-surface flex-1 flex flex-col min-h-0 justify-between ${
            isStackedLayout ? 'px-3 pt-2 pb-3' : 'mt-4'
        } ${
            showFullAiContent && props.isAiExpanded ? 'flex' : showFullAiContent ? 'hidden lg:flex' : 'hidden'
        }`}>
            {aiBlocked && (
                <AiRuntimeBanner status={props.aiRuntimeStatus} className="mb-3" />
            )}
            {props.isAiLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 bg-slate-950/50 rounded-xl border border-slate-800/50 min-h-[8rem]">
                    <Loader2 className="w-10 h-10 animate-spin text-purple-500"/>
                    <span className="text-xs font-mono animate-pulse text-purple-300 uppercase tracking-widest">Elaborazione...</span>
                </div>
            ) : props.aiResponse ? (
                <div className="flex-1 flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 mb-3">
                        <div className="bg-slate-950/80 p-4 rounded-xl border border-purple-500/20 text-sm text-slate-200 leading-relaxed shadow-inner backdrop-blur-md">
                            {props.aiResponse}
                        </div>
                    </div>
                    <button onClick={() => { props.setAiResponse(''); props.setAiQuery(''); }} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-slate-700 flex items-center justify-center gap-2 shadow-lg">
                        <MessageCircle className="w-4 h-4 text-purple-500"/> Nuova Domanda
                    </button>
                </div>
            ) : (
                <>
                    <div className="flex-1 flex flex-col justify-start mb-3 overflow-hidden min-h-[6rem]">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[9px] text-purple-400 font-bold uppercase tracking-widest flex items-center gap-1.5 animate-pulse bg-purple-900/10 px-2 py-0.5 rounded border border-purple-500/20 backdrop-blur-sm">
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full inline-block"></span>
                                Sta scrivendo...
                            </span>
                        </div>
                        <div 
                            onClick={() => { if (!props.isAiLoading && !aiBlocked) props.handleAiSubmit(props.typingText); }}
                            className={`bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 flex-1 relative overflow-hidden shadow-inner backdrop-blur-sm ${aiBlocked ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-500/50 cursor-pointer group transition-all'}`}
                        >
                            <p className="text-slate-300 font-medium text-sm leading-relaxed font-mono h-full overflow-hidden">
                                {props.typingText}
                                <span className="w-0.5 h-4 bg-purple-500 inline-block ml-0.5 animate-pulse translate-y-0.5"></span>
                            </p>
                            
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[9px] font-bold text-purple-400 uppercase bg-slate-900 px-3 py-1.5 rounded-full border border-purple-500/30 shadow-lg">
                                <MessageCircle className="w-3 h-3"/> Clicca per chiedere
                            </div>
                        </div>
                    </div>

                    <div className="relative shrink-0">
                        <textarea 
                            ref={aiInputRef}
                            value={props.aiQuery}
                            onChange={(e) => props.setAiQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (!props.isAiLoading && !aiBlocked) props.handleAiSubmit();
                                }
                            }}
                            disabled={aiBlocked}
                            placeholder={aiBlocked ? 'Consulente AI non disponibile' : "Chiedi all'AI..."} 
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:border-purple-500 focus:outline-none resize-none shadow-inner h-12 min-h-[3rem] overflow-hidden leading-tight placeholder:text-slate-600 transition-all backdrop-blur-sm"
                        />
                        <button onClick={() => props.handleAiSubmit()} disabled={!props.aiQuery.trim() || props.isAiLoading || aiBlocked} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95">
                            <Send className="w-3.5 h-3.5"/>
                        </button>
                    </div>
                </>
            )}
        </div>
    );

    const renderStacked = () => {
        if (stackedMode === 'minimal') return renderMinimalBar();
        if (stackedMode === 'compact') return renderCompactTwin();
        return (
            <>
                {renderExpandedHeader()}
                <HeroExpandableSection expanded={props.isAiExpanded}>
                    {renderAiBody()}
                </HeroExpandableSection>
            </>
        );
    };

    return (
        <div
            id="tour-ai-button"
            className={`min-w-0 relative rounded-2xl border border-slate-800 bg-slate-900 flex flex-col shadow-2xl transition-all duration-300 ease-in-out overflow-hidden ${
                isStackedLayout
                    ? `h-auto ${stackedMode === 'compact' ? HERO_COMPACT.boxPadding : ''}`
                    : `p-4 ${!props.isAiExpanded ? 'h-auto' : 'h-[30rem] lg:h-full'}`
            }`}
            data-focus-surface="dimmed-background"
        >
            {bgImage && (
                <div className="absolute inset-0 pointer-events-none">
                     <ImageWithFallback 
                        src={bgImage} 
                        alt="AI Background" 
                        className="w-full h-full object-cover opacity-40 grayscale-[20%]"
                        priority={false} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent"></div>
                </div>
            )}
            
            <div className="relative z-home-hero-surface flex flex-col min-h-0">
                {isStackedLayout ? renderStacked() : (
                    <>
                        {renderDesktopHeader()}
                        {renderAiBody()}
                    </>
                )}
            </div>
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2 z-0"></div>
        </div>
    );
};
