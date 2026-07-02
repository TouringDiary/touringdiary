import React from 'react';
import { Document, Page, Text, View, Image, Link } from '@react-pdf/renderer';
import { styles, COLORS } from './PdfStyles';
import { PreparedItinerary, PreparedItineraryItem } from '../../utils/pdfUtils'; 
import { logPdfImagePipeline } from '../../utils/pdfImagePipelineLog';
import { normalizeDiaryNotesState } from '@/domain/diary/diaryNotesState';
import type { DiaryNotesMark, DiaryNotesNode, DiaryNotesState } from '@/types/models/DiaryNotes';

interface TravelDocumentOptions {
  photos: boolean;
  qrCodes: boolean;
  summary: boolean;
  details: boolean;
  notes: boolean;
  resources: boolean;
  travelNotes?: boolean;
}

interface TravelDocumentProps {
  itinerary: PreparedItinerary; 
  logoBase64: string; 
  options: TravelDocumentOptions;
}

// HEADER
const Header = ({ logo }: { logo: string }) => (
    <View style={styles.headerFixed} fixed>
        <Image src={logo} style={styles.headerLogoImage} />
        <Link src="https://touringdiary-it.com/" style={styles.headerLink}>
            touringdiary-it.com
        </Link>
    </View>
);

// COPERTINA
const CoverPage = ({ itinerary, logo }: { itinerary: PreparedItinerary, logo: string }) => {

    const images = itinerary.citiesInfo
        .map(c => c.heroImageBase64)
        .filter(Boolean) as string[];

    return (
        <Page size="A4" style={styles.page}>
            <Header logo={logo} />

            <View style={styles.coverContainer}>

                <Text style={styles.coverTitle}>
                    {itinerary.name && itinerary.name.trim() !== ''
                        ? itinerary.name
                        : 'IL MIO VIAGGIO'}
                </Text>

                <Text style={styles.coverSubtitle}>
                    {itinerary.formattedCityList}
                    {'\n'}
                    <Text style={{ fontSize: 14, color: COLORS.accent, fontFamily: 'Helvetica-Bold' }}>
                        {itinerary.startDate
                            ? `${itinerary.startDate} — ${itinerary.endDate || '...'}`
                            : 'Date da definire'}
                    </Text>
                </Text>

                {images.length > 0 ? (
                    <View style={styles.coverImagesGrid}>
                        <Image src={images[0]} style={styles.coverImageMain} />

                        {images.length > 1 && (
                            <View style={{ flexDirection: 'row', height: '35%', gap: 4 }}>
                                <Image src={images[1]} style={{ flex: 1 }} />
                                {images[2] && <Image src={images[2]} style={{ flex: 1 }} />}
                            </View>
                        )}

                    </View>
                ) : (
                    <View
                        style={[
                            styles.coverImagesGrid,
                            { backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }
                        ]}
                    >
                        <Text style={{ fontSize: 10, color: '#64748b' }}>
                            NESSUNA FOTO DISPONIBILE
                        </Text>
                    </View>
                )}

            </View>
        </Page>
    );
};

