
import React from 'react';
import { Upload, Crop, Layers } from 'lucide-react';
import { ImageWithFallback } from '../../common/ImageWithFallback';

interface PlaceholderGridProps {
    placeholders: Record<string, string>;
    onUploadClick: (catId: string) => void;
    onEditClick: (url: string, catId: string) => void;
}

const PLACEHOLDER_CATS = [
    { id: 'monument', label: 'Monumenti' },
    { id: 'food', label: 'Cibo & Ristoranti' },
    { id: 'hotel', label: 'Hotel & Alloggi' },
    { id: 'nature', label: 'Natura' },
    { id: 'leisure', label: 'Svago' },
    { id: 'guide', label: 'Guide Turistiche' },
    { id: 'tour_operator', label: 'Tour Operator' },
    { id: 'shop', label: 'Shopping Generico' },
    { id: 'shop_gusto', label: 'Shop: Gusto' },
    { id: 'shop_cantina', label: 'Shop: Cantina' },
    { id: 'shop_artigianato', label: 'Shop: Artigianato' },
    { id: 'shop_moda', label: 'Shop: Moda' },
];

export const PlaceholderGrid = ({ placeholders, onUploadClick, onEditClick }: PlaceholderGridProps) => {
    return (
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-col gap-4 flex-1 shadow-lg h-full min-h-0">
             <div className="flex items-center gap-3 mb-2 shrink-0">
                <div className="p-2 bg-blue-900/20 rounded-lg text-blue-500"><Layers className="w-6 h-6"/></div>
                <div>
                    <h3 className="text-lg font-bold text-white">Placeholder di Categoria</h3>
                    <p className="text-xs text-slate-400">Usati automaticamente se manca la foto del POI</p>
                </div>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar pr-2 flex-1">
                {/* GRIGLIA ESPANSA: 2 colonne su Mobile, 3 su Tablet, 4 su Desktop XL */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                    {PLACEHOLDER_CATS.map(cat => (
                        <div key={cat.id} className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-700 group bg-black/20 shrink-0">
                            <ImageWithFallback src={placeholders[cat.id]} alt={cat.label} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all"/>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                            <div className="absolute bottom-2 left-2 right-2">
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider block truncate">{cat.label}</span>
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                <button onClick={() => onUploadClick(cat.id)} className="p-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 shadow-lg transition-transform hover:scale-110" title="Carica"><Upload className="w-4 h-4"/></button>
                                {placeholders[cat.id] && <button onClick={() => onEditClick(placeholders[cat.id], cat.id)} className="p-2 bg-slate-700 rounded-lg text-white hover:bg-slate-600 shadow-lg transition-transform hover:scale-110" title="Modifica"><Crop className="w-4 h-4"/></button>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
