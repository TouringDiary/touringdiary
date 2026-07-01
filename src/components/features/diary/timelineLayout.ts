/**
 * GEOMETRIA DEL BINARIO (timeline) DEL DIARIO — larghezza CALCOLATA, non "a occhio".
 *
 * Filosofia: la timeline occupa il MINIMO orizzontale; tutto lo spazio restante va al
 * contenuto del Diario. Per questo:
 *   • la DISTANZA vive SULLA linea verticale (nel vuoto fra due tappe) → 0 colonne extra;
 *   • l'ICONA del mezzo è appoggiata sulla CURVA, nella sola corsia a sinistra della linea;
 *   • la corsia a sinistra è larga solo quanto basta perché l'icona del mezzo "scavalchi"
 *     il nodo della tappa senza toccarlo.
 *
 * Ingombro:  [ margine | icona mezzo (sulla curva) | linea + nodi tappa | gap ] contenuto →
 *
 * Aumentando una costante, linea, corsia e larghezza si ricalcolano da sole e restano
 * coerenti fra ItineraryItemCard e DiaryMemoCard.
 */

/**
 * ⌀ unico dei cerchi della timeline: tappe (POI) e spostamenti hanno la STESSA dimensione
 * finale, così da appartenere visivamente allo stesso componente grafico.
 * Tenuto compatto per liberare spazio orizzontale a favore del contenuto.
 * NB: questo è l'INGOMBRO geometrico (spaziatura, archi, larghezza del binario); i cerchi
 *     VISIBILI nelle card sono volutamente un filo più piccoli (vedi classi `w-[..]`) per
 *     alleggerire la timeline, SENZA alterare la geometria qui calcolata.
 */
export const TL_NODE = 30;
export const TL_TRANSPORT = 30;

/** Margine di sicurezza a sinistra del binario. */
const TL_LANE_MARGIN = 4;
/** Gap minimo fra l'icona del mezzo (sulla curva) e il nodo della tappa. */
const TL_NODE_CLEAR = 2;
/** Spazio fra il nodo tappa e l'inizio del contenuto. */
const TL_CONTENT_GAP = 6;

/**
 * Quanto l'icona del mezzo è spostata a sinistra della linea (= apice della curva).
 * Deve bastare perché il bordo destro dell'icona scavalchi il bordo sinistro del nodo:
 *   ARC_REACH ≥ TL_TRANSPORT/2 + TL_NODE/2 + TL_NODE_CLEAR.
 */
export const TL_ARC_REACH = TL_TRANSPORT / 2 + TL_NODE / 2 + TL_NODE_CLEAR;

/** Posizione (px) della linea verticale dentro il binario. I nodi sono centrati qui. */
export const TL_LINE_X = TL_LANE_MARGIN + TL_ARC_REACH + TL_TRANSPORT / 2;
/** Larghezza totale (px) del binario: il contenuto inizia esattamente dopo questo valore. */
export const TL_RAIL_W = TL_LINE_X + TL_NODE / 2 + TL_CONTENT_GAP;
