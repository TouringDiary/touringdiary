import React from 'react';
import type { StyleRule } from '../../../types/designSystem';
import type { StyleRuleEditorMeta } from './editorTypes';
import { useDynamicStyles, constructClassName } from '../../../hooks/useDynamicStyles';

// ── Preview Props ─────────────────────────────────────────────────────────────
//
// Interfaccia unica per tutti i preview component.
// `styleClass`: pre-computato dall'host — nessun preview component chiama constructClassName.
// `previewMeta`: metadata editor-only (non DB), passati dall'host ai component che li usano.

interface PreviewProps {
    rule: StyleRule;
    styleClass: string;
    componentKey: string;
    isMobile?: boolean;
    previewMeta?: StyleRuleEditorMeta;
}

// ── Static preview text ───────────────────────────────────────────────────────

const PREVIEW_TEXT: Record<string, string> = {
    admin_h1: 'Pannello Admin',
    admin_h2: 'Impostazioni e Dati',
    admin_card_title: 'Gestione Città',
    hero_title: 'La Tua Guida Definitiva',
    hero_label: 'Scopri il mondo, un passo alla volta.',
    hero_button: "Inizia l'esplorazione",
    city_card_title: 'Roma',
    city_card_sub: "Capitale d'Italia",
    diary_title: 'Diario di Viaggio',
};

const resolveText = (rule: StyleRule, key: string): string =>
    rule.preview_text || PREVIEW_TEXT[key] || key;

// ── Typography fallback ───────────────────────────────────────────────────────
//
// Usato da TypographyPreview quando previewMeta.preview_content non è fornito.
// Stringa tipizzata, nessun template literal con indentazione ambigua.
/**
 * Boundary centralizzato per rendering HTML editoriale.
 *
 * Il contenuto proviene esclusivamente da metadata admin-side,
 * non da input pubblico utente.
 *
 * Se in futuro servirà sanitizzazione,
 * questa funzione diventerà il punto unico di enforcement.
 */
const renderPreviewHtml = (html: string): { __html: string } => ({
    __html: html,
});
const TYPOGRAPHY_FALLBACK_HTML: string = [
    '<h1>Titolo pagina</h1>',
    '<h2>Sottotitolo sezione</h2>',
    '<p>Testo di paragrafo per preview tipografico.</p>',
    '<ul><li>Voce elenco</li><li>Voce elenco</li></ul>',
].join('');

// ── Preview Components ────────────────────────────────────────────────────────

// Attivata via metadata: preview_type === 'html'.
// Legge preview_content dai metadata editor; usa TYPOGRAPHY_FALLBACK_HTML se assente.
// NON è accoppiata a nessuna section label.
const TypographyPreview: React.FC<PreviewProps> = ({ styleClass, previewMeta }) => (
    <div
        className={`prose prose-invert max-w-none ${styleClass} break-words`}
        dangerouslySetInnerHTML={renderPreviewHtml(
            previewMeta?.preview_content ?? TYPOGRAPHY_FALLBACK_HTML
        )}
    />
);

const GenericPreview: React.FC<PreviewProps> = ({ rule, styleClass, componentKey }) => {
    const text = resolveText(rule, componentKey);
    if (componentKey.includes('button')) {
        return <button className={`${styleClass} break-words`}>{text}</button>;
    }
    return <div className={`${styleClass} break-words`}>{text}</div>;
};

const AdminPreview: React.FC<PreviewProps> = ({ rule, styleClass, componentKey }) => (
    <div className="bg-slate-800 p-4 rounded-lg w-full">
        <div className={`${styleClass} w-full break-words`}>
            {resolveText(rule, componentKey)}
        </div>
    </div>
);

// Composite: styleClass = classe live per l'elemento in editing.
// Gli altri elementi usano la cache via useDynamicStyles.
const HeroPreview: React.FC<PreviewProps> = ({ styleClass, componentKey, isMobile }) => {
    const cachedLabel  = useDynamicStyles('hero_label',  isMobile);
    const cachedTitle  = useDynamicStyles('hero_title',  isMobile);
    const cachedButton = useDynamicStyles('hero_button', isMobile);

    const labelClass  = componentKey === 'hero_label'  ? styleClass : cachedLabel;
    const titleClass  = componentKey === 'hero_title'  ? styleClass : cachedTitle;
    const buttonClass = componentKey === 'hero_button' ? styleClass : cachedButton;

    const activeRing = (key: string) =>
        componentKey === key ? 'outline-2 outline-dashed outline-indigo-500' : '';

    return (
        <div className="w-full flex flex-col items-center justify-center gap-2 text-center p-6 bg-slate-800 rounded-lg">
            <div className={`${labelClass}  ${activeRing('hero_label')}  break-words`}>{PREVIEW_TEXT.hero_label}</div>
            <h1  className={`${titleClass}  ${activeRing('hero_title')}  break-words`}>{PREVIEW_TEXT.hero_title}</h1>
            <button className={`${buttonClass} ${activeRing('hero_button')} break-words`}>{PREVIEW_TEXT.hero_button}</button>
        </div>
    );
};

