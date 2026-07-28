/** Larghezza pannello workspace globale (~95% viewport). */
export const WORKSPACE_GLOBAL_PANEL_WIDTH_RATIO = 0.95;

/** Altezza massima pannello desktop — espansione binder top-origin sotto header. */
export const WORKSPACE_GLOBAL_PANEL_HEIGHT = '35rem';

export const WORKSPACE_BINDER_TAB_HEIGHT = '2rem';

export const MOBILE_NAV_HEIGHT_CSS = '4rem';

/**
 * Contratto layout hub Workspace (pannello ad altezza fissa).
 * Ogni `*Section` sotto `GlobalWorkspacePanelBody` deve:
 * - riempire il tabpanel (`h-full min-h-0`);
 * - gestire lo scroll sul proprio root o su un figlio `flex-1 min-h-0 overflow-y-auto`;
 * - non affidare l'altezza al contenuto (il body del hub non scrolla).
 */
export const WORKSPACE_HUB_TABPANEL_CLASS = 'h-full min-h-0 flex flex-col';

/** Stato vuoto / messaggio contestuale centrato nel pannello fisso. */
export const WORKSPACE_SECTION_PLACEHOLDER_CLASS =
  'p-6 text-sm text-slate-500 h-full min-h-0 flex items-center justify-center text-center';

/** Root scrollabile standard per sezioni con contenuto operativo. */
export const WORKSPACE_SECTION_SCROLL_ROOT_CLASS =
  'p-3 lg:p-4 h-full min-h-0 overflow-y-auto custom-scrollbar';
