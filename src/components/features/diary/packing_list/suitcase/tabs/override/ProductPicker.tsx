import React from 'react';
import { Search, ChevronRight, Plus } from 'lucide-react';
import { SuitcaseItem } from '@/types/suitcase';
import { SuggestionProduct } from '@/types/suitcase';
import { getRelevantProducts } from '../../EditorialCenterTabs';

interface ProductPickerProps {
  item: SuitcaseItem;
  products: SuggestionProduct[];
  currentProduct: SuggestionProduct | undefined;
  productSearch: string;
  setProductSearch: (s: string) => void;
  isOpen: boolean;
  onOpenToggle: () => void;
  onSelect: (productId: string | 'new' | undefined) => void;
}

export const ProductPicker: React.FC<ProductPickerProps> = ({
  item,
  products,
  currentProduct,
  productSearch,
  setProductSearch,
  isOpen,
  onOpenToggle,
  onSelect
}) => {
  const relevantProducts = getRelevantProducts(item, products);
  const displayPickerProducts = productSearch
    ? relevantProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : relevantProducts;

  return (
    <div className="relative flex-1">
      <button
        onClick={onOpenToggle}
        className="w-full bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-left flex items-center justify-between group hover:border-indigo-500/50 transition-all shadow-inner"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Search className="w-4 h-4 text-slate-600 shrink-0" />
          <span className="text-xs text-slate-300 truncate">
            {currentProduct ? currentProduct.name : `Seleziona prodotto...`}
          </span>
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-modal overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                autoFocus
                placeholder="Cerca prodotto..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 pl-9 pr-4 py-2 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-2 space-y-0.5">
            <button
              onClick={() => {
                onSelect(undefined);
                setProductSearch('');
              }}
              className="w-full p-2 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-dashed border-white/5 mb-1"
            >
              Fallback Automatico
            </button>

            {displayPickerProducts.length > 0 ? (
              displayPickerProducts.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelect(p.id);
                    setProductSearch('');
                  }}
                  className="w-full p-2 rounded-lg text-left text-xs text-slate-400 hover:text-white hover:bg-indigo-500/15 flex items-center gap-3 transition-all"
                >
                  <div className="w-8 h-8 rounded bg-white overflow-hidden shrink-0 shadow-sm p-0.5">
                    <img src={p.image_url} alt="" className="w-full h-full object-contain" />
                  </div>
                  <span className="truncate">{p.name}</span>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-600 italic">Nessun prodotto pertinente nel catalogo</div>
            )}

            <button
              onClick={() => {
                onSelect('new');
                setProductSearch('');
              }}
              className="w-full p-2 mt-2 text-left text-xs font-bold text-orange-400 hover:bg-orange-500/10 rounded-lg flex items-center gap-2 border border-orange-500/20"
            >
              <Plus className="w-3.5 h-3.5" /> Crea nuovo globale per "{item.name}"
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
