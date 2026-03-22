import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, Link } from '@react-pdf/renderer';
import { Itinerary, RoadbookDay, RoadbookSegment } from '../../types/index';
import { COLORS } from './PdfStyles';

// Stili specifici per il Roadbook
const styles = StyleSheet.create({
    page: {
        paddingTop: 80,
        paddingBottom: 40,
        paddingHorizontal: 40,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
        color: COLORS.black,
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
        borderBottomColor: '#e5e7eb',
    },
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
    titleContainer: {
        marginBottom: 30,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.black,
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    mainTitle: {
        fontSize: 24,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.black,
        textTransform: 'uppercase',
    },
    subTitle: {
        fontSize: 10,
        color: COLORS.lightGrey,
        textTransform: 'uppercase',
        marginTop: 4,
    },
    cityDate: {
        textAlign: 'right',
    },
    cityName: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.black,
    },
    dateText: {
        fontSize: 9,
        color: COLORS.lightGrey,
        marginTop: 2,
    },
    dayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 20,
    },
    dayBadge: {
        backgroundColor: COLORS.black,
        color: COLORS.white,
        width: 24,
        height: 24,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    dayBadgeText: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
    },
    dayTitle: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.black,
        textTransform: 'uppercase',
    },
    segmentBox: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        backgroundColor: '#f8fafc',
    },
    segmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 8,
    },
    locationBox: {
        flex: 1,
    },
    locationName: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.black,
        marginBottom: 2,
    },
    locationTime: {
        fontSize: 9,
        color: COLORS.accent,
        fontFamily: 'Helvetica-Bold',
    },
    directionBox: {
        width: 80,
        alignItems: 'center',
    },
    transportMode: {
        fontSize: 8,
        color: COLORS.white,
        backgroundColor: COLORS.accent,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        textTransform: 'uppercase',
        fontFamily: 'Helvetica-Bold',
        marginBottom: 4,
    },
    durationText: {
        fontSize: 8,
        color: COLORS.lightGrey,
        fontFamily: 'Helvetica-Bold',
    },
    instructions: {
        fontSize: 10,
        color: COLORS.darkGrey,
        lineHeight: 1.4,
        marginBottom: 8,
    },
    costsRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 8,
        gap: 15,
    },
    costItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    costLabel: {
        fontSize: 8,
        color: COLORS.lightGrey,
        textTransform: 'uppercase',
        marginRight: 4,
    },
    costValue: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.black,
    },
    tipsBox: {
        marginTop: 8,
        backgroundColor: COLORS.noteBg,
        padding: 8,
        borderRadius: 4,
    },
    tipsText: {
        fontSize: 9,
        color: COLORS.noteText,
        fontStyle: 'italic',
    },
    summaryBox: {
        marginTop: 30,
        borderWidth: 2,
        borderColor: COLORS.black,
        borderRadius: 8,
        padding: 15,
    },
    summaryTitle: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.black,
        textTransform: 'uppercase',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 5,
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryCol: {
        flex: 1,
        paddingHorizontal: 5,
    },
    summaryColTitle: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.accent,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 9,
        color: COLORS.darkGrey,
    },
    summaryVal: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.black,
    },
    summaryTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingTop: 5,
        borderTopWidth: 1,
        borderTopColor: COLORS.black,
    },
    summaryTotalLabel: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.black,
    },
    summaryTotalVal: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.accent,
    }
});

interface RoadbookDocumentProps {
    itinerary: Itinerary;
    roadbook: RoadbookDay[];
    activeCityName: string;
    logoBase64?: string;
    summaryData: any;
}

const Header = ({ logo }: { logo?: string }) => (
    <View style={styles.headerFixed} fixed>
        {logo ? (
            <Image src={logo} style={styles.headerLogoImage} />
        ) : (
            <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: COLORS.accent }}>TOURING DIARY</Text>
        )}
        <Link src="https://touringdiary-it.com/" style={styles.headerLink}>
            touringdiary-it.com
        </Link>
    </View>
);