// PAGINA GIORNO
const VisualDayPage: React.FC<{
    items: PreparedItineraryItem[],
    dayIndex: number,
    options: TravelDocumentOptions,
    logo: string
}> = ({ items, dayIndex, options, logo }) => {

    const sortedItems = [...items].sort(
        (a, b) => a.timeSlotStr.localeCompare(b.timeSlotStr)
    );

    return (
        <Page size="A4" style={styles.page}>

            <Header logo={logo} />

            <View style={styles.dayHeaderContainer}>
                <Text style={styles.dayTitle}>Giorno {dayIndex + 1}</Text>
            </View>

            <View>

                {sortedItems.map((item, idx) => {

                    const isLast = idx === sortedItems.length - 1;

                    const hasDist =
                        item.distanceFromPrev !== null &&
                        item.distanceFromPrev !== undefined &&
                        item.distanceFromPrev > 0;

                    const willRenderImage = Boolean(options.photos && item.processedImage);
                    const imageJsxMounted = willRenderImage;
                    logPdfImagePipeline({
                        stage: 'travelDocument:item-render',
                        itemId: item.id,
                        poiName: item.poi?.name,
                        imageUrl: item.poi?.imageUrl,
                        optionsPhotos: options.photos,
                        willRender: willRenderImage,
                        ...(
                            willRenderImage
                                ? {
                                    processedImageLength: item.processedImage?.length,
                                    processedImagePrefix: item.processedImage?.slice(0, 40),
                                }
                                : {
                                    renderBlockedReason: !options.photos
                                        ? 'options.photos=false'
                                        : !item.processedImage
                                            ? 'item.processedImage assente in TravelDocument'
                                            : 'condizione render non soddisfatta',
                                }
                        ),
                        isResource: item.isResource,
                        extra: {
                            dayIndex,
                            timelineIndex: idx,
                            snapshotImageUrl: item.poi?.imageUrl?.trim() || undefined,
                            processedImagePresent: Boolean(item.processedImage),
                            renderCondition: 'options.photos && item.processedImage',
                            imageJsxMounted,
                        },
                    });

                    return (

                        <View key={item.id} style={styles.timelineItem}>

                            <View style={styles.colTime}>
                                <Text style={styles.timeText}>{item.timeSlotStr}</Text>

                                {options.qrCodes && item.qrCodeUrl && (
                                    <Image src={item.qrCodeUrl} style={styles.qrImageSmall} />
                                )}
                            </View>

                            <View style={styles.colLine}>

                                <View style={styles.timelineDot} />

                                {!isLast && <View style={styles.verticalLine} />}

                                {hasDist && (
                                    <View style={[styles.distanceBadge, { top: -20 }]}>
                                        <Text style={styles.distanceText}>
                                            {item.distanceFromPrev} KM
                                        </Text>
                                    </View>
                                )}

                            </View>

                            <View style={styles.colContent}>

                                <Text style={styles.poiCategory}>
                                    {item.poi?.category || ""}
                                </Text>

                                <Text style={styles.poiName}>
                                    {item.poi?.name || ""}
                                </Text>

                                {item.poi?.visitDuration && (
                                    <Text style={styles.poiDuration}>
                                        Durata visita: {item.poi.visitDuration}
                                    </Text>
                                )}

                                {item.poi?.address && (
                                    <Text style={styles.poiAddress}>
                                        {item.poi.address}
                                    </Text>
                                )}

                                {options.photos && item.processedImage && (
                                    <Image
                                        src={item.processedImage}
                                        style={styles.inlineImage}
                                    />
                                )}

                                {options.details && (
                                    <Text style={styles.poiDescription}>
                                        {item.poi?.description
                                            ? item.poi.description.length > 250
                                                ? item.poi.description.substring(0, 250) + '...'
                                                : item.poi.description
                                            : ""}
                                    </Text>
                                )}

                                {options.notes && typeof item.notes === 'string' && item.notes.trim().length > 0 && (
                                    <View style={styles.notesBox}>
                                        <Text style={styles.notesTitle}>NOTA:</Text>
                                        <Text style={styles.notesText}>
                                            {String(item.notes).replace(/\n/g, ' ')}
                                        </Text>
                                    </View>
                                )}

                            </View>

                        </View>

                    );

                })}

            </View>

            <Text
                style={{
                    position: 'absolute',
                    bottom: 20,
                    right: 20,
                    fontSize: 8,
                    color: '#a8a29e'
                }}
                render={({ pageNumber, totalPages }) =>
                    `${pageNumber} / ${totalPages}`
                }
                fixed
            />

        </Page>
    );
};

