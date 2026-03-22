
import React from 'react';
import type { StyleRule } from '../../../types/designSystem';
// --- FIX: Importa sia l'hook per la cache che la funzione helper per gli stili live ---
import { useDynamicStyles, constructClassName } from '../../../hooks/useDynamicStyles';

const previewTexts: Record<string, string> = {
    admin_h1: "Pannello Admin",
    admin_h2: "Impostazioni e Dati",
    admin_card_title: "Gestione Città",
    hero_title: "La Tua Guida Definitiva",
    hero_label: "Scopri il mondo, un passo alla volta.",
    hero_button: "Inizia l'esplorazione",
    city_card_title: "Roma",
    city_card_sub: "Capitale d'Italia",
    diary_title: "Diario di Viaggio",
};

// --- FIX: La preview ora accetta `rule` per generare lo stile live ---
const TypographyPreview: React.FC<{ rule: StyleRule; isMobile?: boolean; text?: string }> = ({ rule, isMobile }) => {
    const styleClass = constructClassName(rule);
    
    const typographyContent = `
        <h1>Titolo pagina</h1>
        <h2>Sottotitolo sezione</h2>
        <p>Questo è un paragrafo di esempio per una pagina legale.</p>
        <ul>
            <li>Voce elenco</li>
            <li>Voce elenco</li>
        </ul>
    `;

    return (
        <div 
            className={`prose prose-invert max-w-none ${styleClass} break-words`} 
            dangerouslySetInnerHTML={{ __html: typographyContent }} 
        />
    );
};

// --- FIX: La preview ora accetta `rule` per generare lo stile live ---
const GenericPreview: React.FC<{ rule: StyleRule; isMobile?: boolean; text?: string }> = ({ rule, isMobile, text }) => {
    const styleClass = constructClassName(rule);
    const displayText = text || previewTexts[rule.component_key] || rule.component_key;

    if (rule.component_key.includes('button')) {
        return <button className={`${styleClass} break-words`}>{displayText}</button>;
    }
    return <div className={`${styleClass} break-words`}>{displayText}</div>;
};

// --- FIX: La preview ora accetta `rule` per generare lo stile live ---
const AdminPreview: React.FC<{ rule: StyleRule; isMobile?: boolean; text?: string }> = ({ rule, isMobile, text }) => {
    const styleClass = constructClassName(rule);
    const displayText = text || previewTexts[rule.component_key] || rule.component_key;

    return (
        <div className="bg-slate-800 p-4 rounded-lg w-full">
            <div className={`${styleClass} w-full break-words`}>
                {displayText}
            </div>
        </div>
    );
};

// --- FIX: Logica mista per le preview composite ---
const HeroPreview: React.FC<{ rule: StyleRule; componentKey: string; isMobile?: boolean; text?: string }> = ({ rule, componentKey, isMobile, text }) => {
    // Usa la `rule` live per l'elemento in modifica, altrimenti legge dalla cache per gli altri.
    const heroLabelClass = componentKey === 'hero_label' ? constructClassName(rule) : useDynamicStyles('hero_label', isMobile);
    const heroTitleClass = componentKey === 'hero_title' ? constructClassName(rule) : useDynamicStyles('hero_title', isMobile);
    const heroButtonClass = componentKey === 'hero_button' ? constructClassName(rule) : useDynamicStyles('hero_button', isMobile);

    return (
        <div className="w-full flex flex-col items-center justify-center gap-2 text-center p-6 bg-slate-800 rounded-lg">
            <div className={`${heroLabelClass} ${componentKey === 'hero_label' ? 'outline-2 outline-dashed outline-indigo-500' : ''} break-words`}>{text && componentKey === 'hero_label' ? text : previewTexts.hero_label}</div>
            <h1 className={`${heroTitleClass} ${componentKey === 'hero_title' ? 'outline-2 outline-dashed outline-indigo-500' : ''} break-words`}>{text && componentKey === 'hero_title' ? text : previewTexts.hero_title}</h1>
            <button className={`${heroButtonClass} ${componentKey === 'hero_button' ? 'outline-2 outline-dashed outline-indigo-500' : ''} break-words`}>{text && componentKey === 'hero_button' ? text : previewTexts.hero_button}</button>
        </div>
    );
};

