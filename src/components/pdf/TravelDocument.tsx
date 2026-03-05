
import React from 'react';
import { Document, Page, Text, View, Image, Link } from '@react-pdf/renderer';
import { styles, COLORS } from './PdfStyles';
import { PreparedItinerary, PreparedItineraryItem } from '../../utils/pdfUtils'; 

interface TravelDocumentProps {
  itinerary: PreparedItinerary; 
  logoBase64: string; 
  options: {
    photos: boolean;
    qrCodes: boolean;
    summary: boolean;
    details: boolean; 
    notes: boolean;
    resources: boolean;
  };
}

// --- HEADER FISSO CON LOGO RASTERIZZATO ---
const Header = ({ logo }: { logo: string }) => (
    <View style={styles.headerFixed} fixed>
        <Image src={logo} style={styles.headerLogoImage} />
        <Link src="https://touringdiary-it.com/" style={styles.headerLink}>
            touringdiary-it.com
        </Link>
    </View>
);

// --- COPERTINA ---
const CoverPage = ({ itinerary, logo }: { itinerary: PreparedItinerary, logo: string }) => {
    const images = itinerary.citiesInfo.map(c => c.heroImageBase64).filter(Boolean) as string[];
    
    return (
        <Page size="A4" style={styles.page}>
            <Header logo={logo} />
            <View style={styles.coverContainer}>
                <Text style={styles.coverTitle}>
                    {itinerary.name && itinerary.name.trim() !== '' ? itinerary.name : 'IL MIO VIAGGIO'}
                </Text>
                <Text style={styles.coverSubtitle}>
                    {itinerary.formattedCityList}
                    {'\n'}
                    <Text style={{ fontSize: 14, color: COLORS.accent, fontFamily: 'Helvetica-Bold' }}>
                        {itinerary.startDate ? `${itinerary.startDate} — ${itinerary.endDate || '...'}` : 'Date da definire'}
                    </Text>
                </Text>

                {/* Griglia Immagini Dinamica */}
                {images.length > 0 ? (
                    <View style={styles.coverImagesGrid}>
                        <Image src={images[0]} style={styles.coverImageMain} />
                        {images.length > 1 && (
                            <View style={{ flexDirection: 'row', height: '35%', gap: 4 }}>
                                <Image src={images[1]} style={{ flex: 1, objectFit: 'cover' }} />
                                {images[2] && <Image src={images[2]} style={{ flex: 1, objectFit: 'cover' }} />}
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={[styles.coverImagesGrid, { backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }]}>
                         <Text style={{ fontSize: 10, color: '#64748b' }}>NESSUNA FOTO DISPONIBILE</Text>
                    </View>
                )}
            </View>
        </Page>
    );
};

// --- VISUAL DAY PAGE (TIMELINE SCHEMATICA) ---
const VisualDayPage: React.FC<{ items: PreparedItineraryItem[], dayIndex: number, options: any, logo: string }> = ({ items, dayIndex, options, logo }) => {
    const sortedItems = items.sort((a,b) => a.timeSlotStr.localeCompare(b.timeSlotStr));

    return (
        <Page size="A4" style={styles.page}>
            <Header logo={logo} />
            
            {/* Header Giorno Stile Pillola */}
            <View style={styles.dayHeaderContainer}>
                <Text style={styles.dayTitle}>Giorno {dayIndex + 1}</Text>
            </View>

            <View>
                {sortedItems.map((item, idx) => {
                    const isLast = idx === sortedItems.length - 1;
                    const hasDist = item.distanceFromPrev !== null && item.distanceFromPrev > 0;

                    return (
                        <View key={item.id} style={styles.timelineItem} wrap={false}>
                            
                            {/* COL 1: ORA + QR CODE */}
                            <View style={styles.colTime}>
                                <Text style={styles.timeText}>{item.timeSlotStr}</Text>
                                {options.qrCodes && item.qrCodeUrl && (
                                    <Image src={item.qrCodeUrl} style={styles.qrImageSmall} />
                                )}
                            </View>

                            {/* COL 2: LINEA GRAFICA (Sempre visibile per coerenza) */}
                            <View style={styles.colLine}>
                                {/* Pallino */}
                                <View style={styles.timelineDot} />
                                
                                {/* Linea Rossa Tratteggiata (Solo se non è l'ultimo) */}
                                {!isLast && <View style={styles.verticalLine} />}

                                {/* Badge Distanza (Sulla linea, se presente) */}
                                {hasDist && (
                                    <View style={[styles.distanceBadge, { top: -20 }]}> 
                                        {/* Offset negativo per metterlo TRA questo item e il precedente */}
                                        <Text style={styles.distanceText}>{item.distanceFromPrev} KM</Text>
                                    </View>
                                )}
                            </View>
                            
                            {/* COL 3: CONTENUTO (LISTA PULITA, NO BOX) */}
                            <View style={styles.colContent}>
                                {/* Layout Orizzontale per Immagine (se presente) e Testo */}
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    {/* IMMAGINE CONDIZIONATA DAL TOGGLE */}
                                    {options.photos && item.processedImage && (
                                        <Image 
                                            src={item.processedImage} 
                                            style={styles.inlineImage} 
                                        />
                                    )}
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.poiCategory}>{item.poi.category}</Text>
                                        <Text style={styles.poiName}>{item.poi.name}</Text>
                                        
                                        {item.poi.visitDuration && (
                                            <Text style={styles.poiDuration}>Durata visita: {item.poi.visitDuration}</Text>
                                        )}
                                        
                                        {item.poi.address && <Text style={styles.poiAddress}>{item.poi.address}</Text>}
                                        
                                        {/* DESCRIZIONE CONDIZIONATA DAL TOGGLE */}
                                        {options.details && (
                                            <Text style={styles.poiDescription}>
                                                {item.poi.description ? (item.poi.description.length > 250 ? item.poi.description.substring(0, 250) + '...' : item.poi.description) : ''}
                                            </Text>
                                        )}

                                        {/* NOTE CONDIZIONATE DAL TOGGLE */}
                                        {(options.notes && item.notes) && (
                                            <View style={styles.noteBox}>
                                                <Text style={styles.noteText}>Nota: {item.notes}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>

                        </View>
                    );
                })}
            </View>

            <Text style={{ position: 'absolute', bottom: 20, right: 20, fontSize: 8, color: '#a8a29e' }} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
        </Page>
    );
};

// --- MAIN RENDER ---
export const TravelDocument = ({ itinerary, logoBase64, options }: TravelDocumentProps) => {
    const timelineItems = itinerary.items.filter(i => !i.isResource);
    const days = Array.from(new Set(timelineItems.map(i => i.dayIndex))).sort((a,b) => a - b);

    return (
        <Document>
            {/* Solo se l'utente vuole il sommario, mettiamo la copertina */}
            {options.summary && <CoverPage itinerary={itinerary} logo={logoBase64} />}
            
            {days.map(dayIdx => (
                <VisualDayPage 
                    key={dayIdx} 
                    dayIndex={dayIdx} 
                    items={timelineItems.filter(i => i.dayIndex === dayIdx)}
                    options={options}
                    logo={logoBase64}
                />
            ))}
        </Document>
    );
};