const diaryNoteStyles = {
    pageTitle: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 18,
        color: COLORS.accent,
        textTransform: 'uppercase' as const,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.accent,
        paddingBottom: 6,
        marginBottom: 18,
    },
    tabSection: {
        marginBottom: 18,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tabTitle: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 14,
        color: '#0f172a',
        marginBottom: 10,
    },
    paragraph: {
        fontFamily: 'Helvetica',
        fontSize: 10,
        lineHeight: 1.45,
        color: '#334155',
        marginBottom: 6,
    },
    heading: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 12,
        lineHeight: 1.35,
        color: '#1e293b',
        marginTop: 4,
        marginBottom: 7,
    },
    bold: {
        fontFamily: 'Helvetica-Bold',
    },
    italic: {
        fontFamily: 'Helvetica-Oblique',
    },
    boldItalic: {
        fontFamily: 'Helvetica-BoldOblique',
    },
    strike: {
        textDecoration: 'line-through' as const,
    },
    underline: {
        textDecoration: 'underline' as const,
    },
    link: {
        color: COLORS.accent,
    },
    listRow: {
        flexDirection: 'row' as const,
        alignItems: 'flex-start' as const,
        marginBottom: 4,
    },
    listMarker: {
        width: 18,
        fontSize: 10,
        lineHeight: 1.45,
        color: '#475569',
    },
    listBody: {
        flex: 1,
    },
    emptyText: {
        fontFamily: 'Helvetica-Oblique',
        fontSize: 9,
        color: '#94a3b8',
    },
};

function hasMark(marks: DiaryNotesMark[] | undefined, type: string): boolean {
    return marks?.some(mark => mark.type === type) ?? false;
}

function getLinkHref(marks: DiaryNotesMark[] | undefined): string | null {
    const href = marks?.find(mark => mark.type === 'link')?.attrs?.href;
    return typeof href === 'string' ? href : null;
}

function getTextColor(marks: DiaryNotesMark[] | undefined): string | null {
    const color = marks?.find(mark => mark.type === 'textStyle')?.attrs?.color;
    return typeof color === 'string' ? color : null;
}

function renderInlineNode(node: DiaryNotesNode, key: string): React.ReactNode {
    if (node.type !== 'text') {
        if (!node.content?.length) return null;
        return node.content.map((child, index) => renderInlineNode(child, `${key}-${index}`));
    }

    const bold = hasMark(node.marks, 'bold');
    const italic = hasMark(node.marks, 'italic');
    const href = getLinkHref(node.marks);
    const inlineStyle = { ...diaryNoteStyles.paragraph };

    if (bold && italic) Object.assign(inlineStyle, diaryNoteStyles.boldItalic);
    else if (bold) Object.assign(inlineStyle, diaryNoteStyles.bold);
    else if (italic) Object.assign(inlineStyle, diaryNoteStyles.italic);
    if (hasMark(node.marks, 'strike')) Object.assign(inlineStyle, diaryNoteStyles.strike);
    if (hasMark(node.marks, 'underline')) Object.assign(inlineStyle, diaryNoteStyles.underline);
    const textColor = getTextColor(node.marks);
    if (textColor) inlineStyle.color = textColor;
    if (href) Object.assign(inlineStyle, diaryNoteStyles.link);

    const text = node.text ?? '';
    const printableText = href && href !== text ? `${text} (${href})` : text;

    return (
        <Text key={key} style={inlineStyle}>
            {printableText}
        </Text>
    );
}

function renderInlineNodes(nodes: DiaryNotesNode[] | undefined, keyPrefix: string): React.ReactNode {
    return nodes?.map((node, index) => renderInlineNode(node, `${keyPrefix}-${index}`)) ?? null;
}

function renderListItemBody(node: DiaryNotesNode, keyPrefix: string): React.ReactNode {
    return node.content?.map((child, index) => {
        if (child.type === 'paragraph') {
            return (
                <Text key={`${keyPrefix}-p-${index}`} style={diaryNoteStyles.paragraph}>
                    {renderInlineNodes(child.content, `${keyPrefix}-p-${index}`)}
                </Text>
            );
        }
        return renderDiaryNoteBlock(child, `${keyPrefix}-b-${index}`);
    }) ?? null;
}