// --- FIX: Logica mista per le preview composite ---
const CityCardPreview: React.FC<{ rule: StyleRule; componentKey: string; isMobile?: boolean; text?: string }> = ({ rule, componentKey, isMobile, text }) => {
    const cityCardTitleClass = componentKey === 'city_card_title' ? constructClassName(rule) : useDynamicStyles('city_card_title', isMobile);
    const cityCardSubClass = componentKey === 'city_card_sub' ? constructClassName(rule) : useDynamicStyles('city_card_sub', isMobile);
    
    return (
        <div className="rounded-lg shadow-lg bg-slate-800 w-48 h-64 flex flex-col justify-end p-4 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/30"></div>
            <div className={`${cityCardTitleClass} ${componentKey === 'city_card_title' ? 'outline-2 outline-dashed outline-indigo-500' : ''} break-words`}>
                {text && componentKey === 'city_card_title' ? text : previewTexts.city_card_title}
            </div>
            <div className={`${cityCardSubClass} ${componentKey === 'city_card_sub' ? 'outline-2 outline-dashed outline-indigo-500' : ''} break-words`}>
                {text && componentKey === 'city_card_sub' ? text : previewTexts.city_card_sub}
            </div>
        </div>
    );
};

// --- FIX: La preview ora accetta `rule` per generare lo stile live ---
const DiaryPreview: React.FC<{ rule: StyleRule; isMobile?: boolean; text?: string }> = ({ rule, isMobile, text }) => {
    const styleClass = constructClassName(rule);
    const displayText = text || previewTexts[rule.component_key] || previewTexts.diary_title;
    
    return (
        <div className="bg-slate-800 p-4 rounded-lg w-full">
             <h1 className={`${styleClass} ${rule.component_key === 'diary_title' ? 'outline-2 outline-dashed outline-indigo-500' : ''} break-words`}>{displayText}</h1>
             <div className="mt-2 text-sm text-slate-400 break-words">Contenuto del diario...</div>
        </div>
    );
};

interface ComponentPreviewHostProps {
    rule: StyleRule;
    componentKey: string;
    isLarge?: boolean;
    isMobile?: boolean; 
}

const ComponentPreviewHost: React.FC<ComponentPreviewHostProps> = ({ rule, componentKey, isLarge = false, isMobile = false }) => {
    
    const containerClasses = [
        "flex items-center justify-center p-4 w-full",
        isLarge ? "min-h-[180px]" : "",
        isMobile ? "max-w-xs" : "max-w-lg",
        "overflow-hidden"
    ].filter(Boolean).join(' ');


    const renderPreview = () => {
        const previewText = rule.preview_text;

        // --- FIX: Passa l'intera `rule` ai componenti di preview ---
        if (rule.section === 'typography') {
            return <TypographyPreview rule={rule} isMobile={isMobile} text={previewText} />;
        }

        switch (true) {
            case componentKey.startsWith('admin_'):
                return <AdminPreview rule={rule} isMobile={isMobile} text={previewText} />;
            
            case componentKey.startsWith('hero_'):
                return <HeroPreview rule={rule} componentKey={componentKey} isMobile={isMobile} text={previewText} />;

            case componentKey.startsWith('city_card_'):
                return <CityCardPreview rule={rule} componentKey={componentKey} isMobile={isMobile} text={previewText} />;
            
            case componentKey.startsWith('diary_'):
                return <DiaryPreview rule={rule} isMobile={isMobile} text={previewText} />;

            default:
                return <GenericPreview rule={rule} isMobile={isMobile} text={previewText} />;
        }
    };

    return (
        <div className={containerClasses}>
            {renderPreview()}
        </div>
    );
};

export default ComponentPreviewHost;
