
import { StyleSheet } from '@react-pdf/renderer';

// PALETTE COLORI (PDF SAFE)
export const COLORS = {
  black: '#000000',
  darkGrey: '#333333',
  lightGrey: '#666666',
  white: '#ffffff',
  accent: '#d97706',    // Amber-600
  redLine: '#ef4444',   // Red-500
  noteBg: '#fef3c7',    // Amber-100 (Sfondo Note)
  noteText: '#92400e',  // Amber-800
  distanceBg: '#fee2e2',// Red-100
  distanceText: '#dc2626' // Red-600
};

export const styles = StyleSheet.create({
  // LAYOUT PAGINA (A4 BIANCO)
  page: {
    paddingTop: 80, 
    paddingBottom: 40,
    paddingHorizontal: 40, // Margini più ampi per stampa
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff', // BIANCO PURO
    color: COLORS.black,
  },
  
  // HEADER FISSO
  headerFixed: {
    position: 'absolute',
    top: 25,
    left: 40,
    right: 40,
    height: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb', // slate-200
  },
  // LOGO: Usiamo un'immagine rasterizzata per fedeltà assoluta
  headerLogoImage: {
    width: 150, 
    height: 38,
    objectFit: 'contain'
  },
  headerLink: {
    fontSize: 9,
    color: '#94a3b8',
    textDecoration: 'none',
    fontFamily: 'Helvetica',
  },

  // COPERTINA
  coverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverTitle: {
    fontFamily: 'Times-Bold', // Serif per eleganza
    fontSize: 36,
    marginBottom: 10,
    color: '#1e293b', // Slate-800
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontFamily: 'Helvetica',
    fontSize: 14,
    color: '#64748b', // Slate-500
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 1.5,
  },
  coverDates: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.accent,
    marginBottom: 40,
  },
  coverImageMain: {
    width: '100%',
    height: 300,
    borderRadius: 4,
    marginBottom: 20,
    objectFit: 'cover',
  },
  coverImagesGrid: {
      width: '100%',
      height: 300,
      marginBottom: 20,
      flexDirection: 'column',
      gap: 4
  },

  // SEZIONE GIORNO
  dayHeaderContainer: {
    marginTop: 25,
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
    paddingBottom: 5,
  },
  dayTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // TIMELINE LAYOUT (SCHEMATICO)
  timelineItem: {
    flexDirection: 'row',
    minHeight: 60,
    position: 'relative',
    marginBottom: 0,
  },
  
  // COL 1: ORA (Sx)
  colTime: {
    width: 60,
    alignItems: 'flex-end',
    paddingTop: 2,
    paddingRight: 10,
  },
  timeText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#334155', // Slate-700
  },

  // COL 2: LINEA (Centro)
  colLine: {
    width: 20,
    alignItems: 'center',
    position: 'relative',
  },
  verticalLine: {
    position: 'absolute',
    top: 14,
    bottom: -10,
    width: 1, // Linea sottile
    borderLeftWidth: 1,
    borderLeftColor: COLORS.redLine,
    borderLeftStyle: 'dashed',
    zIndex: 1,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#475569', // Slate-600
    zIndex: 2,
    marginTop: 4,
  },
  // Badge KM (Rosso)
  distanceBadge: {
    position: 'absolute',
    top: '50%',
    backgroundColor: '#fee2e2', // Red-100
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    zIndex: 3,
    transform: 'translateY(-50%)',
    borderWidth: 0.5,
    borderColor: '#fca5a5'
  },
  distanceText: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626', // Red-600
    textTransform: 'uppercase',
  },

  // COL 3: CONTENUTO (Dx) - PULITO, NO BOX
  colContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 20,
  },
  // Niente background, niente border
  poiCategory: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#94a3b8', // Slate-400
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  poiName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold', // O Times-Bold per eleganza
    color: '#0f172a', // Slate-900
    marginBottom: 2,
  },
  poiDuration: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#64748b',
    marginBottom: 2,
    marginTop: -2
  },
  poiAddress: {
    fontSize: 9,
    fontFamily: 'Helvetica-Oblique',
    color: '#64748b',
    marginBottom: 4,
  },
  poiDescription: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#334155',
    lineHeight: 1.4,
    marginBottom: 6,
  },
  
  // IMMAGINE (Opzionale)
  inlineImage: {
    width: 100,
    height: 60,
    borderRadius: 4,
    objectFit: 'cover',
    marginBottom: 6,
  },

  // BOX NOTE GIALLO (Post-it style)
  noteBox: {
    backgroundColor: '#fffbeb', // Amber-50
    padding: 8,
    borderRadius: 0, // Quadrato come post-it
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b', // Amber-500
    marginTop: 4,
  },
  noteText: {
    fontSize: 9,
    color: '#92400e', // Amber-800
    fontStyle: 'italic',
    fontFamily: 'Times-Italic'
  },

  // QR CODE (Nel layout Time)
  qrImageSmall: {
      width: 35,
      height: 35,
      marginTop: 4
  }
});
