import React, { useState, useEffect } from 'react';
import { X, FileText, Image as ImageIcon, Printer, Download, LayoutList, ExternalLink, AlertTriangle, Loader2, Sparkles, CheckSquare, Square, QrCode, Edit3, Link } from 'lucide-react';
import { useItinerary } from '../../context/ItineraryContext';
import { pdf } from '@react-pdf/renderer';
import FileSaver from 'file-saver';
import { TravelDocument } from '../pdf/TravelDocument';
import { prepareItineraryForPdf, PreparedItinerary, CityVisualInfo } from '../../utils/pdfUtils'; 
import { generateWordDocument, generateTextFile } from '../../utils/exportGenerators'; 
import { useLogoRasterizer } from '../../hooks/useLogoRasterizer';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ExportFormat = 'pdf' | 'docx' | 'txt';

export const ExportModal = ({ isOpen, onClose }: ExportModalProps) => {
    const { itinerary } = useItinerary();
    const logoBase64 = useLogoRasterizer(); 
    
    // STATO OPZIONI
    const [format, setFormat] = useState<ExportFormat>('pdf');
    const [options, setOptions] = useState({
        photos: true,
        qrCodes: true,
        summary: true, 
        details: true,
        notes: true,
        resources: true
    });

    const [isPreparing, setIsPreparing] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false); 
    const [progress, setProgress] = useState(0);
    const [preparedDoc, setPreparedDoc] = useState<PreparedItinerary | null>(null);
    const [genError, setGenError] = useState<string | null>(null);
    
    const [cityNamesMap, setCityNamesMap] = useState<Record<string, string>>({});

    // ESC key listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // RESET & INIT
    useEffect(() => {
        if (isOpen) {
            setFormat('pdf');
            setIsPreparing(false);
            setPreparedDoc(null);
            setCityNamesMap({});
            // Prepara subito per mostrare qualcosa (genera tutto una volta)
            startPdfPreparation(true); 
        }
    }, [isOpen]);

    // UPDATE MAPPA NOMI CITTÀ
    useEffect(() => {
        if (preparedDoc && preparedDoc.citiesInfo) {
            const newMap: Record<string, string> = {};
            preparedDoc.citiesInfo.forEach((c: CityVisualInfo) => {
                newMap[c.id] = c.name;
            });
            setCityNamesMap(newMap);
        }
    }, [preparedDoc]);

    const toggleOption = (key: keyof typeof options) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const startPdfPreparation = async (forceFullImages: boolean) => {
        setIsPreparing(true);
        setGenError(null);
        setProgress(10);
        try {
            const coverUrl = itinerary.items[0]?.poi?.imageUrl || ''; 
            const prepared = await prepareItineraryForPdf(
                itinerary, 
                coverUrl, 
                { 
                    includePhotos: forceFullImages, 
                    includeQr: true // Generiamo sempre i QR all'inizio, poi li nascondiamo via UI
                },
                (pct) => setProgress(pct)
            );
            setPreparedDoc(prepared);
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
            if (!preparedDoc || !logoBase64) return;
            setIsGeneratingPdf(true);
            try {
                const blob = await pdf(<TravelDocument itinerary={preparedDoc} logoBase64={logoBase64} options={options} />).toBlob();
                FileSaver.saveAs(blob, buildFilename('pdf'));
            } catch (e: any) {
                setGenError("Errore salvataggio PDF.");
            } finally {
                setIsGeneratingPdf(false);
            }
        } else if (format === 'docx') {
            if (!preparedDoc) {
                 await startPdfPreparation(options.photos);
                 return;
            }
            setIsGeneratingPdf(true);
            try {
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

    const renderHtmlPreview = () => {
        if (!preparedDoc) return null;
        
        if (format === 'txt') {
            const textContent = generateTextFile(itinerary, cityNamesMap, true);
            return (
                <div className="w-full h-full bg-white rounded shadow-2xl p-6 overflow-y-auto text-slate-800 font-mono text-xs whitespace-pre-wrap">
                    {textContent}
                </div>
            );
        }
        
        // Render a styled HTML preview that looks like a document for PDF and DOCX
        return (
            <div className="w-full h-full bg-white rounded shadow-2xl p-8 overflow-y-auto text-slate-800 custom-scrollbar">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-8">
                    {logoBase64 ? (
                        <img src={logoBase64} alt="Logo" className="h-8 object-contain" />
                    ) : (
                        <h1 className="text-xl font-bold text-amber-600">TOURING DIARY</h1>
                    )}
                    <a href="https://touringdiary-it.com/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">touringdiary-it.com</a>
                </div>
                
                {/* Title */}
                {options.summary && (
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-serif font-bold text-slate-900 mb-4 uppercase">{itinerary.name || "IL MIO VIAGGIO"}</h1>
                        <p className="text-lg text-slate-500 italic mb-2">{Object.values(cityNamesMap).join(', ')}</p>
                        <p className="text-xl font-bold text-amber-600">{itinerary.startDate || 'Data inizio'} — {itinerary.endDate || 'Data fine'}</p>
                    </div>
                )}
                
                {/* Timeline */}
                {Array.from(new Set(preparedDoc.items.filter(i => !i.isResource).map(i => i.dayIndex))).sort().map(dayIndex => (
                    <div key={dayIndex} className="mb-8">
                        <h2 className="text-2xl font-bold text-amber-600 border-b-2 border-amber-600 pb-2 mb-6">GIORNO {dayIndex + 1}</h2>
                        <div className="space-y-6">
                            {preparedDoc.items.filter(i => !i.isResource && i.dayIndex === dayIndex).map((item, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="w-24 shrink-0 text-right">
                                        <div className="font-bold text-slate-800">{item.timeSlotStr}</div>
                                        {options.qrCodes && item.qrCodeUrl && (
                                            <img src={item.qrCodeUrl} alt="QR" className="w-12 h-12 ml-auto mt-2" />
                                        )}
                                    </div>
                                    <div className="w-4 flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5"></div>
                                        <div className="w-px h-full bg-slate-200 my-1"></div>
                                    </div>
                                    <div className="flex-1 pb-6">
                                        <div className="text-sm font-bold text-amber-600 uppercase">{item.poi.category || "POI"}</div>
                                        <div className="text-lg font-bold text-slate-900">{item.poi.name}</div>
                                        {item.poi.address && <div className="text-sm text-slate-500 italic mt-1">{item.poi.address}</div>}
                                        {item.poi.visitDuration && <div className="text-sm font-bold text-slate-500 mt-1">Durata visita: {item.poi.visitDuration}</div>}
                                        
                                        {options.photos && item.processedImage && (
                                            <img src={item.processedImage} alt={item.poi.name} className="w-48 h-32 object-cover rounded mt-3" />
                                        )}
                                        
                                        {options.details && item.poi.description && (
                                            <div className="text-sm text-slate-700 mt-3">{item.poi.description}</div>
                                        )}
                                        
                                        {options.notes && item.notes && (
                                            <div className="bg-amber-50 p-3 rounded mt-3 border border-amber-200">
                                                <span className="font-bold text-amber-900 text-xs">NOTA:</span>
                                                <p className="text-sm text-amber-900 mt-1">{item.notes}</p>
                                            </div>
                                        )}
                                        
                                        {item.distanceFromPrev !== null && item.distanceFromPrev > 0 && (
                                            <div className="text-center text-red-600 font-bold text-sm mt-6 border-t border-dashed border-slate-200 pt-4">
                                                --- DISTANZA {item.distanceFromPrev} KM ---
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                
                {/* Resources */}
                {options.resources && preparedDoc.items.filter(i => i.isResource).length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold text-slate-800 border-b-2 border-slate-300 pb-2 mb-6">CONTATTI E RISORSE</h2>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-700 font-bold">
                                <tr>
                                    <th className="px-4 py-2">NOME</th>
                                    <th className="px-4 py-2">TIPO</th>
                                    <th className="px-4 py-2">CONTATTO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preparedDoc.items.filter(i => i.isResource).map((res, idx) => (
                                    <tr key={idx} className="border-b border-slate-100">
                                        <td className="px-4 py-3 font-bold text-slate-900">{res.poi.name}</td>
                                        <td className="px-4 py-3 text-slate-600">{res.poi.resourceType || "Partner"}</td>
                                        <td className="px-4 py-3 text-slate-600">{res.poi.contactInfo?.phone || res.poi.address || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-6xl h-[90vh] rounded-3xl border border-slate-700 shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
                
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-lg z-50">
                    <X className="w-5 h-5"/>
                </button>

                {/* COLONNA SINISTRA */}
                <div className="w-full md:w-1/3 border-r border-slate-800 bg-[#0f172a] p-6 flex flex-col overflow-y-auto custom-scrollbar">
                    
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shrink-0">
                            <Printer className="w-6 h-6 text-white"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-display font-bold text-white uppercase tracking-wide">Esporta Viaggio</h2>
                            <p className="text-xs text-slate-400 font-medium">Anteprima e Stampa</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Formato</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['pdf', 'docx', 'txt'].map((fmt) => (
                                <button key={fmt} onClick={() => setFormat(fmt as any)} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${format === fmt ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'}`}>
                                    <FileText className="w-5 h-5"/> <span className="text-[10px] font-bold uppercase">{fmt}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-auto">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Opzioni</label>
                        <div className="space-y-2">
                             <OptionRow label="Diario Visuale" icon={LayoutList} active={options.details} onClick={() => toggleOption('details')} desc="Timeline completa." disabled={format==='txt'}/>
                             <OptionRow label="Foto Luoghi" icon={ImageIcon} active={options.photos} onClick={() => toggleOption('photos')} desc="Immagini nella timeline." disabled={format==='txt'}/>
                             <OptionRow label="Codici QR" icon={QrCode} active={options.qrCodes} onClick={() => toggleOption('qrCodes')} desc="Link rapidi ai luoghi." disabled={format==='txt'}/>
                             <OptionRow label="Riepilogo" icon={FileText} active={options.summary} onClick={() => toggleOption('summary')} desc="Panoramica del viaggio." disabled={format==='txt'}/>
                             <OptionRow label="Note Personali" icon={Edit3} active={options.notes} onClick={() => toggleOption('notes')} desc="Le tue annotazioni." disabled={format==='txt'}/>
                             <OptionRow label="Risorse" icon={Link} active={options.resources} onClick={() => toggleOption('resources')} desc="Link e contatti utili." disabled={format==='txt'}/>
                        </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-800 flex gap-3 flex-col">
                        {genError && (
                            <div className="w-full bg-red-900/30 border border-red-500/50 rounded-xl p-3 text-xs text-red-400 font-medium flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{genError}</span>
                            </div>
                        )}
                        {isPreparing && (
                             <div className="w-full mb-2">
                                <div className="flex justify-between text-[10px] text-slate-400 mb-1"><span>Preparazione...</span><span>{progress}%</span></div>
                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }}></div></div>
                            </div>
                        )}
                        <button onClick={handleDownload} disabled={isPreparing || isGeneratingPdf || (format !== 'txt' && !preparedDoc) || !logoBase64} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3">
                            {isGeneratingPdf || isPreparing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Download className="w-5 h-5"/>} 
                            {(isGeneratingPdf || isPreparing) ? 'Elaborazione...' : `Scarica ${format.toUpperCase()}`}
                        </button>
                    </div>
                </div>

                {/* COLONNA DESTRA: PREVIEW */}
                <div className="flex-1 bg-[#2d3032] relative flex flex-col h-full overflow-hidden">
                    <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-amber-500"/> Anteprima {format.toUpperCase()}
                    </div>

                    <div className="flex-1 flex items-center justify-center p-8 h-full overflow-hidden">
                        {isPreparing ? (
                            <div className="flex flex-col items-center text-white/50 gap-4">
                                <Loader2 className="w-10 h-10 animate-spin"/>
                                <p className="text-xs font-bold uppercase">Generazione Anteprima...</p>
                            </div>
                        ) : (
                            renderHtmlPreview()
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

const OptionRow = ({ label, icon: Icon, active, onClick, desc, disabled }: any) => (
    <div 
        onClick={!disabled ? onClick : undefined}
        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${disabled ? 'opacity-40 cursor-not-allowed border-slate-800' : 'cursor-pointer hover:bg-slate-800 hover:border-slate-600 border-slate-800'}`}
    >
        <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg ${active && !disabled ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-500'}`}>
                <Icon className="w-4 h-4"/>
            </div>
            <div>
                <div className={`text-xs font-bold ${active && !disabled ? 'text-white' : 'text-slate-400'}`}>{label}</div>
                <div className="text-[9px] text-slate-500">{desc}</div>
            </div>
        </div>
        {!disabled && (
             <div className={`w-5 h-5 rounded border flex items-center justify-center ${active ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-950 border-slate-700'}`}>
                {active ? <CheckSquare className="w-3.5 h-3.5 text-white"/> : <Square className="w-3.5 h-3.5 text-slate-600"/>}
            </div>
        )}
    </div>
);