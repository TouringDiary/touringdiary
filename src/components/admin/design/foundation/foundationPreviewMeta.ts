import type { StyleRuleEditorMeta } from '../editorTypes';

/** Metadata preview editor per token Foundation modali. */
const FOUNDATION_PREVIEW_META: Record<string, StyleRuleEditorMeta> = {
  foundation_modal_container: { preview_kind: 'modal_shell' },
  foundation_modal_overlay: { preview_kind: 'modal_overlay' },
  foundation_modal_header: { preview_kind: 'modal_frame' },
  foundation_modal_body: { preview_kind: 'modal_frame' },
  foundation_modal_footer: { preview_kind: 'modal_frame' },
  foundation_selectable_card_base: { preview_kind: 'selectable_card' },
  foundation_selectable_card_selected: { preview_kind: 'selectable_card' },
  foundation_selectable_card_unselected: { preview_kind: 'selectable_card' },
  foundation_btn_cancel: { preview_kind: 'button' },
  foundation_btn_primary: { preview_kind: 'button' },
};

export function getFoundationPreviewMeta(baseKey: string): StyleRuleEditorMeta | undefined {
  return FOUNDATION_PREVIEW_META[baseKey];
}

export function getFoundationPreviewMetaForKey(componentKey: string): StyleRuleEditorMeta | undefined {
  const baseKey = componentKey.replace(/_mobile$/, '');
  return FOUNDATION_PREVIEW_META[baseKey];
}