const CityCardPreview: React.FC<PreviewProps> = ({ styleClass, componentKey, isMobile }) => {
    const cachedTitle = useDynamicStyles('city_card_title', isMobile);
    const cachedSub   = useDynamicStyles('city_card_sub',   isMobile);

    const titleClass = componentKey === 'city_card_title' ? styleClass : cachedTitle;
    const subClass   = componentKey === 'city_card_sub'   ? styleClass : cachedSub;

    const activeRing = (key: string) =>
        componentKey === key ? 'outline-2 outline-dashed outline-indigo-500' : '';

    return (
        <div className="rounded-lg shadow-lg bg-slate-800 w-48 h-64 flex flex-col justify-end p-4 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/30" />
            <div className={`${titleClass} ${activeRing('city_card_title')} break-words`}>{PREVIEW_TEXT.city_card_title}</div>
            <div className={`${subClass}   ${activeRing('city_card_sub')}   break-words`}>{PREVIEW_TEXT.city_card_sub}</div>
        </div>
    );
};

const DiaryPreview: React.FC<PreviewProps> = ({ rule, styleClass, componentKey }) => (
    <div className="bg-slate-800 p-4 rounded-lg w-full">
        <h1 className={`${styleClass} ${componentKey === 'diary_title' ? 'outline-2 outline-dashed outline-indigo-500' : ''} break-words`}>
            {resolveText(rule, componentKey)}
        </h1>
        <div className="mt-2 text-sm text-slate-400 break-words">Contenuto del diario...</div>
    </div>
);

// Puramente visuale: distingue shape (testo / linea / dot) dal component_key.
// Nessun context hook applicativo.
const JourneyPreview: React.FC<PreviewProps> = ({ rule, styleClass, componentKey }) => {
    const text   = rule.preview_text || componentKey.replace(/^journey_/, '').replace(/_/g, ' ').toUpperCase();
    const isLine = componentKey.includes('journey_line');
    const isDot  = componentKey.includes('journey_dot');

    return (
        <div className="w-full bg-slate-950 rounded-lg p-4 flex flex-col items-center justify-center gap-3">
            <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Bussola Narrativa</span>
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">SCOPERTA</span>
                {isLine
                    ? <div className={`h-0.5 w-16 rounded-sm ${styleClass} outline-2 outline-dashed outline-indigo-500`} />
                    : isDot
                    ? <div className={`w-6 h-1.5 rounded-full ${styleClass} outline-2 outline-dashed outline-indigo-500`} />
                    : <span className={`${styleClass} outline-2 outline-dashed outline-indigo-500 break-words`}>{text}</span>
                }
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">SELEZIONE</span>
            </div>
            {(isLine || isDot) && (
                <code className="text-[9px] text-slate-500 mt-1">{styleClass || '(nessuna classe)'}</code>
            )}
        </div>
    );
};

// ── Registry ──────────────────────────────────────────────────────────────────
//
// Tre strategie distinte, risolte in ordine di priorità:
//
//   1. 'meta'    — controlla previewMeta.preview_type (massima priorità, intento esplicito).
//                  NON accoppiata a section labels né a component_key patterns.
//
//   2. 'prefix'  — controlla componentKey.startsWith(prefix).
//                  Risoluzione per lunghezza decrescente: prefisso più lungo = più specifico.
//                  Questo elimina l'ambiguità futura (es. 'hero_admin_X' matcha
//                  'hero_admin_' prima di 'hero_' o 'admin_').
//                  L'ordine di dichiarazione nel registry NON influenza la risoluzione.
//
//   3. 'default' — GenericPreview, fallback finale.

