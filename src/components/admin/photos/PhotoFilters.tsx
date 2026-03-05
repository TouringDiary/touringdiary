
import React from 'react';
import { Camera, Upload, Loader2, ArrowUpDown } from 'lucide-react';

interface PhotoFiltersProps {
    filterStatus: 'pending' | 'approved' | 'rejected' | 'city_deleted';
    setFilterStatus: (status: 'pending' | 'approved' | 'rejected' | 'city_deleted') => void;
    filterCity: string;
    setFilterCity: (city: string) => void;
    cityOptions: { id: string, name: string }[];
    sortDir: 'asc' | 'desc';
    setSortDir: (dir: 'asc' | 'desc') => void;
    
    // Upload Props
    onUploadClick: () => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    isUploading: boolean;
    uploadStep: string;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PhotoFilters = ({
    filterStatus, setFilterStatus,
    filterCity, setFilterCity,
    cityOptions,
    sortDir, setSortDir,
    onUploadClick, fileInputRef, isUploading, uploadStep, onFileChange
}: PhotoFiltersProps) => {

    return (
        <div className="flex flex-col md:flex-row gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800 shrink-0 shadow-lg">
            <div className="flex gap-2 items-center">
                 <button onClick={onUploadClick} disabled={isUploading} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold uppercase transition-all shadow-lg shadow-indigo-900/30 shrink-0 disabled:opacity-50">
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Upload className="w-3.5 h-3.5"/>}
                    {isUploading ? uploadStep : 'CARICA'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                
                <div className="h-6 w-px bg-slate-700 mx-2"></div>

                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'pending', label: 'DA RIVEDERE', color: 'text-amber-500' },
                        { id: 'approved', label: 'OK', color: 'text-emerald-500' },
                        { id: 'rejected', label: 'KO', color: 'text-red-500' },
                        { id: 'city_deleted', label: 'CITTÀ CANCELLATA', color: 'text-slate-400' }
                    ].map((s) => (
                        <button key={s.id} onClick={() => setFilterStatus(s.id as any)} className={`px-4 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === s.id ? 'bg-slate-800 text-white shadow-xl ring-1 ring-white/10' : 'text-slate-500 hover:text-slate-300'}`}>
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-2 items-center flex-1 justify-end">
                 <select value={filterCity} onChange={e => setFilterCity(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none w-full md:w-48">
                    <option value="">Tutte le Città</option>
                    {cityOptions.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>

                <button onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} className="flex items-center gap-1 bg-slate-950 px-3 py-2 rounded-lg border border-slate-700 text-[10px] font-bold text-white hover:bg-slate-800 transition-colors whitespace-nowrap">
                    <ArrowUpDown className="w-3 h-3 text-slate-400"/> {sortDir === 'desc' ? 'Recenti' : 'Vecchi'}
                </button>
            </div>
        </div>
    );
};
