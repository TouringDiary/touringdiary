/**
 * SoT layout Valigia editor (griglia / virtualizzazione / slot inline add).
 * Importare da qui: niente magic number nei componenti UI.
 */

/** Soglia item oltre la quale si attiva useVirtualWindow. */
export const SUITCASE_ITEMS_VIRTUALIZE_AT = 28;

/**
 * Contratto virtualizzazione: altezza riga costante (card + gap).
 * Se SuitcaseItemRow cambia layout, aggiornare qui; niente altezze dinamiche senza rivedere useVirtualWindow.
 */
export const SUITCASE_ITEM_ROW_HEIGHT_PX = 72;

/**
 * Altezza CSS dello slot inline «aggiungi elemento» (CategorySection).
 * Deve restare allineata al box renderizzato (ex h-[50px]).
 */
export const CATEGORY_INLINE_EDITOR_HEIGHT_PX = 50;

/**
 * Spazio riservato nello scroll virtuale quando lo slot inline è montato (CategoryItemsGrid).
 * Valore storico distinto dall’h CSS finché gap/padding griglia non sono modellati a parte.
 */
export const CATEGORY_INLINE_EDITOR_VIRTUAL_RESERVE_PX = 72;

/** Cap viewport lista virtualizzata (allineato a max-h CSS / style.maxHeight). */
export const SUITCASE_VIRTUAL_LIST_MAX_HEIGHT_VH = 55;
export const SUITCASE_VIRTUAL_LIST_MAX_HEIGHT_PX = 480;

/**
 * Contratto colonne griglia item (virtualizzazione + className).
 * `cols` da useMobileCompact deve coincidere con questa griglia Tailwind (md ≡ !MOBILE_COMPACT).
 */
export const SUITCASE_CATEGORY_GRID_COLS_COMPACT = 1;
export const SUITCASE_CATEGORY_GRID_COLS_WIDE = 2;
export const SUITCASE_CATEGORY_GRID_CLASSNAME = 'grid grid-cols-1 md:grid-cols-2 gap-3';