type MetaBasedEntry = {
    strategy: 'meta';
    metaKey: 'preview_kind';
    metaValue: string;
    component: React.FC<PreviewProps>;
};
type PrefixBasedEntry = { strategy: 'prefix';  prefix: string;                             component: React.FC<PreviewProps> };
type DefaultEntry     = { strategy: 'default';                                              component: React.FC<PreviewProps> };
type RegistryEntry    = MetaBasedEntry | PrefixBasedEntry | DefaultEntry;

const PREVIEW_REGISTRY: RegistryEntry[] = [
    { strategy: 'meta', metaKey: 'preview_kind', metaValue: 'typography', component: TypographyPreview },
    { strategy: 'prefix',  prefix: 'city_card_',    component: CityCardPreview },
    { strategy: 'prefix',  prefix: 'journey_',      component: JourneyPreview  },
    { strategy: 'prefix',  prefix: 'diary_',        component: DiaryPreview    },
    { strategy: 'prefix',  prefix: 'admin_',        component: AdminPreview    },
    { strategy: 'prefix',  prefix: 'hero_',         component: HeroPreview     },
    { strategy: 'default',                           component: GenericPreview  },
];

// Pre-elaborazione una tantum al caricamento del modulo.
// La risoluzione dei prefix avviene per lunghezza decrescente (longest-first),
// indipendentemente dall'ordine di dichiarazione sopra.
const META_ENTRIES: MetaBasedEntry[]     = PREVIEW_REGISTRY.filter((e): e is MetaBasedEntry   => e.strategy === 'meta');
const PREFIX_ENTRIES: PrefixBasedEntry[] = PREVIEW_REGISTRY
    .filter((e): e is PrefixBasedEntry => e.strategy === 'prefix')
    .sort((a, b) => b.prefix.length - a.prefix.length);
const DEFAULT_ENTRY: DefaultEntry | undefined = PREVIEW_REGISTRY.find((e): e is DefaultEntry => e.strategy === 'default');

const resolvePreviewComponent = (
    componentKey: string,
    previewMeta: StyleRuleEditorMeta | undefined,
): React.FC<PreviewProps> => {
    if (previewMeta) {
        const metaMatch = META_ENTRIES.find(e => previewMeta[e.metaKey] === e.metaValue);
        if (metaMatch) return metaMatch.component;
    }
    const prefixMatch = PREFIX_ENTRIES.find(e => componentKey.startsWith(e.prefix));
    if (prefixMatch) return prefixMatch.component;
    return DEFAULT_ENTRY?.component ?? GenericPreview;
};

// ── Client-side preview metadata registry ────────────────────────────────────
//
// Mappa component_key → StyleRuleEditorMeta per componenti che richiedono preview
// non-default (es. HTML preview). Vive qui nel dominio editor-admin.
// NON è nel DB (StyleRule è puro). NON è in designTokens (è metadata, non token).
//
// Quando una regola DB con preview_type: 'html' deve essere visualizzata,
// aggiungere qui la sua entry. L'host userà questo registry come fallback
// se il caller non passa `meta` esplicitamente come prop.
//
// Esempio futuro:
//   global_body_text: { preview_type: 'html', preview_size: 'large' }

const COMPONENT_PREVIEW_META: Record<string, StyleRuleEditorMeta> = {};

// ── ComponentPreviewHost ──────────────────────────────────────────────────────

interface ComponentPreviewHostProps {
    rule: StyleRule;
    componentKey: string;
    /** Metadata editor-only per preview non-default. Non viene dal DB.
     *  Se omesso, l'host consulta COMPONENT_PREVIEW_META[componentKey]. */
    meta?: StyleRuleEditorMeta;
    isLarge?: boolean;
    isMobile?: boolean;
}

const ComponentPreviewHost: React.FC<ComponentPreviewHostProps> = ({
    rule,
    componentKey,
    meta,
    isLarge = false,
    isMobile = false,
}) => {
    const styleClass    = constructClassName(rule);
    const resolvedMeta  = meta ?? COMPONENT_PREVIEW_META[componentKey];
    const PreviewComponent = resolvePreviewComponent(componentKey, resolvedMeta);

    const containerClasses = [
        'flex items-center justify-center p-4 w-full overflow-hidden',
        isLarge ? 'min-h-[180px]' : '',
        isMobile ? 'max-w-xs' : 'max-w-lg',
    ].filter(Boolean).join(' ');

    return (
        <div className={containerClasses}>
            <PreviewComponent
                rule={rule}
                styleClass={styleClass}
                componentKey={componentKey}
                isMobile={isMobile}
                previewMeta={resolvedMeta}
            />
        </div>
    );
};

export default ComponentPreviewHost;
