
import FileSaver from 'file-saver';
import type { FileChild, ParagraphChild, TableRow as DocxTableRow } from 'docx';
import type { Itinerary } from '../types';
import { PreparedItinerary, PreparedItineraryItem } from './pdfUtils';
import { buildHeroCoverCollagePlan, heroCoverStackImageHeight } from './heroCoverCollagePlan';
import {
    EXPORT_LOGO_VIEWBOX_HEIGHT,
    EXPORT_LOGO_VIEWBOX_WIDTH,
} from '@/components/export/ExportLogo';
import { diaryNotesToPlainText } from '@/components/features/diary/notes/diaryNotesDocumentToPlainText';

// --- CONFIGURAZIONE STILI WORD ---
const STYLES = {
    TITLE_SIZE: 52, // 26pt
    SUBTITLE_SIZE: 24, // 12pt
    HEADING_SIZE: 28, // 14pt
    BODY_SIZE: 22, // 11pt
    SMALL_SIZE: 18, // 9pt
    ACCENT_COLOR: "D97706", // Amber 600
    TEXT_COLOR: "1F2937", // Slate 800
    GRAY_COLOR: "6B7280", // Slate 500
    RED_COLOR: "DC2626", // Red 600
};

// Helper Mappatura Nomi Risorse
const getResourceLabel = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t === 'operator' || t.includes('agency')) return 'Tour Operator';
    if (t === 'guide') return 'Guida Turistica';
    if (t === 'service') return 'Servizio';
    return 'Partner';
};

// Helper per risolvere i nomi città dagli ID
const resolveCityName = (cityId: string, citiesMap: Record<string, string>): string => {
    if (!cityId) return '';
    // Se abbiamo il nome nella mappa, usalo. Altrimenti prova a pulire l'ID.
    if (citiesMap[cityId]) return citiesMap[cityId];
    return cityId.replace(/_/g, ' '); 
};

// Helper per processare Base64 -> Uint8Array per docx
const base64ToUint8Array = (base64: string): Uint8Array | null => {
    if (!base64 || typeof base64 !== 'string' || !base64.includes(',')) return null;
    try {
        const base64Data = base64.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    } catch(e) {
        return null;
    }
};

/** Bytes PNG da data-URL base64; null se assente o non decodificabile. */
const bytesFor = (dataUrl?: string | null): Uint8Array | null => {
    if (!dataUrl) return null;
    const bytes = base64ToUint8Array(dataUrl);
    return bytes && bytes.length > 0 ? bytes : null;
};