export const RoadbookDocument = ({ itinerary, roadbook, activeCityName, logoBase64, summaryData }: RoadbookDocumentProps) => {
    
    const cleanLocationName = (name: string) => {
        if (!name) return "";
        return name.replace(/^Punto di Partenza\s*[\(:-]?\s*/i, '').replace(/\)$/, '').trim();
    };

    const formatTimePretty = (mins: number) => {
        if (mins === 0) return '0 min';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0) return `${h}h ${m}m`;
        return `${m} min`;
    };

    const getTransportLabel = (mode: string) => {
        switch(mode) {
            case 'walk': return 'A PIEDI';
            case 'transit': return 'MEZZI';
            case 'car': return 'AUTO/TAXI';
            default: return 'SPOSTAMENTO';
        }
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Header logo={logoBase64} />
                
                {/* TITOLO PRINCIPALE */}
                <View style={styles.titleContainer}>
                    <View>
                        <Text style={styles.mainTitle}>Touring Diary</Text>
                        <Text style={styles.subTitle}>Guida Logistica Personalizzata</Text>
                    </View>
                    <View style={styles.cityDate}>
                        <Text style={styles.cityName}>{activeCityName}</Text>
                        <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
                    </View>
                </View>

                {/* GIORNI E SEGMENTI */}
                {roadbook.map((day, dIdx) => {
                    const dayItems = itinerary.items.filter(i => i.dayIndex === day.dayIndex).sort((a,b) => a.timeSlotStr.localeCompare(b.timeSlotStr));
                    
                    return (
                        <View key={dIdx} wrap={false}>
                            <View style={styles.dayHeader}>
                                <View style={styles.dayBadge}><Text style={styles.dayBadgeText}>{day.dayIndex + 1}</Text></View>
                                <Text style={styles.dayTitle}>Giorno {day.dayIndex + 1}</Text>
                            </View>

                            {day.segments.map((segment, sIdx) => {
                                const startTime = dayItems[sIdx]?.timeSlotStr || "--:--";
                                const endTime = dayItems[sIdx + 1]?.timeSlotStr || "--:--";
                                
                                return (
                                    <View key={sIdx} style={styles.segmentBox} wrap={false}>
                                        <View style={styles.segmentHeader}>
                                            <View style={styles.locationBox}>
                                                <Text style={styles.locationName}>{cleanLocationName(segment.from)}</Text>
                                                <Text style={styles.locationTime}>{startTime}</Text>
                                            </View>
                                            
                                            <View style={styles.directionBox}>
                                                <Text style={styles.transportMode}>{getTransportLabel(segment.transportMode)}</Text>
                                                <Text style={styles.durationText}>{segment.duration}</Text>
                                            </View>
                                            
                                            <View style={[styles.locationBox, { alignItems: 'flex-end' }]}>
                                                <Text style={[styles.locationName, { textAlign: 'right' }]}>{segment.to}</Text>
                                                <Text style={styles.locationTime}>{endTime}</Text>
                                            </View>
                                        </View>
                                        
                                        <Text style={styles.instructions}>{segment.instructions}</Text>
                                        
                                        <View style={styles.costsRow}>
                                            <View style={styles.costItem}>
                                                <Text style={styles.costLabel}>Trasporto:</Text>
                                                <Text style={styles.costValue}>{segment.transportCost || '--'}</Text>
                                            </View>
                                            <View style={styles.costItem}>
                                                <Text style={styles.costLabel}>Cibo:</Text>
                                                <Text style={styles.costValue}>{segment.foodCost || '--'}</Text>
                                            </View>
                                            <View style={styles.costItem}>
                                                <Text style={styles.costLabel}>Biglietto:</Text>
                                                <Text style={styles.costValue}>{segment.ticketCost || '--'}</Text>
                                            </View>
                                        </View>
                                        
                                        {segment.tips && (
                                            <View style={styles.tipsBox}>
                                                <Text style={styles.tipsText}>Tip: {segment.tips}</Text>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    );
                })}

                {/* RIEPILOGO */}
                <View style={styles.summaryBox} wrap={false}>
                    <Text style={styles.summaryTitle}>Riepilogo Viaggio</Text>
                    
                    <View style={styles.summaryGrid}>
                        {/* MOBILITA */}
                        <View style={styles.summaryCol}>
                            <Text style={styles.summaryColTitle}>Mobilità</Text>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>A Piedi</Text>
                                <Text style={styles.summaryVal}>{formatTimePretty(summaryData.totalWalkingMinutes)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Mezzi/Auto</Text>
                                <Text style={styles.summaryVal}>{formatTimePretty(summaryData.totalTransitMinutes)}</Text>
                            </View>
                            <View style={[styles.summaryRow, { marginTop: 5 }]}>
                                <Text style={styles.summaryLabel}>Tot. Spostamenti</Text>
                                <Text style={styles.summaryVal}>{summaryData.totalSegments}</Text>
                            </View>
                        </View>
                        
                        {/* BUDGET */}
                        <View style={styles.summaryCol}>
                            <Text style={styles.summaryColTitle}>Budget Stimato</Text>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Trasporti</Text>
                                <Text style={styles.summaryVal}>€ {summaryData.totalTransportCost.toFixed(2)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Ingressi</Text>
                                <Text style={styles.summaryVal}>€ {summaryData.totalTicketCost.toFixed(2)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Cibo</Text>
                                <Text style={styles.summaryVal}>€ {summaryData.totalFoodCost.toFixed(2)}</Text>
                            </View>
                            
                            <View style={styles.summaryTotal}>
                                <Text style={styles.summaryTotalLabel}>TOTALE</Text>
                                <Text style={styles.summaryTotalVal}>
                                    € {(summaryData.totalTransportCost + summaryData.totalTicketCost + summaryData.totalFoodCost).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
                
            </Page>
        </Document>
    );
};