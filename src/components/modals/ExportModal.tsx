import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FileText, Image as ImageIcon, Printer, Download, LayoutList, AlertTriangle, Loader2, Sparkles, CheckSquare, Square, QrCode, Edit3, Link, type LucideIcon } from 'lucide-react';
import { useItinerary } from '@/context/ItineraryContext';
import FileSaver from 'file-saver';
import { prepareItineraryForPdf, type PreparedItinerary, type CityVisualInfo, type PreparedItineraryItem } from '../../utils/pdfUtils'; 
import { logPdfImagePipeline, runWithPdfPipelineWarningCapture, summarizeProcessedImage } from '../../utils/pdfImagePipelineLog';
import { generateWordDocument, generateTextFile } from '../../utils/exportGenerators'; 
import { ensureNodePdfPolyfills } from '../../utils/ensureNodePdfPolyfills';
import { buildHeroCoverCollagePlan } from '../../utils/heroCoverCollagePlan';
import { useLogoRasterizer } from '../../hooks/useLogoRasterizer';
import { normalizeDiaryNotesState } from '@/domain/diary/diaryNotesState';
import { diaryNotesHasMeaningfulContent } from '@/components/features/diary/notes/diaryNotesDocumentToPlainText';
import type { DiaryNotesNode } from '@/types/models/DiaryNotes';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';
import { BaseFullscreenModalShell } from '@/components/modals/shell/BaseFullscreenModalShell';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ExportFormat = 'pdf' | 'docx' | 'txt';
const EXPORT_FORMATS: ExportFormat[] = ['pdf', 'docx', 'txt'];

type ExportOptionKey =
    | 'coverIllustrated'
    | 'details'
    | 'photos'
    | 'qrCodes'
    | 'summary'
    | 'notes'
    | 'resources'
    | 'travelNotes';

/** Formati in cui ciascuna opzione Ã¨ semanticamente applicabile (TXT Ã¨ solo testo piano). */
const EXPORT_OPTION_FORMATS: Record<ExportOptionKey, readonly ExportFormat[]> = {
    coverIllustrated: ['pdf', 'docx'],
    details: ['pdf', 'docx'],
    photos: ['pdf', 'docx'],
    qrCodes: ['pdf', 'docx'],
    summary: ['pdf', 'docx'],
    notes: ['pdf', 'docx'],
    resources: ['pdf', 'docx'],
    travelNotes: ['pdf', 'docx'], // TXT: sempre incluse nel dump testuale (generateTextFile)
};

/** Opzioni omesse dal pannello (non mostrate come riga disabilitata) se il formato corrente non le supporta.
 *  Oggi: solo `travelNotes` — nascosta in TXT; visibile in PDF/DOCX.
 *  Le altre opzioni restano in elenco e usano `disabled` quando non applicabili. */
const EXPORT_OPTIONS_HIDDEN_WHEN_UNSUPPORTED = new Set<ExportOptionKey>(['travelNotes']);

const isExportOptionApplicable = (key: ExportOptionKey, format: ExportFormat): boolean =>
    EXPORT_OPTION_FORMATS[key].includes(format);

/** True se la riga opzione va renderizzata; false = formato non supportato e riga nascosta. */
const shouldRenderExportOption = (key: ExportOptionKey, format: ExportFormat): boolean =>
    !EXPORT_OPTIONS_HIDDEN_WHEN_UNSUPPORTED.has(key) || isExportOptionApplicable(key, format);

interface OptionRowProps {
    label: string;
    icon: LucideIcon;
    active: boolean;
    onClick: () => void;
    desc: string;
    disabled?: boolean;
}

/** Anteprima A4: larghezza fissa; altezza = proporzione 210Ã—297. */
const PREVIEW_A4_WIDTH_PX = 540;
const PREVIEW_A4_HEIGHT_PX = Math.round(PREVIEW_A4_WIDTH_PX * (297 / 210));
const PREVIEW_PAGE_PAD_PX = 32;
const PREVIEW_SHEET_HEADER_PX = 56;
/** Area riservata al footer editoriale (separatore + numerazione), come nel PDF. */
const PREVIEW_SHEET_FOOTER_PX = 36;
/** Altezza utile corpo pagina (senza padding foglio, header logo e footer). */
const PREVIEW_BODY_MAX_PX =
    PREVIEW_A4_HEIGHT_PX -
    PREVIEW_PAGE_PAD_PX * 2 -
    PREVIEW_SHEET_HEADER_PX -
    PREVIEW_SHEET_FOOTER_PX;

/** Stima altezza blocco timeline — colonna testo (~75%). */
const PREVIEW_TIMELINE_BASE_MAIN_H = 52;
const PREVIEW_DESC_HEIGHT_CAP = 72;
const PREVIEW_DESC_BASE_H = 24;
const PREVIEW_DESC_LINE_H = 14;
const PREVIEW_NOTES_BLOCK_H = 48;
const PREVIEW_DISTANCE_BLOCK_H = 28;
/** Stima altezza blocco timeline — colonna laterale (~25%). */
const PREVIEW_DURATION_SIDE_H = 18;
const PREVIEW_PHOTO_SIDE_H = 78;
const PREVIEW_QR_MIN_H = 72;
/** Flex 75/25 nella preview timeline (testo | durata+foto). */
const PREVIEW_TIMELINE_MAIN_FLEX = '3 1 0%';
const PREVIEW_TIMELINE_SIDE_FLEX = '1 1 0%';