export const generateWordDocument = async (
    itinerary: PreparedItinerary, 
    options: { photos: boolean, qrCodes: boolean, summary: boolean, coverIllustrated: boolean, details: boolean, notes: boolean, resources: boolean, travelNotes?: boolean },
    logoBase64?: string,
    cityNamesMap: Record<string, string> = {} // NEW: Mappa ID -> Nome Reale
) => {
    const {
        Document,
        Packer,
        Paragraph,
        TextRun,
        Table,
        TableRow,
        TableCell,
        WidthType,
        BorderStyle,
        AlignmentType,
        Header,
        Footer,
        ImageRun,
        VerticalAlign,
    } = await import('docx');
    
    const timelineItems = itinerary.items.filter(i => !i.isResource);
    const resourceItems = itinerary.items.filter(i => i.isResource);

    // Raggruppa per giorni
    const daysMap = new Map<number, PreparedItineraryItem[]>();
    timelineItems.forEach(item => {
        const current = daysMap.get(item.dayIndex) || [];
        current.push(item);
        daysMap.set(item.dayIndex, current);
    });

    const sortedDays = Array.from(daysMap.keys()).sort((a, b) => a - b);
    
    // Costruisci stringa città risolta
    const uniqueIds = Array.from(new Set(itinerary.items.map(i => i.cityId).filter(id => id && id !== 'custom')));
    const citiesListString = uniqueIds.map(id => resolveCityName(id, cityNamesMap)).join(', ');

    const children: FileChild[] = [];

    // --- HEADER: Logo + Link ---
    let headerChildren: ParagraphChild[] = [];
    if (logoBase64) {
        const logoBytes = bytesFor(logoBase64);
        if (logoBytes) {
            const logoDisplayWidth = 150;
            const logoDisplayHeight = Math.round(
                logoDisplayWidth * (EXPORT_LOGO_VIEWBOX_HEIGHT / EXPORT_LOGO_VIEWBOX_WIDTH),
            );
            headerChildren = [
                new ImageRun({
                    data: logoBytes,
                    transformation: { width: logoDisplayWidth, height: logoDisplayHeight },
                    type: 'png'
                })
            ];
        }
    } else {
        headerChildren = [
            new TextRun({ text: "TOURING DIARY", bold: true, size: 24, color: STYLES.ACCENT_COLOR })
        ];
    }

    children.push(
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: {style: BorderStyle.NONE}, bottom: {style: BorderStyle.SINGLE, size: 6, color: "E5E7EB"}, left: {style: BorderStyle.NONE}, right: {style: BorderStyle.NONE}, insideHorizontal: {style: BorderStyle.NONE}, insideVertical: {style: BorderStyle.NONE} },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            children: [new Paragraph({ children: headerChildren })],
                            borders: { top: {style: BorderStyle.NONE}, bottom: {style: BorderStyle.NONE}, left: {style: BorderStyle.NONE}, right: {style: BorderStyle.NONE} }
                        }),
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "touringdiary-it.com", size: 18, color: STYLES.GRAY_COLOR })] })],
                            borders: { top: {style: BorderStyle.NONE}, bottom: {style: BorderStyle.NONE}, left: {style: BorderStyle.NONE}, right: {style: BorderStyle.NONE} }
                        })
                    ]
                })
            ]
        })
    );
    
    children.push(
        new Paragraph({
            spacing: { after: 400 }
        })
    );

    // --- COVER PAGE (editoriale: testo → spazio → foto) ---
    // In Word la “pagina 1” è logica: titolo/città/date sopra, collage sotto;
    // il Giorno 1 inizia sempre con pageBreakWhenCover.
    const hasCoverPage = Boolean(options.summary || options.coverIllustrated);

    if (options.summary) {
        children.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
                children: [
                    new TextRun({ text: (itinerary.name || "IL MIO VIAGGIO").toUpperCase(), bold: true, size: STYLES.TITLE_SIZE, color: STYLES.TEXT_COLOR, font: "Times New Roman" }),
                ],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
                children: [
                    new TextRun({ text: citiesListString, italics: true, size: STYLES.SUBTITLE_SIZE, color: STYLES.GRAY_COLOR }),
                ],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
                children: [
                    new TextRun({ text: `${itinerary.startDate || 'Data inizio'} — ${itinerary.endDate || 'Data fine'}`, size: 20, color: STYLES.ACCENT_COLOR, bold: true }),
                ],
            })
        );
    }

    // --- COVER ILLUSTRATED (hero collage) — sotto il blocco testuale ---
    const heroImages = itinerary.citiesInfo
        .map(c => c.heroImageBase64)
        .filter(Boolean) as string[];

    if (options.coverIllustrated && heroImages.length > 0) {
        const plan = buildHeroCoverCollagePlan(heroImages.length);

        if (plan.kind === 'single') {
            const bytes = bytesFor(heroImages[plan.top]);
            if (bytes) {
                children.push(
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                        children: [
                            new ImageRun({
                                data: bytes,
                                transformation: { width: 550, height: 300 },
                                type: 'png'
                            })
                        ]
                    })
                );
            }
        } else {
            // Colonna verticale: immagini più strette, gap uniforme, centrate.
            const tileHeight = heroCoverStackImageHeight(heroImages.length);
            const tileWidth = 420; // ~76% della larghezza utile → margini laterali
            const gapTwips = 160; // ~8pt tra le immagini

            plan.indices.forEach((idx, i) => {
                const bytes = bytesFor(heroImages[idx]);
                if (!bytes) return;

                children.push(
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: {
                            after: i === plan.indices.length - 1 ? 200 : gapTwips,
                        },
                        children: [
                            new ImageRun({
                                data: bytes,
                                transformation: { width: tileWidth, height: tileHeight },
                                type: 'png',
                            }),
                        ],
                    })
                );
            });
        }
    }

    // --- TIMELINE VISUALE ---
    sortedDays.forEach((dayIndex, dayOrdinal) => {
        const items = daysMap.get(dayIndex)?.sort((a, b) => a.timeSlotStr.localeCompare(b.timeSlotStr)) || [];

        children.push(
            new Paragraph({
                heading: "Heading1",
                alignment: AlignmentType.LEFT,
                spacing: { before: 400, after: 200 },
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: STYLES.ACCENT_COLOR, space: 4 } },
                // Regola fissa: con copertina, ogni giorno inizia su pagina nuova (Giorno 1 = pagina 2).
                pageBreakBefore: hasCoverPage || dayOrdinal > 0,
                children: [
                    new TextRun({ text: `GIORNO ${dayIndex + 1}`, bold: true, size: STYLES.HEADING_SIZE, color: STYLES.ACCENT_COLOR })
                ]
            })
        );

        const tableRows: DocxTableRow[] = [];
        
        items.forEach((item) => {
            const rawDistance = item.distanceFromPrev;
            const distanceKm = typeof rawDistance === 'number' && rawDistance > 0 ? rawDistance : null;

            // Image processing
            let imageRun: InstanceType<typeof ImageRun> | null = null;
            if (options.photos) {
                const bytes = bytesFor(item.processedImage);
                if (bytes) {
                    imageRun = new ImageRun({
                        data: bytes,
                        transformation: { width: 100, height: 75 },
                        type: 'png'
                    });
                }
            }

            // QR processing
            let qrRun: InstanceType<typeof ImageRun> | null = null;
            if (options.qrCodes) {
                const bytes = bytesFor(item.qrCodeUrl);
                if (bytes) {
                    qrRun = new ImageRun({
                        data: bytes,
                        transformation: { width: 50, height: 50 },
                        type: 'png'
                    });
                }
            }

            // Item Row — allineato al PDF: QR | linea | 75% testo | 25% durata+foto
            tableRows.push(new TableRow({
                children: [
                    // ORA + QR
                    new TableCell({
                        width: { size: 15, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.TOP,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [ new TextRun({ text: item.timeSlotStr, bold: true, size: STYLES.BODY_SIZE, color: STYLES.TEXT_COLOR }) ]
                            }),
                            ...(qrRun ? [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 100 }, children: [qrRun] })] : [])
                        ],
                        borders: { top: {style: BorderStyle.NONE}, bottom: {style: BorderStyle.NONE}, left: {style: BorderStyle.NONE}, right: {style: BorderStyle.NONE} }
                    }),
                    // DOT LINE
                    new TableCell({
                        width: { size: 5, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.TOP,
                        children: [
                             new Paragraph({
                                 alignment: AlignmentType.CENTER,
                                 children: [ new TextRun({ text: "•", size: 30, color: STYLES.GRAY_COLOR }) ]
                             })
                        ],
                        borders: { top: {style: BorderStyle.NONE}, bottom: {style: BorderStyle.NONE}, left: {style: BorderStyle.NONE}, right: {style: BorderStyle.NONE} }
                    }),
                    // CONTENUTO PRINCIPALE (~75% della zona a destra del QR)
                    new TableCell({
                        width: { size: 60, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.TOP,
                        children: [
                            ...(distanceKm != null ? [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    spacing: { after: 60 },
                                    children: [ new TextRun({ text: `--- DISTANZA ${distanceKm} KM ---`, size: 14, bold: true, color: STYLES.RED_COLOR }) ]
                                })
                            ] : []),
                            new Paragraph({
                                children: [ 
                                    new TextRun({ text: (item.poi.category || "POI").toUpperCase(), size: 14, color: STYLES.ACCENT_COLOR, bold: true }),
                                    new TextRun({ text: "\n" + item.poi.name, bold: true, size: STYLES.HEADING_SIZE, color: STYLES.TEXT_COLOR }) 
                                ]
                            }),
                            new Paragraph({
                                spacing: { before: 60 },
                                children: [ new TextRun({ text: item.poi.address || "", italics: true, size: STYLES.SMALL_SIZE, color: STYLES.GRAY_COLOR }) ]
                            }),
                            ...(options.details ? [new Paragraph({
                                spacing: { before: 100 },
                                children: [ new TextRun({ text: item.poi.description || "", size: STYLES.SMALL_SIZE, color: STYLES.TEXT_COLOR }) ]
                            })] : []),
                            ...(options.notes && item.notes ? [
                                new Paragraph({
                                    spacing: { before: 60 },
                                    shading: { fill: "FEF3C7" },
                                    children: [ new TextRun({ text: `NOTA: ${item.notes}`, bold: true, size: STYLES.SMALL_SIZE, color: "92400E" }) ]
                                })
                            ] : []),
                        ],
                        borders: { top: {style: BorderStyle.NONE}, bottom: {style: BorderStyle.NONE}, left: {style: BorderStyle.NONE}, right: {style: BorderStyle.NONE} },
                        margins: { top: 100, bottom: 200, left: 100, right: 60 }
                    }),
                    // COLONNA LATERALE (~25%): durata visita + foto
                    new TableCell({
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.TOP,
                        children: [
                            ...(item.poi.visitDuration ? [new Paragraph({
                                children: [ new TextRun({ text: `Durata visita: ${item.poi.visitDuration}`, size: STYLES.SMALL_SIZE, color: STYLES.GRAY_COLOR, bold: true }) ]
                            })] : []),
                            ...(imageRun ? [new Paragraph({
                                spacing: { before: item.poi.visitDuration ? 80 : 0 },
                                children: [imageRun]
                            })] : []),
                            ...(!item.poi.visitDuration && !imageRun ? [new Paragraph({ children: [] })] : []),
                        ],
                        borders: { top: {style: BorderStyle.NONE}, bottom: {style: BorderStyle.NONE}, left: {style: BorderStyle.NONE}, right: {style: BorderStyle.NONE} },
                        margins: { top: 100, bottom: 200, left: 40, right: 40 }
                    }),
                ],
            }));
            
            // Spazio tra POI (la distanza è già nel blocco testo principale, come nel PDF)
            tableRows.push(new TableRow({
                children: [
                    new TableCell({
                        children: [],
                        columnSpan: 4,
                        borders: { top: {style: BorderStyle.NONE}, bottom: {style: BorderStyle.NONE}, left: {style: BorderStyle.NONE}, right: {style: BorderStyle.NONE} },
                    }),
                ],
                height: { value: 200, rule: "exact" },
            }));
        });

        children.push(
            new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: { top: {style: BorderStyle.NONE}, bottom: {style: BorderStyle.NONE}, left: {style: BorderStyle.NONE}, right: {style: BorderStyle.NONE}, insideHorizontal: {style: BorderStyle.NONE}, insideVertical: {style: BorderStyle.NONE} }
            })
        );
        children.push(new Paragraph({ spacing: { after: 400 } }));
    });

    // Resources
    if (resourceItems.length > 0 && options.resources) {
        children.push(
            new Paragraph({
                text: "CONTATTI E RISORSE",
                heading: "Heading1",
                alignment: AlignmentType.LEFT,
                spacing: { before: 600, after: 300 },
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: STYLES.GRAY_COLOR, space: 4 } },
                pageBreakBefore: true
            })
        );
        
        const resRows: DocxTableRow[] = [];
        
        // Header Riga
        resRows.push(new TableRow({
            tableHeader: true,
            children: [
                new TableCell({ children: [new Paragraph({children: [new TextRun({text: "NOME", bold: true})], alignment: AlignmentType.CENTER})], width: {size: 40, type: WidthType.PERCENTAGE}, shading: { fill: "F3F4F6" } }),
                new TableCell({ children: [new Paragraph({children: [new TextRun({text: "TIPO", bold: true})], alignment: AlignmentType.CENTER})], width: {size: 25, type: WidthType.PERCENTAGE}, shading: { fill: "F3F4F6" } }),
                new TableCell({ children: [new Paragraph({children: [new TextRun({text: "CONTATTO", bold: true})], alignment: AlignmentType.CENTER})], width: {size: 35, type: WidthType.PERCENTAGE}, shading: { fill: "F3F4F6" } }),
            ]
        }));

        resourceItems.forEach(res => {
            resRows.push(new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({children: [new TextRun({text: res.poi.name, bold: true})], alignment: AlignmentType.CENTER})], width: {size: 40, type: WidthType.PERCENTAGE} }),
                    new TableCell({ children: [new Paragraph({text: getResourceLabel(res.poi.resourceType || ""), alignment: AlignmentType.CENTER})], width: {size: 25, type: WidthType.PERCENTAGE} }),
                    new TableCell({ children: [new Paragraph({text: res.poi.contactInfo?.phone || res.poi.address || "-", alignment: AlignmentType.CENTER })], width: {size: 35, type: WidthType.PERCENTAGE} }),
                ]
            }));
        });
        
        children.push(new Table({
            rows: resRows,
            width: { size: 100, type: WidthType.PERCENTAGE }
        }));
    }

    const diaryNotesText = options.travelNotes ? diaryNotesToPlainText(itinerary.diaryNotes) : '';
    if (diaryNotesText) {
        children.push(
            new Paragraph({
                text: "NOTE DI VIAGGIO",
                heading: "Heading1",
                alignment: AlignmentType.LEFT,
                spacing: { before: 600, after: 300 },
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: STYLES.GRAY_COLOR, space: 4 } },
                pageBreakBefore: true,
            })
        );
        diaryNotesText.split('\n').forEach((line) => {
            children.push(
                new Paragraph({
                    children: [new TextRun({ text: line, size: STYLES.BODY_SIZE, color: STYLES.TEXT_COLOR })],
                    spacing: { after: 80 },
                })
            );
        });
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children: children,
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [ new TextRun({ text: "Generato con Touring Diary", size: 16, color: STYLES.GRAY_COLOR }) ]
                        })
                    ]
                }),
            },
        }],
    });
    
    // Costruzione nome file pulito
    let filename = `TD-Viaggio.docx`;
    if (itinerary.name) {
        // Tenta di estrarre città se il nome è generico, altrimenti usa nome viaggio
        // Ma l'utente ha chiesto formato specifico.
        
        // Estrai nomi città unici dalla mappa fornita
        const cityIds = Array.from(new Set(itinerary.items.map(i => i.cityId).filter(id => id && id !== 'custom')));
        const cityNames = cityIds.map(id => resolveCityName(id, cityNamesMap)).filter(Boolean);
        
        if (cityNames.length > 0) {
            filename = `TD-Viaggio-${cityNames.join('_')}.docx`;
        } else {
            filename = `TD-Viaggio-${itinerary.name.replace(/\s+/g, '_')}.docx`;
        }
    }

    const blob = await Packer.toBlob(doc);
    FileSaver.saveAs(blob, filename);
};

