import React from 'react';
import { Check, Layers, Sparkles } from 'lucide-react';
import type { StyleRule } from '@/types/designSystem';
import { constructClassName } from '@/hooks/useDynamicStyles';
import type { StyleRuleEditorMeta } from '../editorTypes';

interface PreviewProps {
  rule: StyleRule;
  styleClass: string;
  componentKey: string;
  isMobile?: boolean;
  previewMeta?: StyleRuleEditorMeta;
}

export const FoundationButtonPreview: React.FC<PreviewProps> = ({ styleClass, rule }) => (
  <button type="button" className={`${styleClass} break-words pointer-events-none`}>
    {rule.preview_text ?? 'Pulsante'}
  </button>
);

export const FoundationModalFramePreview: React.FC<PreviewProps> = ({ styleClass }) => (
  <div className={`${styleClass} w-full min-w-[200px] min-h-[48px] break-words`}>
    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Area strutturale</span>
  </div>
);

export const FoundationModalOverlayPreview: React.FC<PreviewProps> = ({ styleClass }) => (
  <div className={`${styleClass} w-full min-h-[80px] rounded-lg overflow-hidden`}>
    <div className="w-2/3 mx-auto mt-4 h-10 rounded-lg bg-slate-800/80 border border-white/10" />
  </div>
);

export const FoundationModalShellPreview: React.FC<PreviewProps> = ({ styleClass }) => (
  <div className={`${styleClass} w-full max-w-xs min-h-[120px] p-4`}>
    <div className="h-2 w-16 rounded bg-white/10 mb-3" />
    <div className="h-2 w-full rounded bg-white/5 mb-2" />
    <div className="h-2 w-4/5 rounded bg-white/5" />
  </div>
);

export const FoundationSelectableCardPreview: React.FC<PreviewProps> = ({ styleClass, componentKey }) => {
  const isSelected = componentKey.includes('selected') && !componentKey.includes('unselected');
  return (
    <div
      className={`${styleClass} w-full max-w-[220px] min-h-[100px] p-4 relative text-left`}
    >
      <div
        className={`absolute top-3 right-3 w-4 h-4 rounded-full border flex items-center justify-center ${
          isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-white/10 bg-black/20'
        }`}
      >
        {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[4]" />}
      </div>
      <div className="flex items-center gap-2 pr-6">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-indigo-500' : 'bg-slate-800'}`}>
          <Layers className="w-4 h-4 text-white" />
        </div>
        <span className="text-xs font-bold text-white">Opzione</span>
      </div>
    </div>
  );
};

/** Anteprima composita modale Foundation per il tab admin. */
export interface FoundationModalLivePreviewProps {
  rules: Record<string, StyleRule>;
  isMobile?: boolean;
}

function resolveClass(rules: Record<string, StyleRule>, key: string, isMobile: boolean): string {
  const mobileKey = `${key}_mobile`;
  const rule = (isMobile && rules[mobileKey]) || rules[key];
  return rule ? constructClassName(rule) : '';
}

export const FoundationModalLivePreview: React.FC<FoundationModalLivePreviewProps> = ({
  rules,
  isMobile = false,
}) => {
  const overlay = resolveClass(rules, 'foundation_modal_overlay', isMobile);
  const container = resolveClass(rules, 'foundation_modal_container', isMobile);
  const header = resolveClass(rules, 'foundation_modal_header', isMobile);
  const headerIconBox = resolveClass(rules, 'foundation_modal_header_icon_box', isMobile);
  const headerIconGlyph = resolveClass(rules, 'foundation_modal_header_icon_glyph', isMobile);
  const title = resolveClass(rules, 'foundation_modal_title', isMobile);
  const subtitle = resolveClass(rules, 'foundation_modal_subtitle', isMobile);
  const body = resolveClass(rules, 'foundation_modal_body', isMobile);
  const footer = resolveClass(rules, 'foundation_modal_footer', isMobile);
  const footerActions = resolveClass(rules, 'foundation_modal_footer_actions', isMobile);
  const closeOffset = resolveClass(rules, 'foundation_modal_close_offset', isMobile);
  const sectionTitle = resolveClass(rules, 'foundation_section_title', isMobile);
  const sectionIcon = resolveClass(rules, 'foundation_section_title_icon', isMobile);
  const sectionDesc = resolveClass(rules, 'foundation_section_description', isMobile);
  const bodyText = resolveClass(rules, 'foundation_body_text', isMobile);
  const cardSurface = resolveClass(rules, 'foundation_card_surface', isMobile);
  const btnCancel = resolveClass(rules, 'foundation_btn_cancel', isMobile);
  const btnPrimary = resolveClass(rules, 'foundation_btn_primary', isMobile);
  const selectableBase = resolveClass(rules, 'foundation_selectable_card_base', isMobile);
  const selectableSelected = resolveClass(rules, 'foundation_selectable_card_selected', isMobile);

  return (
    <div className={`${overlay} p-4 rounded-xl`}>
      <div className={`${container} max-w-lg mx-auto pointer-events-none`}>
        <div className={`absolute ${closeOffset} w-6 h-6 rounded-full bg-red-600 shrink-0`} aria-hidden />
        <header className={header}>
          <div className="flex items-center gap-3 pr-10 min-w-0">
            <div className={headerIconBox}>
              <Sparkles className={headerIconGlyph || 'w-6 h-6'} aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 className={`${title} mb-0.5`}>Anteprima Foundation</h3>
              <p className={subtitle}>Mockup live dalle impostazioni correnti</p>
            </div>
          </div>
        </header>
        <div className={`${body} space-y-4 max-h-[280px]`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className={sectionIcon || 'w-4 h-4 text-amber-500'} aria-hidden />
              <h4 className={sectionTitle}>Titolo sezione</h4>
            </div>
            <p className={sectionDesc}>Descrizione di esempio della sezione.</p>
            <div className={cardSurface}>
              <p className={`${bodyText} font-normal`}>Testo nel corpo modale.</p>
            </div>
          </div>
          <div className={`${selectableBase} ${selectableSelected} max-w-[240px]`}>
            <span className="text-xs font-bold text-white">Card selezionabile</span>
          </div>
        </div>
        <footer className={footer}>
          <div className={footerActions}>
            <button type="button" className={btnCancel}>
              Annulla
            </button>
            <button type="button" className={btnPrimary}>
              Conferma
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
