
import React, { useState, useRef } from 'react';
import { Lock, Loader2, Save, Sparkles, Upload, Check, Globe, Phone, MapPin, AlertCircle } from 'lucide-react';
import { compressImage, dataURLtoFile } from '../../../utils/common';

// --- SUB COMPONENTS ---

const SectionTitle = ({ title }: { title: string }) => (
    <h4 className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-800 pb-2 flex items-center gap-2 mt-8 first:mt-0">
        {title}
    </h4>
);

const InputGroup = ({ label, required = false, children }: { label: string, required?: boolean, children?: React.ReactNode }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            {label} {required && <span className="text-amber-500">*</span>}
        </label>
        {children}
    </div>
);

const OpeningHoursSelector = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
    const initialDays = value.match(/(LUN|MAR|MER|GIO|VEN|SAB|DOM)/g) || [];
    const initialTimes = value.match(/(\d{2}:\d{2})/g) || ["09:00", "20:00"];

    const [selectedDays, setSelectedDays] = useState<string[]>(initialDays.length > 0 ? initialDays : ['LUN','MAR','MER','GIO','VEN','SAB']);
    const [startTime, setStartTime] = useState(initialTimes[0] || "09:00");
    const [endTime, setEndTime] = useState(initialTimes[1] || "20:00");

    const days = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];
    const times = [];
    for(let i=0; i<24; i++) {
        times.push(`${String(i).padStart(2,'0')}:00`);
        times.push(`${String(i).padStart(2,'0')}:30`);
    }

    const toggleDay = (d: string) => {
        const newDays = selectedDays.includes(d) 
            ? selectedDays.filter(day => day !== d)
            : [...selectedDays, d];
        const ordered = days.filter(day => newDays.includes(day));
        setSelectedDays(ordered);
    };

    React.useEffect(() => {
        if (selectedDays.length === 0) {
            onChange("");
            return;
        }
        const dayStr = selectedDays.join(', ');
        const finalStr = `${dayStr} ${startTime} - ${endTime}`;
        onChange(finalStr);
    }, [selectedDays, startTime, endTime]);

    return (
        <div className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3">
            <div className="flex justify-between gap-1 mb-3">
                {days.map(d => (
                    <button 
                        key={d}
                        type="button" 
                        onClick={() => toggleDay(d)}
                        className={`flex-1 py-2 rounded text-[9px] font-bold transition-all ${selectedDays.includes(d) ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                    >
                        {d}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Apertura</label>
                    <select value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono text-center outline-none">
                        {times.map(t => <option key={`start-${t}`} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="text-slate-500 font-bold">-</div>
                <div className="flex-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Chiusura</label>
                    <select value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono text-center outline-none">
                         {times.map(t => <option key={`end-${t}`} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
};

// --- MAIN FORM COMPONENT ---

interface SponsorFormProps {
    formData: any;
    setFormData: (data: any) => void;
    activeType: 'activity' | 'shop' | 'tour_operator' | 'guide';
    isGuest: boolean;
    isSubmitting: boolean;
    errorMsg: string | null;
    setErrorMsg: (msg: string | null) => void;
    onSubmit: (e: React.FormEvent) => void;
    setCoverImage: (file: File | null) => void;
    coverImage: File | null;
    termsAccepted: boolean;
    setTermsAccepted: (v: boolean) => void;
    privacyAccepted: boolean;
    setPrivacyAccepted: (v: boolean) => void;
    
    // NEW PROP: Passata dall'hook che ora contiene la logica sicura
    handleMagicRewrite?: () => Promise<string | null>;
}

export const SponsorForm = ({ 
    formData, setFormData, activeType, isGuest, isSubmitting, errorMsg, setErrorMsg, 
    onSubmit, setCoverImage, coverImage, termsAccepted, setTermsAccepted, privacyAccepted, setPrivacyAccepted,
    handleMagicRewrite 
}: SponsorFormProps) => {
    
    const [aiLoading, setAiLoading] = useState(false);
    const fileInputRefCover = useRef<HTMLInputElement>(null);

    const onMagicClick = async () => {
        if (!handleMagicRewrite) return;
        setAiLoading(true);
        const newText = await handleMagicRewrite();
        if (newText) {
             setFormData({ ...formData, description: newText });
             setErrorMsg(null);
        } else {
             setErrorMsg("AI momentaneamente non disponibile o testo troppo breve.");
        }
        setAiLoading(false);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressedBase64 = await compressImage(file);
                const compressedFile = dataURLtoFile(compressedBase64, file.name);
                setCoverImage(compressedFile);
            } catch(e) {
                setErrorMsg("Errore compressione immagine.");
            }
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-8 border-t border-slate-800 pt-8">
            
            {/* 1. DATI FISCALI */}
            <div>
                <SectionTitle title="Dati Fiscali & Fatturazione" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputGroup label="Ragione Sociale / Nome Completo" required>
                        <input type="text" placeholder="Es. Rossi SRL" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none text-sm" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} required/>
                    </InputGroup>
                    <InputGroup label="P.IVA / Codice Fiscale" required>
                        <input type="text" placeholder="IT00000000000" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none text-sm font-mono" value={formData.vatNumber} onChange={e => setFormData({...formData, vatNumber: e.target.value})} required/>
                    </InputGroup>
                    <InputGroup label="Referente Contratto" required>
                        <input type="text" placeholder="Mario Rossi" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none text-sm" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} required/>
                    </InputGroup>
                    <InputGroup label="Email Amministrazione" required>
                        <input type="email" placeholder="amministrazione@azienda.it" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none text-sm" value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})} required/>
                    </InputGroup>
                    <InputGroup label="Telefono Amministrazione" required>
                        <input type="tel" placeholder="+39 333 0000000" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none text-sm" value={formData.adminPhone} onChange={e => setFormData({...formData, adminPhone: e.target.value})} required/>
                    </InputGroup>
                </div>
            </div>
            
            {/* 2. CREDENZIALI (SOLO GUEST) */}
            {isGuest && (
                <div className="bg-indigo-900/10 border border-indigo-500/20 p-5 rounded-2xl">
                    <h4 className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Lock className="w-4 h-4"/> Credenziali Accesso</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputGroup label="Crea Password" required>
                            <input type="password" placeholder="Min. 6 caratteri" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none text-sm" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required/>
                        </InputGroup>
                        <InputGroup label="Conferma Password" required>
                            <input type="password" placeholder="Ripeti password" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none text-sm" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} required/>
                        </InputGroup>
                    </div>
                </div>
            )}

            {/* 3. DATI VETRINA */}
            <div>
                <SectionTitle title={activeType === 'shop' ? "Dati Bottega & Prodotti" : "Dati Pubblici (Vetrina)"} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <InputGroup label={activeType === 'guide' ? "Nome Pubblico" : activeType === 'tour_operator' ? "Nome Agenzia" : "Nome Insegna (Pubblico)"} required>
                        <input type="text" placeholder={activeType === 'guide' ? "Es. Guida Mario" : "Es. Ristorante Bella Napoli"} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none text-sm font-bold" value={formData.publicName} onChange={e => setFormData({...formData, publicName: e.target.value})} required/>
                    </InputGroup>

                    <InputGroup label="Comune" required>
                        <input 
                            type="text" 
                            placeholder="Es. Firenze" 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none text-sm" 
                            value={formData.cityId} 
                            onChange={e => setFormData({...formData, cityId: e.target.value})} 
                            required
                        />
                    </InputGroup>
                    
                    {activeType !== 'guide' && activeType !== 'tour_operator' ? (
                        <InputGroup label="Categoria Principale" required>
                            <select className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none text-sm appearance-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required>
                                <option value="">Seleziona...</option>
                                {activeType === 'shop' ? (<><option value="gusto">Gusto & Sapori</option><option value="artigianato">Artigianato</option><option value="moda">Moda & Sartoria</option><option value="cantina">Vini & Cantine</option></>) : (<><option value="food">Ristorazione & Food</option><option value="hotel">Hotel & Ospitalità</option><option value="shop">Shopping & Artigianato</option><option value="leisure">Svago & Divertimento</option><option value="nature">Natura & Escursioni</option></>)}
                            </select>
                        </InputGroup>
                    ) : (
                        <InputGroup label={activeType === 'tour_operator' ? "Numero Licenza Agenzia" : "Numero Patentino (Obbligatorio)"} required>
                            <input type="text" placeholder="GT-12345-NA" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none text-sm font-mono" value={formData.licenseNumber} onChange={e => setFormData({...formData, licenseNumber: e.target.value})} required/>
                        </InputGroup>
                    )}

                    {activeType !== 'guide' ? (
                        <>
                            <div className="md:col-span-2">
                                <InputGroup label="Indirizzo Completo" required>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500"/>
                                        <input type="text" placeholder="Via Roma 1, 80100 Napoli" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pl-10 text-white focus:border-indigo-500 outline-none text-sm" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required/>
                                    </div>
                                </InputGroup>
                            </div>
                            <div className="md:col-span-2">
                                <InputGroup label="Orari di Apertura" required>
                                    <OpeningHoursSelector value={formData.openingHours} onChange={val => setFormData({...formData, openingHours: val})} />
                                </InputGroup>
                            </div>
                            <InputGroup label="Sito Web / Social">
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-500"/>
                                    <input type="text" placeholder="www.miosito.it" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pl-10 text-white focus:border-indigo-500 outline-none text-sm" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
                                </div>
                            </InputGroup>
                            <InputGroup label="Telefono Pubblico">
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500"/>
                                    <input type="tel" placeholder="+39 ..." className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pl-10 text-white focus:border-indigo-500 outline-none text-sm" value={formData.publicPhone} onChange={e => setFormData({...formData, publicPhone: e.target.value})} />
                                </div>
                            </InputGroup>
                        </>
                    ) : (
                        <InputGroup label="Lingue Parlate" required>
                            <div className="relative">
                                <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-500"/>
                                <input type="text" placeholder="Es. Italiano, Inglese, Francese" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pl-10 text-white focus:border-indigo-500 outline-none text-sm" value={formData.languages} onChange={e => setFormData({...formData, languages: e.target.value})} required/>
                            </div>
                        </InputGroup>
                    )}
                </div>
                
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Descrizione Attività <span className="text-amber-500">*</span></label>
                        {handleMagicRewrite && (
                            <button type="button" onClick={onMagicClick} disabled={aiLoading} className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors disabled:opacity-50">
                                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>} Magic AI Rewrite
                            </button>
                        )}
                    </div>
                    <textarea required rows={5} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:border-indigo-500 outline-none resize-none leading-relaxed text-sm" placeholder="Descrivi la tua attività..."/>
                </div>
            </div>

            {/* 4. MEDIA */}
            <div>
                <SectionTitle title="Media & Foto" />
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Foto Copertina *</label>
                    <div onClick={() => fileInputRefCover.current?.click()} className={`border-2 border-dashed rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer transition-all group ${coverImage ? 'border-emerald-500 bg-emerald-900/10' : 'border-slate-700 hover:border-slate-500 bg-slate-900'}`}>
                        {coverImage ? (
                            <><Check className="w-8 h-8 text-emerald-500 mb-2"/><span className="text-xs text-emerald-400 font-bold truncate px-4">{coverImage.name}</span></>
                        ) : (
                            <><Upload className="w-8 h-8 text-slate-600 group-hover:text-slate-400 mb-2 transition-colors"/><span className="text-xs text-slate-500 group-hover:text-slate-300 font-bold">Clicca per caricare</span></>
                        )}
                        <input ref={fileInputRefCover} type="file" accept="image/*" className="hidden" onChange={(e) => {
                            if(e.target.files?.[0]) setCoverImage(e.target.files[0]);
                        }} />
                    </div>
                </div>
            </div>

            {/* 5. FOOTER & SEND */}
            <div className="pt-6 border-t border-slate-800 space-y-6">
                <div className="space-y-4">
                    <label className="flex items-start gap-4 cursor-pointer group p-3 rounded-xl hover:bg-slate-900 transition-colors">
                        <div className={`mt-0.5 w-6 h-6 shrink-0 rounded border flex items-center justify-center transition-all ${termsAccepted ? 'bg-emerald-600 border-emerald-500' : 'bg-slate-950 border-slate-600 group-hover:border-slate-500'}`}>
                            {termsAccepted && <Check className="w-4 h-4 text-white"/>}
                        </div>
                        <input type="checkbox" className="hidden" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}/>
                        <span className="text-sm text-slate-400 group-hover:text-slate-300">
                            Dichiaro che i dati inseriti sono veritieri e accetto i Termini e Condizioni per i Partner Commerciali.
                            {activeType === 'shop' && <span className="block mt-2 text-amber-500 font-bold bg-amber-900/20 p-2 rounded-lg border border-amber-500/30">Nota per i Partner Shopping: Il periodo di validità dell'abbonamento inizierà automaticamente al caricamento del primo prodotto e non potrà essere sospeso.</span>}
                        </span>
                    </label>
                    <label className="flex items-start gap-4 cursor-pointer group p-3 rounded-xl hover:bg-slate-900 transition-colors">
                        <div className={`mt-0.5 w-6 h-6 shrink-0 rounded border flex items-center justify-center transition-all ${privacyAccepted ? 'bg-emerald-600 border-emerald-500' : 'bg-slate-950 border-slate-600 group-hover:border-slate-500'}`}>
                            {privacyAccepted && <Check className="w-4 h-4 text-white"/>}
                        </div>
                        <input type="checkbox" className="hidden" checked={privacyAccepted} onChange={e => setPrivacyAccepted(e.target.checked)}/>
                        <span className="text-sm text-slate-400 group-hover:text-slate-300">Accetto la Privacy Policy e il trattamento dei dati ai fini fiscali e contrattuali.</span>
                    </label>
                </div>
                
                {errorMsg && <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2"><AlertCircle className="w-6 h-6 text-red-500 shrink-0"/><span className="text-sm font-bold text-red-200">{errorMsg}</span></div>}

                <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-indigo-900/20 transition-all transform active:scale-95 flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>} Invia Candidatura Partner
                </button>
            </div>
        </form>
    );
};