/**
 * Dump TXT del diario. Accetta `Itinerary` (runtime) o `PreparedItinerary`
 * (stesso shape + campi export opzionali come `distanceFromPrev`).
 */
export const generateTextFile = (
    itinerary: Itinerary | PreparedItinerary,
    cityNamesMap: Record<string, string> = {},
    returnString: boolean = false,
) => {
    const lines: string[] = [];
    // Stesso shape di lettura; cast solo per `distanceFromPrev` opzionale (prepared).
    const items = itinerary.items as PreparedItineraryItem[];
    lines.push(`${(itinerary.name || "IL MIO VIAGGIO").toUpperCase()}`);
    lines.push(`Date: ${itinerary.startDate || '?'} - ${itinerary.endDate || '?'}`);
    
    // Lista città formattata
    const uniqueCityIds = Array.from(new Set(
        items
            .map((i) => i.cityId)
            .filter((id): id is string => Boolean(id) && id !== 'custom'),
    ));
    const cityNames = uniqueCityIds.map((id) => resolveCityName(id, cityNamesMap) || id).join(', ');
    
    lines.push(`Città: ${cityNames}\n`);
    
    const timelineItems = items
        .filter((i) => !i.isResource)
        .sort((a, b) => a.dayIndex - b.dayIndex || a.timeSlotStr.localeCompare(b.timeSlotStr));
    const days = Array.from(new Set(timelineItems.map((i) => i.dayIndex))).sort((a, b) => a - b);

    days.forEach((day) => {
        lines.push(`\n--- GIORNO ${day + 1} ---`);
        const dayItems = timelineItems.filter((i) => i.dayIndex === day);
        dayItems.forEach((item, idx) => {
             lines.push(`[${item.timeSlotStr}] ${item.poi.name} (${item.poi.category})`);
             if(item.poi.address) lines.push(`   Indirizzo: ${item.poi.address}`);
             if(item.poi.visitDuration) lines.push(`   Durata Visita: ${item.poi.visitDuration}`);
             if(item.notes) lines.push(`   NOTA: ${item.notes}`);
             
             const nextItem = dayItems[idx + 1];
             if (nextItem && nextItem.distanceFromPrev) {
                  lines.push(`   --- DISTANZA ${nextItem.distanceFromPrev} KM ---`);
             }
             
             lines.push("");
        });
    });

    const diaryNotesText = diaryNotesToPlainText(itinerary.diaryNotes);
    // Il TXT è un dump testuale completo: le Note di Viaggio sono sempre incluse se presenti
    // (non governate da options.travelNotes, riservata a PDF/Word).
    if (diaryNotesText) {
        lines.push('\n--- NOTE DI VIAGGIO ---');
        lines.push(diaryNotesText);
    }
    
    const text = lines.join("\n");
    if(returnString) return text;
    
    const filename = `TD-Viaggio-${cityNames.replace(/, /g, '_') || 'Campania'}.txt`;
    
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    FileSaver.saveAs(blob, filename);
    return "";
};