function renderDiaryNoteBlock(node: DiaryNotesNode, key: string): React.ReactNode {
    if (node.type === 'heading') {
        return (
            <Text key={key} style={diaryNoteStyles.heading}>
                {renderInlineNodes(node.content, key)}
            </Text>
        );
    }

    if (node.type === 'paragraph') {
        return (
            <Text key={key} style={diaryNoteStyles.paragraph}>
                {renderInlineNodes(node.content, key)}
            </Text>
        );
    }

    if (node.type === 'bulletList' || node.type === 'orderedList') {
        return (
            <View key={key}>
                {node.content?.map((item, index) => (
                    <View key={`${key}-item-${index}`} style={diaryNoteStyles.listRow}>
                        <Text style={diaryNoteStyles.listMarker}>
                            {node.type === 'orderedList' ? `${index + 1}.` : '•'}
                        </Text>
                        <View style={diaryNoteStyles.listBody}>
                            {renderListItemBody(item, `${key}-item-${index}`)}
                        </View>
                    </View>
                ))}
            </View>
        );
    }

    if (node.type === 'taskList') {
        return (
            <View key={key}>
                {node.content?.map((item, index) => (
                    <View key={`${key}-task-${index}`} style={diaryNoteStyles.listRow}>
                        <Text style={diaryNoteStyles.listMarker}>
                            {item.attrs?.checked === true ? '[x]' : '[ ]'}
                        </Text>
                        <View style={diaryNoteStyles.listBody}>
                            {renderListItemBody(item, `${key}-task-${index}`)}
                        </View>
                    </View>
                ))}
            </View>
        );
    }

    if (node.content?.length) {
        return node.content.map((child, index) => renderDiaryNoteBlock(child, `${key}-${index}`));
    }

    return null;
}

const DiaryNotesPages: React.FC<{
    notesState: DiaryNotesState;
    logo: string;
}> = ({ notesState, logo }) => {
    const state = normalizeDiaryNotesState(notesState);

    return (
        <Page size="A4" style={styles.page}>
            <Header logo={logo} />
            <Text style={diaryNoteStyles.pageTitle}>Note di Viaggio</Text>

            {state.tabs.map((tab, tabIndex) => {
                const blocks = tab.document.content;

                return (
                    <View key={tab.id} style={diaryNoteStyles.tabSection}>
                        <Text style={diaryNoteStyles.tabTitle}>{tab.title}</Text>
                        {blocks.length > 0 ? (
                            blocks.map((node, nodeIndex) =>
                                renderDiaryNoteBlock(node, `tab-${tabIndex}-${nodeIndex}`),
                            )
                        ) : (
                            <Text style={diaryNoteStyles.emptyText}>Nessun contenuto.</Text>
                        )}
                    </View>
                );
            })}
        </Page>
    );
};

export const TravelDocument = ({
    itinerary,
    logoBase64,
    options
}: TravelDocumentProps) => {

    const timelineItems = itinerary.items.filter(i => !i.isResource);

    const days = Array.from(
        new Set(timelineItems.map(i => i.dayIndex))
    ).sort((a, b) => a - b);

    return (

        <Document>

            {options.summary && (
                <CoverPage itinerary={itinerary} logo={logoBase64} />
            )}

            {days.map(dayIdx => (

                <VisualDayPage
                    key={dayIdx}
                    dayIndex={dayIdx}
                    items={timelineItems.filter(i => i.dayIndex === dayIdx)}
                    options={options}
                    logo={logoBase64}
                />

            ))}

            {options.travelNotes && itinerary.diaryNotes && (
                <DiaryNotesPages notesState={itinerary.diaryNotes} logo={logoBase64} />
            )}

        </Document>

    );
};
