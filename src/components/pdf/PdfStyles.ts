import { StyleSheet } from '@react-pdf/renderer';

export const COLORS = {
  black: '#000000',
  darkGrey: '#333333',
  lightGrey: '#666666',
  white: '#ffffff',
  accent: '#d97706',
  redLine: '#ef4444',
  noteBg: '#fef3c7',
  noteText: '#92400e',
};

export const styles = StyleSheet.create({

  page: {
    /** Header brand più alto (~2× logo): paddingTop allineato all’area fissa. */
    paddingTop: 72,
    /** Riserva area footer (separatore + numerazione) senza sovrapposizione al contenuto. */
    paddingBottom: 52,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: COLORS.black
  },

  headerFixed: {
    position: 'absolute',
    top: 10,
    left: 40,
    right: 40,
    flexDirection: 'column',
    alignItems: 'stretch',
  },

  /** Riga brand: logo + link allineati; la linea vive sotto (headerRule). */
  headerBrandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  /** Linea sotto il brand: gap minimo, senza padding fantasma sotto il logo. */
  headerRule: {
    marginTop: 2,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },

  /** Footer editoriale fisso: stessa posizione su ogni pagina (anche wrap). */
  footerFixed: {
    position: 'absolute',
    bottom: 18,
    left: 40,
    right: 40,
    height: 28,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  footerSeparator: {
    width: '100%',
    borderTopWidth: 0.75,
    borderTopColor: '#e5e7eb',
    marginBottom: 8,
  },

  footerText: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#94a3b8',
    textAlign: 'center',
    letterSpacing: 0.4,
  },

  headerLogoImage: {
    width: 320,
    height: 52
  },

  headerLink: {
    fontSize: 9,
    color: '#94a3b8',
    textDecoration: 'none',
    fontFamily: 'Helvetica'
  },

  coverContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },

  /** Blocco testuale editoriale in alto: titolo → città → date. */
  coverTextBlock: {
    width: '100%',
    alignItems: 'center',
    /** Più respiro sotto la linea header. */
    marginTop: 36,
    marginBottom: 28,
  },

  /** Fascia flex sotto il testo: centra il collage in verticale nello spazio libero. */
  coverPhotoBand: {
    flexGrow: 1,
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 0,
  },

  coverTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 36,
    marginBottom: 10,
    color: '#1e293b',
    textTransform: 'uppercase',
    textAlign: 'center'
  },

  coverSubtitle: {
    fontFamily: 'Helvetica',
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 1.5
  },

  coverDates: {
    fontSize: 14,
    color: COLORS.accent,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },

  coverImageSingle: {
    width: '100%',
    height: 380,
    objectFit: 'cover'
  },

  /** Collage multi-città: colonna centrata con margini laterali ariosi. */
  coverCollageStack: {
    width: '82%',
    alignSelf: 'center',
    flexDirection: 'column',
    marginBottom: 8,
  },

  coverCollageStackImage: {
    width: '100%',
    objectFit: 'cover',
  },

  coverPhotosFooter: {
    width: '100%',
    alignItems: 'center',
  },

  /** Placeholder copertina quando non ci sono hero image. */
  coverEmptyPhotosPlaceholder: {
    width: '100%',
    height: 300,
    marginBottom: 20,
    flexDirection: 'column',
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  coverEmptyPhotosText: {
    fontSize: 10,
    color: '#64748b',
  },

  dayHeaderContainer: {
    marginTop: 8,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
    paddingBottom: 5
  },

  dayTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
    color: COLORS.accent,
    textTransform: 'uppercase'
  },

  timelineItem: {
    flexDirection: 'row',
    minHeight: 60,
    position: 'relative'
  },

  colTime: {
    width: 60,
    alignItems: 'flex-end',
    paddingTop: 2,
    paddingRight: 10
  },

  timeText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#334155'
  },

  colLine: {
    width: 20,
    alignItems: 'center',
    position: 'relative'
  },

  verticalLine: {
    position: 'absolute',
    top: 14,
    bottom: -10,
    width: 1,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.redLine
  },

  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#475569',
    marginTop: 4
  },

  /** Area a destra del QR: riga 75% testo + 25% durata/foto. */
  colContent: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: 10,
    paddingBottom: 14,
    alignItems: 'flex-start',
  },

  /** ~75% — categoria, nome, indirizzo, descrizione, note, distanza */
  colContentMain: {
    flex: 3,
    paddingRight: 8,
    minWidth: 0,
  },

  /** ~25% — durata visita + foto POI */
  colContentSide: {
    flex: 1,
    alignItems: 'flex-start',
  },

  poiCategory: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 2
  },

  poiName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 2
  },

  poiDuration: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'left',
  },

  poiAddress: {
    fontSize: 9,
    fontFamily: 'Helvetica-Oblique',
    color: '#64748b',
    marginBottom: 4
  },

  poiDescription: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#334155',
    lineHeight: 1.4,
    marginBottom: 6
  },

  /** Distanza in testa alla tappa di arrivo (= segmento dalla precedente geo). */
  poiDistanceLead: {
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
    borderStyle: 'dashed',
  },

  poiDistanceLeadText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  inlineImage: {
    width: 88,
    height: 66,
    flexShrink: 0,
    objectFit: 'cover',
  },

  notesBox: {
    backgroundColor: '#fffbeb',
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    marginTop: 4
  },

  notesTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#92400e',
    marginBottom: 2
  },

  notesText: {
    fontSize: 8,
    lineHeight: 1.2,
    color: '#92400e',
    fontFamily: 'Helvetica'
  },

  qrImageSmall: {
    width: 35,
    height: 35,
    marginTop: 4
  }

});