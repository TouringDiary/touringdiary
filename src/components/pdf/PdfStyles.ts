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
  distanceBg: '#fee2e2',
  distanceText: '#dc2626'
};

export const styles = StyleSheet.create({

  page: {
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: COLORS.black
  },

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
    borderBottomColor: '#e5e7eb'
  },

  headerLogoImage: {
    width: 150,
    height: 26
  },

  headerLink: {
    fontSize: 9,
    color: '#94a3b8',
    textDecoration: 'none',
    fontFamily: 'Helvetica'
  },

  coverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
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
    marginBottom: 30,
    lineHeight: 1.5
  },

  coverImageMain: {
    width: '100%',
    height: 300,
    marginBottom: 20
  },

  coverImagesGrid: {
    width: '100%',
    height: 300,
    marginBottom: 20,
    flexDirection: 'column'
  },

  dayHeaderContainer: {
    marginTop: 25,
    marginBottom: 20,
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

  distanceBadge: {
    position: 'absolute',
    top: 20,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#fca5a5'
  },

  distanceText: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
    textTransform: 'uppercase'
  },

  colContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 20
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
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#64748b',
    marginBottom: 2
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

  inlineImage: {
    width: 100,
    height: 60,
    marginBottom: 6
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