type PreviewExportOptions = {
    coverIllustrated: boolean;
    photos: boolean;
    qrCodes: boolean;
    summary: boolean;
    details: boolean;
    notes: boolean;
    resources: boolean;
    travelNotes: boolean;
};

type PreviewFlowBlock =
    | { kind: 'day-title'; dayIndex: number; continued?: boolean }
    | { kind: 'timeline-item'; item: PreparedItineraryItem }
    | { kind: 'resources-title' }
    | { kind: 'resource-row'; item: PreparedItineraryItem }
    | { kind: 'notes-title' }
    | { kind: 'notes-tab'; title: string; nodes: DiaryNotesNode[] };

const estimatePreviewBlockHeight = (
    block: PreviewFlowBlock,
    opts: PreviewExportOptions,
): number => {
    switch (block.kind) {
        case 'day-title':
            return block.continued ? 36 : 44;
        case 'timeline-item': {
            // Layout 75/25: foto a destra → altezza guidata dal max(testo, durata+foto)
            let mainH = PREVIEW_TIMELINE_BASE_MAIN_H;
            if (opts.details && block.item.poi?.description) {
                mainH += Math.min(
                    PREVIEW_DESC_HEIGHT_CAP,
                    PREVIEW_DESC_BASE_H + Math.ceil((block.item.poi.description.length || 0) / 70) * PREVIEW_DESC_LINE_H,
                );
            }
            if (opts.notes && block.item.notes) mainH += PREVIEW_NOTES_BLOCK_H;
            if (block.item.distanceFromPrev != null && block.item.distanceFromPrev > 0) {
                mainH += PREVIEW_DISTANCE_BLOCK_H;
            }

            let sideH = 8;
            if (block.item.poi?.visitDuration) sideH += PREVIEW_DURATION_SIDE_H;
            if (opts.photos && block.item.processedImage) sideH += PREVIEW_PHOTO_SIDE_H;

            let h = Math.max(mainH, sideH);
            if (opts.qrCodes && block.item.qrCodeUrl) h = Math.max(h, PREVIEW_QR_MIN_H);
            return h;
        }
        case 'resources-title':
            return 44;
        case 'resource-row':
            return 36;
        case 'notes-title':
            return 44;
        case 'notes-tab':
            return 40 + Math.max(PREVIEW_NOTES_BLOCK_H, block.nodes.length * 22);
        default:
            return 40;
    }
};

/** Packing greedy: blocchi che non entrano passano alla pagina successiva (WYSIWYG). */
const packPreviewBlocksIntoPages = (
    blocks: PreviewFlowBlock[],
    opts: PreviewExportOptions,
    maxBodyPx: number,
): PreviewFlowBlock[][] => {
    if (blocks.length === 0) return [];
    const pages: PreviewFlowBlock[][] = [];
    let current: PreviewFlowBlock[] = [];
    let used = 0;

    for (const block of blocks) {
        // Ogni nuovo Giorno e la sezione Note iniziano sempre su pagina nuova.
        const forceNewPage =
            (block.kind === 'day-title' && !block.continued) ||
            block.kind === 'notes-title';

        if (forceNewPage && current.length > 0) {
            pages.push(current);
            current = [];
            used = 0;
        }

        const h = estimatePreviewBlockHeight(block, opts);
        if (current.length > 0 && used + h > maxBodyPx) {
            pages.push(current);
            current = [];
            used = 0;
        }
        // Blocco più alto della pagina: comunque una pagina dedicata (niente scroll interno).
        if (h > maxBodyPx && current.length === 0) {
            pages.push([block]);
            continue;
        }
        current.push(block);
        used += h;
    }
    if (current.length > 0) pages.push(current);
    return pages;
};

export const ExportModal = ({ isOpen, onClose }: ExportModalProps) => {
    const { itinerary } = useItinerary();
    // Usa ExportLogo con dimensioni appropriate per la rasterizzazione
    const logoBase64 = useLogoRasterizer();
    
    // STATO OPZIONI
    const [format, setFormat] = useState<ExportFormat>('pdf');
    const [options, setOptions] = useState({
        coverIllustrated: true,
        photos: true,
        qrCodes: true,
        summary: true, 
        details: true,
        notes: true,
        resources: true,
        travelNotes: false
    });

    const [isPreparing, setIsPreparing] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false); 
    const [progress, setProgress] = useState(0);
    const [preparedDoc, setPreparedDoc] = useState<PreparedItinerary | null>(null);
    const [genError, setGenError] = useState<string | null>(null);
    
    const [cityNamesMap, setCityNamesMap] = useState<Record<string, string>>({});

    const filterSectionLabel10Style = useDynamicStyles('filter_section_title', true);


    // RESET & INIT — esclusivamente all’apertura del modale (`isOpen` → true).
    // Invariante: `itinerary.diaryNotes` è letto qui per il default di `travelNotes`,
    // ma NON va nelle dipendenze dell’effect. Se le diaryNotes cambiano mentre il
    // modale è già aperto (autosave / undo / sync), le opzioni scelte dall’utente
    // non devono essere resettate.
    useEffect(() => {
        if (!isOpen) return;

        setFormat('pdf');
        setIsPreparing(false);
        setPreparedDoc(null);
        setCityNamesMap({});
        setOptions({
            coverIllustrated: true,
            photos: true,
            qrCodes: true,
            summary: true,
            details: true,
            notes: true,
            resources: true,
            travelNotes: diaryNotesHasMeaningfulContent(itinerary.diaryNotes),
        });
        // Architettura Export — Source of Truth immagini (invariante):
        // - prepareItineraryForPdf gira UNA sola volta all’apertura (forceFullImages=true);
        // - i toggle UI (Foto Luoghi, Copertina, ecc.) filtrano SOLO il rendering, mai una nuova prepare;
        // - PDF (TravelDocument), DOCX (exportGenerators) e Preview HTML (ExportModal) leggono lo stesso preparedDoc.
        startPdfPreparation(true);
    }, [isOpen]);

    // UPDATE MAPPA NOMI CITTÃ€
    useEffect(() => {
        if (preparedDoc && preparedDoc.citiesInfo) {
            const newMap: Record<string, string> = {};
            preparedDoc.citiesInfo.forEach((c: CityVisualInfo) => {
                newMap[c.id] = c.name;
            });
            setCityNamesMap(newMap);
        }
    }, [preparedDoc]);

    const preparedItemsPartition = useMemo(() => {
        const empty = {
            timelineItems: [] as PreparedItineraryItem[],
            resourceItems: [] as PreparedItineraryItem[],
            dayItemsMap: new Map<number, PreparedItineraryItem[]>(),
        };
        if (!preparedDoc) return empty;

        const timelineItems: PreparedItineraryItem[] = [];
        const resourceItems: PreparedItineraryItem[] = [];
        const dayItemsMap = new Map<number, PreparedItineraryItem[]>();

        for (const item of preparedDoc.items) {
            if (item.isResource) {
                resourceItems.push(item);
                continue;
            }
            timelineItems.push(item);
            const dayItems = dayItemsMap.get(item.dayIndex);
            if (dayItems) dayItems.push(item);
            else dayItemsMap.set(item.dayIndex, [item]);
        }

        return { timelineItems, resourceItems, dayItemsMap };
    }, [preparedDoc]);

    const toggleOption = (key: keyof typeof options) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const startPdfPreparation = async (forceFullImages: boolean) => {
        setIsPreparing(true);
        setGenError(null);
        setProgress(10);
        try {
            const prepared = await prepareItineraryForPdf(
                itinerary, 
                { 
                    includePhotos: forceFullImages, 
                    includeQr: true // Generiamo sempre i QR all'inizio, poi li nascondiamo via UI
                },
                (pct) => setProgress(pct)
            );
            setPreparedDoc(prepared);
            logPdfImagePipeline({
                stage: 'exportModal:prepared',
                extra: {
                    totalItems: prepared.items.length,
                    itemsWithProcessedImage: prepared.items.filter((item) => Boolean(item.processedImage)).length,
                    itemsWithImageUrlButNoProcessedImage: prepared.items
                        .filter((item) => item.poi?.imageUrl && !item.processedImage)
                        .map((item) => ({
                            itemId: item.id,
                            poiName: item.poi?.name,
                            imageUrl: item.poi?.imageUrl,
                        })),
                },
            });
        } catch (e: any) {
            console.error("PDF Prep Error", e);
            setGenError(`Errore dati: ${e.message}`);
        } finally {
            setIsPreparing(false);
        }
    };
    
    // Helper costruzione nome file
    const buildFilename = (ext: string) => {
        const uniqueCityNames = Object.values(cityNamesMap);
        let namePart = itinerary.name || 'Viaggio';
        
        if (uniqueCityNames.length > 0) {
             namePart = `Viaggio-${uniqueCityNames.join('_')}`;
        }
        
        // Pulisci caratteri illegali
        namePart = namePart.replace(/[\\/:*?"<>|]/g, '');
        return `TD-${namePart}.${ext}`;
    };

    const handleDownload = async () => {
        if (format === 'pdf') {
            if (!preparedDoc) return;
            setIsGeneratingPdf(true);
            try {
                await ensureNodePdfPolyfills();
                const [{ pdf }, { TravelDocument }] = await Promise.all([
                    import('@react-pdf/renderer'),
                    import('../pdf/TravelDocument'),
                ]);

                const timelineItems = preparedItemsPartition.timelineItems;
                for (const item of timelineItems) {
                    const snapshotImageUrl = item.poi?.imageUrl?.trim() || '';
                    if (!snapshotImageUrl && !item.processedImage) continue;

                    logPdfImagePipeline({
                        stage: 'exportModal:pdf-handoff',
                        itemId: item.id,
                        poiName: item.poi?.name,
                        imageUrl: snapshotImageUrl || undefined,
                        optionsPhotos: options.photos,
                        hasImageUrl: Boolean(snapshotImageUrl),
                        ...summarizeProcessedImage(item.processedImage),
                        extra: {
                            processedImagePresentInPreparedDoc: Boolean(item.processedImage),
                            snapshotImageUrl: snapshotImageUrl || undefined,
                            renderConditionMet: Boolean(options.photos && item.processedImage),
                        },
                    });
                }

                logPdfImagePipeline({
                    stage: 'exportModal:pdf-generate-start',
                    optionsPhotos: options.photos,
                    extra: {
                        timelineItems: timelineItems.length,
                        handoffWithProcessedImage: timelineItems.filter((item) => item.processedImage).length,
                    },
                });

                const blob = await runWithPdfPipelineWarningCapture(() =>
                    pdf(
                        <TravelDocument
                            itinerary={preparedDoc}
                            logoBase64={logoBase64 || ''}
                            options={options}
                        />
                    ).toBlob(),
                );
                FileSaver.saveAs(blob, buildFilename('pdf'));
            } catch (e: any) {
                console.error("PDF GENERATION ERROR:", e);
                setGenError("Errore salvataggio PDF.");
            } finally {
                setIsGeneratingPdf(false);
            }
        } else if (format === 'docx') {
            if (!preparedDoc) {
                 await startPdfPreparation(true);
                 return;
            }
            setIsGeneratingPdf(true);
            try {
                await ensureNodePdfPolyfills();
                // Passa logoBase64 e cityMap
                await generateWordDocument(preparedDoc, options, logoBase64, cityNamesMap);
            } catch (e: any) {
                console.error(e);
                setGenError("Errore salvataggio Word. Riprova senza immagini.");
            } finally {
                setIsGeneratingPdf(false);
            }
        } else {
            // Passa itinerary e cityMap
            const textContent = generateTextFile(itinerary, cityNamesMap, true);
            const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
            FileSaver.saveAs(blob, buildFilename('txt'));
        }
    };

    const renderNoteInline = (node: DiaryNotesNode, key: string): React.ReactNode => {
        if (node.type !== 'text') {
            return node.content?.map((child, index) => renderNoteInline(child, `${key}-${index}`)) ?? null;
        }

        const marks = node.marks ?? [];
        const href = marks.find(mark => mark.type === 'link')?.attrs?.href;
        const textColor = marks.find(mark => mark.type === 'textStyle')?.attrs?.color;
        let content: React.ReactNode = typeof href === 'string' && href !== node.text
            ? `${node.text ?? ''} (${href})`
            : node.text;

        if (marks.some(mark => mark.type === 'bold')) content = <strong key={`${key}-b`}>{content}</strong>;
        if (marks.some(mark => mark.type === 'italic')) content = <em key={`${key}-i`}>{content}</em>;
        if (marks.some(mark => mark.type === 'strike')) content = <s key={`${key}-s`}>{content}</s>;
        if (marks.some(mark => mark.type === 'underline')) content = <u key={`${key}-u`}>{content}</u>;
        if (typeof textColor === 'string') {
            content = <span key={`${key}-c`} style={{ color: textColor }}>{content}</span>;
        }

        return <span key={key}>{content}</span>;
    };

    const renderNoteBlock = (node: DiaryNotesNode, key: string): React.ReactNode => {
        if (node.type === 'heading') {
            return (
                <h3 key={key} className="text-base font-bold text-slate-900 mt-4 mb-2">
                    {node.content?.map((child, index) => renderNoteInline(child, `${key}-${index}`))}
                </h3>
            );
        }

        if (node.type === 'paragraph') {
            return (
                <p key={key} className="text-sm text-slate-700 leading-relaxed mb-2">
                    {node.content?.map((child, index) => renderNoteInline(child, `${key}-${index}`))}
                </p>
            );
        }

        if (node.type === 'bulletList' || node.type === 'orderedList') {
            const ListTag = node.type === 'orderedList' ? 'ol' : 'ul';
            return (
                <ListTag key={key} className={`text-sm text-slate-700 mb-3 pl-5 ${node.type === 'orderedList' ? 'list-decimal' : 'list-disc'}`}>
                    {node.content?.map((item, index) => (
                        <li key={`${key}-${index}`} className="mb-1">
                            {item.content?.map((child, childIndex) => renderNoteBlock(child, `${key}-${index}-${childIndex}`))}
                        </li>
                    ))}
                </ListTag>
            );
        }

        if (node.type === 'taskList') {
            return (
                <div key={key} className="space-y-1 mb-3">
                    {node.content?.map((item, index) => (
                        <div key={`${key}-${index}`} className="flex gap-2 text-sm text-slate-700">
                            <span className="font-mono">{item.attrs?.checked === true ? '[x]' : '[ ]'}</span>
                            <div>{item.content?.map((child, childIndex) => renderNoteBlock(child, `${key}-${index}-${childIndex}`))}</div>
                        </div>
                    ))}
                </div>
            );
        }

        return node.content?.map((child, index) => renderNoteBlock(child, `${key}-${index}`)) ?? null;
    };

    const renderTravelNotesTabInline = (title: string, nodes: DiaryNotesNode[]) => (
        <section className="mb-4 border-b border-slate-100 pb-3 last:mb-0 last:border-0 last:pb-0">
            <h3 className="mb-2 text-base font-bold text-slate-900">{title}</h3>
            {nodes.length > 0 ? (
                nodes.map((node, nodeIndex) => renderNoteBlock(node, `note-flow-${title}-${nodeIndex}`))
            ) : (
                <p className="text-sm italic text-slate-400">Nessun contenuto.</p>
            )}
        </section>
    );

    const renderPreviewPageHeader = useCallback(() => (
        <div className="mb-0 flex shrink-0 flex-col" style={{ minHeight: PREVIEW_SHEET_HEADER_PX }}>
            <div className="flex items-center justify-between">
                {logoBase64 ? (
                    <img src={logoBase64} alt="TOURING Diary" className="h-12 max-w-[85%] object-contain object-left" />
                ) : (
                    <h1 className="flex items-baseline gap-1.5 leading-none">
                        <span className="font-display text-2xl font-black uppercase tracking-wider text-slate-900">
                            TOURING
                        </span>
                        <span className="font-handwriting text-3xl font-bold italic text-amber-500">Diary</span>
                    </h1>
                )}
                <span className="text-[10px] text-slate-400">touringdiary-it.com</span>
            </div>
            {/* Linea subito sotto il brand (allineata al PDF headerRule). */}
            <div className="mt-0.5 w-full border-b border-slate-200" />
        </div>
    ), [logoBase64]);

    const renderCoverCollagePreview = useCallback(() => {
        if (!options.coverIllustrated || !preparedDoc) return null;

        const heroImages = preparedDoc.citiesInfo
            .map((c: CityVisualInfo) => c.heroImageBase64)
            .filter(Boolean) as string[];

        if (heroImages.length === 0) {
            return (
                <div className="flex h-28 w-full items-center justify-center bg-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Nessuna foto disponibile
                </div>
            );
        }

        const plan = buildHeroCoverCollagePlan(heroImages.length);

        if (plan.kind === 'single') {
            return (
                <img
                    src={heroImages[plan.top]}
                    alt="Copertina città"
                    className="h-[260px] w-full object-cover"
                />
            );
        }

        return (
            <div className="mx-auto flex w-[88%] flex-col gap-2">
                {plan.indices.map((idx) => (
                    <img
                        key={`hero-${idx}`}
                        src={heroImages[idx]}
                        alt={`Copertina città ${idx + 1}`}
                        className="h-[120px] w-full object-cover"
                    />
                ))}
            </div>
        );
    }, [options.coverIllustrated, preparedDoc]);

    const renderTimelineItemPreview = useCallback((item: PreparedItineraryItem) => (
        <div className="flex gap-3">
            <div className="w-16 shrink-0 text-right">
                <div className="text-xs font-bold text-slate-800">{item.timeSlotStr}</div>
                {options.qrCodes && item.qrCodeUrl && (
                    <img src={item.qrCodeUrl} alt="QR" className="ml-auto mt-1 h-8 w-8" />
                )}
            </div>
            <div className="flex w-3 flex-col items-center">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                <div className="my-0.5 h-full w-px bg-slate-200" />
            </div>
            {/* A destra del QR: 75% testo | 25% durata + foto */}
            <div className="flex min-w-0 flex-1 gap-2 pb-3">
                <div className="min-w-0" style={{ flex: PREVIEW_TIMELINE_MAIN_FLEX }}>
                    {item.distanceFromPrev != null && item.distanceFromPrev > 0 && (
                        <div className="mb-1.5 border-b border-dashed border-red-200 pb-1 text-center text-[10px] font-bold text-red-600">
                            --- DISTANZA {item.distanceFromPrev} KM ---
                        </div>
                    )}
                    <div className="text-[10px] font-bold uppercase text-amber-600">{item.poi.category || 'POI'}</div>
                    <div className="text-sm font-bold text-slate-900">{item.poi.name}</div>
                    {item.poi.address && <div className="mt-0.5 text-[11px] italic text-slate-500">{item.poi.address}</div>}
                    {options.details && item.poi.description && (
                        <div className="mt-1.5 text-[11px] leading-snug text-slate-700">{item.poi.description}</div>
                    )}
                    {options.notes && item.notes && (
                        <div className="mt-1.5 rounded border border-amber-200 bg-amber-50 p-1.5">
                            <span className="text-[9px] font-bold text-amber-900">NOTA:</span>
                            <p className="mt-0.5 text-[11px] text-amber-900">{item.notes}</p>
                        </div>
                    )}
                </div>
                <div className="shrink-0" style={{ flex: PREVIEW_TIMELINE_SIDE_FLEX, maxWidth: '25%' }}>
                    {item.poi.visitDuration && (
                        <div className="text-[10px] font-bold leading-tight text-slate-500">
                            Durata visita: {item.poi.visitDuration}
                        </div>
                    )}
                    {options.photos && item.processedImage && (
                        <img
                            src={item.processedImage}
                            alt={item.poi.name}
                            className="mt-1 w-full object-cover"
                            style={{ maxHeight: PREVIEW_PHOTO_SIDE_H }}
                        />
                    )}
                </div>
            </div>
        </div>
    ), [options.qrCodes, options.details, options.notes, options.photos]);

    const PreviewA4Sheet = ({
        children,
        pageNumber,
        totalPages,
    }: {
        children: React.ReactNode;
        pageNumber: number;
        totalPages: number;
    }) => (
        <div className="mx-auto w-full" style={{ maxWidth: PREVIEW_A4_WIDTH_PX }}>
            <div
                className="flex flex-col overflow-hidden bg-white text-slate-800 shadow-2xl"
                style={{
                    width: PREVIEW_A4_WIDTH_PX,
                    height: PREVIEW_A4_HEIGHT_PX,
                    maxWidth: '100%',
                    padding: PREVIEW_PAGE_PAD_PX,
                }}
            >
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
                {/* Footer editoriale: allineato al PDF (separatore + Pagina X di Y) */}
                <footer
                    className="flex shrink-0 flex-col items-center justify-end"
                    style={{ height: PREVIEW_SHEET_FOOTER_PX }}
                    aria-label={`Pagina ${pageNumber} di ${totalPages}`}
                >
                    <div className="mb-2 w-full border-t border-slate-200" />
                    <span className="text-[10px] tracking-wide text-slate-400">
                        Pagina {pageNumber} di {totalPages}
                    </span>
                </footer>
            </div>
        </div>
    );

    const previewFlowPages = useMemo(() => {
        if (!preparedDoc || format === 'txt') return [] as PreviewFlowBlock[][];

        const { resourceItems, dayItemsMap } = preparedItemsPartition;
        const dayIndexes = Array.from(dayItemsMap.keys()).sort((a, b) => a - b);

        const blocks: PreviewFlowBlock[] = [];

        dayIndexes.forEach((dayIndex) => {
            const dayItems = dayItemsMap.get(dayIndex) || [];
            blocks.push({ kind: 'day-title', dayIndex });
            dayItems.forEach((item) => {
                blocks.push({ kind: 'timeline-item', item });
            });
        });

        if (options.resources && resourceItems.length > 0) {
            blocks.push({ kind: 'resources-title' });
            resourceItems.forEach((item) => {
                blocks.push({ kind: 'resource-row', item });
            });
        }

        if (options.travelNotes && itinerary.diaryNotes) {
            const notesState = normalizeDiaryNotesState(itinerary.diaryNotes);
            const tabsWithContent = notesState.tabs.filter((tab) =>
                diaryNotesHasMeaningfulContent(tab.document),
            );
            // Anteprima: niente pagina «NOTE DI VIAGGIO» se tutte le tab sono vuote.
            if (tabsWithContent.length > 0) {
                blocks.push({ kind: 'notes-title' });
                tabsWithContent.forEach((tab) => {
                    blocks.push({
                        kind: 'notes-tab',
                        title: tab.title,
                        nodes: tab.document.content,
                    });
                });
            }
        }

        return packPreviewBlocksIntoPages(blocks, options, PREVIEW_BODY_MAX_PX);
    }, [preparedDoc, preparedItemsPartition, format, options, itinerary.diaryNotes]);

    const renderFlowBlock = useCallback((block: PreviewFlowBlock, key: string) => {
        switch (block.kind) {
            case 'day-title':
                return (
                    <h2 key={key} className="mb-3 border-b-2 border-amber-600 pb-1.5 text-lg font-bold text-amber-600">
                        GIORNO {block.dayIndex + 1}
                        {block.continued ? ' (continua)' : ''}
                    </h2>
                );
            case 'timeline-item':
                return <div key={key}>{renderTimelineItemPreview(block.item)}</div>;
            case 'resources-title':
                return (
                    <h2 key={key} className="mb-3 border-b-2 border-slate-300 pb-1.5 text-lg font-bold text-slate-800">
                        CONTATTI E RISORSE
                    </h2>
                );
            case 'resource-row':
                return (
                    <div key={key} className="grid grid-cols-3 gap-2 border-b border-slate-100 py-1.5 text-xs">
                        <span className="font-bold text-slate-900">{block.item.poi.name}</span>
                        <span className="text-slate-600">{block.item.poi.resourceType || 'Partner'}</span>
                        <span className="text-slate-600">
                            {block.item.poi.contactInfo?.phone || block.item.poi.address || '-'}
                        </span>
                    </div>
                );
            case 'notes-title':
                return (
                    <h2 key={key} className="mb-3 border-b-2 border-amber-600 pb-1.5 text-lg font-bold text-amber-600">
                        NOTE DI VIAGGIO
                    </h2>
                );
            case 'notes-tab':
                return <div key={key}>{renderTravelNotesTabInline(block.title, block.nodes)}</div>;
            default:
                return null;
        }
    }, [renderTimelineItemPreview]);

    const renderHtmlPreview = () => {
        if (!preparedDoc) return null;

        if (format === 'txt') {
            const textContent = generateTextFile(itinerary, cityNamesMap, true);
            return (
                <div className="custom-scrollbar h-full w-full overflow-y-auto rounded-xl bg-white p-6 font-mono text-xs whitespace-pre-wrap text-slate-800 shadow-2xl">
                    {textContent}
                </div>
            );
        }

        const showCover = Boolean(options.summary || options.coverIllustrated);
        const totalPages = (showCover ? 1 : 0) + previewFlowPages.length;
        const sheets: React.ReactNode[] = [];
        let pageNum = 0;

        if (showCover) {
            pageNum += 1;
            sheets.push(
                <PreviewA4Sheet key="cover" pageNumber={pageNum} totalPages={totalPages}>
                    {renderPreviewPageHeader()}
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        {options.summary && (
                            <div className="shrink-0 pt-5 text-center">
                                <h1 className="mb-1 font-serif text-2xl font-bold uppercase leading-tight text-slate-900">
                                    {itinerary.name || 'IL MIO VIAGGIO'}
                                </h1>
                                <p className="mb-0.5 text-sm italic text-slate-500">
                                    {Object.values(cityNamesMap).join(', ') || preparedDoc.formattedCityList}
                                </p>
                                <p className="text-base font-bold text-amber-600">
                                    {itinerary.startDate || 'Data inizio'} — {itinerary.endDate || 'Data fine'}
                                </p>
                                {/* Separatore editoriale sotto le date */}
                                <div className="mx-auto mt-3 mb-0 flex w-36 items-center gap-2" aria-hidden>
                                    <span className="h-px flex-1 bg-slate-300" />
                                    <span className="h-1.5 w-1.5 rotate-45 border border-amber-600 bg-amber-500/30" />
                                    <span className="h-px flex-1 bg-slate-300" />
                                </div>
                            </div>
                        )}
                        {/* Collage centrato nella fascia libera (come coverPhotoBand nel PDF). */}
                        {options.coverIllustrated && (
                            <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
                                <div className="w-full shrink-0">{renderCoverCollagePreview()}</div>
                            </div>
                        )}
                    </div>
                </PreviewA4Sheet>,
            );
        }

        previewFlowPages.forEach((pageBlocks, idx) => {
            pageNum += 1;
            let blocksToRender = pageBlocks;
            const first = pageBlocks[0];
            if (first?.kind === 'timeline-item') {
                blocksToRender = [
                    { kind: 'day-title', dayIndex: first.item.dayIndex, continued: true },
                    ...pageBlocks,
                ];
            }

            sheets.push(
                <PreviewA4Sheet key={`flow-${idx}`} pageNumber={pageNum} totalPages={totalPages}>
                    {renderPreviewPageHeader()}
                    <div className="min-h-0 flex-1 overflow-hidden">
                        {blocksToRender.map((block, bi) => renderFlowBlock(block, `p${idx}-b${bi}`))}
                    </div>
                </PreviewA4Sheet>,
            );
        });

        return (
            <div className="custom-scrollbar flex h-full w-full flex-col items-center gap-10 overflow-y-auto px-4 py-6">
                {sheets}
            </div>
        );
    };

    const exportHeader = (
        <div className="flex items-center gap-3 border-b border-slate-800 bg-[#0f172a] px-6 py-4">
            <div className="shrink-0 rounded-xl bg-indigo-600 p-2.5 shadow-lg">
                <Printer className="h-5 w-5 text-white" />
            </div>
            <div>
                <h2 className="text-lg font-black uppercase tracking-wide text-white">Esporta Viaggio</h2>
                <p className="text-sm font-medium text-slate-400">Anteprima e Stampa</p>
            </div>
        </div>
    );

    return (
        <BaseFullscreenModalShell
            isOpen={isOpen}
            onClose={onClose}
            header={exportHeader}
            maxWidth="7xl"
            fullHeight={false}
            padding="p-0 md:p-4"
            overlayClassName="bg-black/90 backdrop-blur-sm"
            // Eccezione voluta: dimensione originale del modale export (non full-bleed DS).
            panelClassName="!max-w-6xl !h-[90vh] max-h-[90vh] bg-slate-900 md:rounded-3xl border-slate-700"
            closeButtonClassName="top-3 right-3 md:top-3.5 md:right-4"
        >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
                <div className="custom-scrollbar flex w-full flex-col overflow-y-auto border-r border-slate-800 bg-[#0f172a] p-6 md:w-[35%]">
                    <div className="mb-6">
                        <label className={`${filterSectionLabel10Style} mb-3 block`}>Formato</label>
                        <div className="grid grid-cols-3 gap-2">
                            {EXPORT_FORMATS.map((fmt) => (
                                <button
                                    key={fmt}
                                    type="button"
                                    onClick={() => setFormat(fmt)}
                                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all ${format === fmt ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg' : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-600'}`}
                                >
                                    <FileText className="h-5 w-5" />
                                    <span className="text-[10px] font-bold uppercase">{fmt}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-auto">
                        <label className={`${filterSectionLabel10Style} mb-3 block`}>Opzioni</label>
                        <div className="space-y-2">
                            <OptionRow
                                label="Copertina illustrata"
                                icon={ImageIcon}
                                active={options.coverIllustrated}
                                onClick={() => toggleOption('coverIllustrated')}
                                desc="Mostra l'immagine della città."
                                disabled={!isExportOptionApplicable('coverIllustrated', format)}
                            />
                            <OptionRow
                                label="Descrizione"
                                icon={LayoutList}
                                active={options.details}
                                onClick={() => toggleOption('details')}
                                desc="Descrizione della tappa."
                                disabled={!isExportOptionApplicable('details', format)}
                            />
                            <OptionRow
                                label="Viaggio"
                                icon={FileText}
                                active={options.summary}
                                onClick={() => toggleOption('summary')}
                                desc="Panoramica del viaggio."
                                disabled={!isExportOptionApplicable('summary', format)}
                            />
                            <OptionRow label="Note Timeline" icon={Edit3} active={options.notes} onClick={() => toggleOption('notes')} desc="Le tue annotazioni." disabled={!isExportOptionApplicable('notes', format)} />
                            <OptionRow label="Foto Luoghi" icon={ImageIcon} active={options.photos} onClick={() => toggleOption('photos')} desc="Immagini nella timeline." disabled={!isExportOptionApplicable('photos', format)} />
                            <OptionRow label="QR Luoghi" icon={QrCode} active={options.qrCodes} onClick={() => toggleOption('qrCodes')} desc="Link rapidi ai luoghi." disabled={!isExportOptionApplicable('qrCodes', format)} />
                            <OptionRow label="Contatti" icon={Link} active={options.resources} onClick={() => toggleOption('resources')} desc="Link e contatti utili." disabled={!isExportOptionApplicable('resources', format)} />
                            {shouldRenderExportOption('travelNotes', format) && (
                                <OptionRow label="Note Tab" icon={Edit3} active={options.travelNotes} onClick={() => toggleOption('travelNotes')} desc="Note del tab." />
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 border-t border-slate-800 pt-6">
                        {genError && (
                            <div className="flex w-full items-start gap-2 rounded-xl border border-red-500/50 bg-red-900/30 p-3 text-xs font-medium text-red-400">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{genError}</span>
                            </div>
                        )}
                        {isPreparing && (
                            <div className="mb-2 w-full">
                                <div className="mb-1 flex justify-between text-[10px] text-slate-400">
                                    <span>Preparazione...</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-1 overflow-hidden rounded-full bg-slate-800">
                                    <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={isPreparing || isGeneratingPdf || (format !== 'txt' && !preparedDoc)}
                            className="flex w-full items-center justify-center gap-3 rounded-xl bg-emerald-600 px-4 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
                        >
                            {isGeneratingPdf || isPreparing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                            {(isGeneratingPdf || isPreparing) ? 'Elaborazione...' : `Scarica ${format.toUpperCase()}`}
                        </button>
                    </div>
                </div>

                <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#2d3032]">
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 text-[10px] font-bold tracking-wider text-white uppercase shadow-lg backdrop-blur">
                        <Sparkles className="h-3 w-3 text-amber-500" /> Anteprima {format.toUpperCase()}
                    </div>

                    <div className="h-full min-h-0 flex-1 overflow-hidden pt-12">
                        {isPreparing ? (
                            <div className="flex h-full flex-col items-center justify-center gap-4 text-white/50">
                                <Loader2 className="h-10 w-10 animate-spin" />
                                <p className="text-xs font-bold uppercase">Generazione Anteprima...</p>
                            </div>
                        ) : (
                            renderHtmlPreview()
                        )}
                    </div>
                </div>
            </div>
        </BaseFullscreenModalShell>
    );
};

const OptionRow = ({ label, icon: Icon, active, onClick, desc, disabled }: OptionRowProps) => (
    <button
        type="button"
        disabled={disabled}
        onClick={!disabled ? onClick : undefined}
        aria-pressed={active}
        className={`flex w-full items-center justify-between rounded-xl border bg-transparent p-3 text-left transition-all ${disabled ? 'cursor-not-allowed border-slate-800 opacity-40' : 'cursor-pointer border-slate-800 hover:border-slate-600 hover:bg-slate-800'}`}
    >
        <div className="flex items-center gap-3">
            <div className={`rounded-lg p-1.5 ${active && !disabled ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-500'}`}>
                <Icon className="h-4 w-4" />
            </div>
            <div>
                <div className={`text-[14px] font-bold ${active && !disabled ? 'text-white' : 'text-slate-400'}`}>{label}</div>
                <div className="text-[11px] text-slate-500">{desc}</div>
            </div>
        </div>
        {!disabled && (
            <div className={`flex h-5 w-5 items-center justify-center rounded border ${active ? 'border-indigo-500 bg-indigo-600' : 'border-slate-700 bg-slate-950'}`}>
                {active ? <CheckSquare className="h-3.5 w-3.5 text-white" /> : <Square className="h-3.5 w-3.5 text-slate-600" />}
            </div>
        )}
    </button>
);
