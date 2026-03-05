
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Package, Plus, Sparkles, Loader2, Save, Heart, Star, TrendingUp, X, Eye, EyeOff, Truck, MapPin, CreditCard, Info, Image as ImageIcon, AlertCircle, Archive, LayoutGrid, Store, Award, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { ShopPartner, ShopProduct } from '../../types';
import { saveProduct, saveShop, calculateShopRank, getShopByVat, deleteShopProduct } from '../../services/shopService';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { DraggableSlider, DraggableSliderHandle } from '../common/DraggableSlider';
import { compressImage, dataURLtoFile } from '../../utils/common'; 
import { uploadPublicMedia } from '../../services/mediaService';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';

interface Props {
    shop: ShopPartner;
    onUpdate: () => void;
    onBack?: () => void; 
}

export const BusinessShopManager = ({ shop: initialShop, onUpdate, onBack }: Props) => {
    const [currentShop, setCurrentShop] = useState<ShopPartner>(initialShop);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isProductUploading, setIsProductUploading] = useState(false);
    
    // UI States
    const [isAdding, setIsAdding] = useState(false); // Used for both Add and Edit mode
    
    // Delete States
    const [deleteTarget, setDeleteTarget] = useState<ShopProduct | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const productsSliderRef = useRef<DraggableSliderHandle>(null);
    const fileInputRefProducts = useRef<HTMLInputElement>(null);

    const [newProduct, setNewProduct] = useState<Partial<ShopProduct>>({
        id: '', name: '', description: '', price: 0, imageUrl: '', status: 'visible', shippingMode: 'pickup'
    });

    // Sync local state when prop updates
    useEffect(() => {
        setCurrentShop(initialShop);
    }, [initialShop]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsProductUploading(true);
            try {
                // 1. Compressione
                const compressedBase64 = await compressImage(file);
                const compressedFile = dataURLtoFile(compressedBase64, file.name);

                // 2. Upload Diretto
                const publicUrl = await uploadPublicMedia(compressedFile, 'shop_products');
                
                if (publicUrl) {
                    setNewProduct(prev => ({ ...prev, imageUrl: publicUrl }));
                } else {
                    setErrorMsg("Errore durante l'upload. Riprova.");
                }
            } catch (err) {
                console.error(err);
                setErrorMsg("Errore elaborazione file.");
            } finally {
                setIsProductUploading(false);
            }
        }
    };

    const handleSaveProduct = async () => {
        setErrorMsg(null);
        if (!newProduct.name || !newProduct.description || (newProduct.price === undefined || newProduct.price <= 0)) {
            setErrorMsg("Attenzione: Nome, Descrizione e Prezzo (> 0) sono obbligatori.");
            return;
        }
        if (!newProduct.imageUrl) {
             setErrorMsg("Attenzione: La foto del prodotto è obbligatoria.");
             return;
        }
        
        // Se c'è un ID, stiamo modificando. Altrimenti ne creiamo uno nuovo.
        const productToSave: ShopProduct = {
            id: newProduct.id || `prod_${Date.now()}`,
            name: newProduct.name!,
            description: newProduct.description!,
            imageUrl: newProduct.imageUrl!,
            price: newProduct.price!,
            status: newProduct.status || 'visible',
            shippingMode: newProduct.shippingMode || 'pickup'
        };

        try {
            await saveProduct(currentShop.id, productToSave);
            setSuccessMsg(newProduct.id ? "Prodotto aggiornato!" : "Prodotto aggiunto alla vetrina!");
            setTimeout(() => setSuccessMsg(null), 3000);
            
            // Chiudi form e resetta
            setIsAdding(false);
            setNewProduct({ id: '', name: '', description: '', price: 0, imageUrl: '', status: 'visible', shippingMode: 'pickup' });
            
            onUpdate(); // Ricarica dati
        } catch (e) {
            setErrorMsg("Errore durante il salvataggio. Riprova.");
        }
    };

    const handleEditProduct = (product: ShopProduct) => {
        setNewProduct(product);
        setIsAdding(true);
        // Scroll to top to see form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await deleteShopProduct(deleteTarget.id);
            setDeleteTarget(null);
            onUpdate();
            setSuccessMsg("Prodotto eliminato.");
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (e) {
            setErrorMsg("Errore cancellazione prodotto.");
        } finally {
            setIsDeleting(false);
        }
    };

    const openNewForm = () => {
        setNewProduct({ id: '', name: '', description: '', price: 0, imageUrl: '', status: 'visible', shippingMode: 'pickup' });
        setIsAdding(true);
    };

    return (
        <div className="space-y-6 md:space-y-10 animate-in fade-in pb-32 relative">
            
            {/* DELETE MODAL */}
            <DeleteConfirmationModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Eliminare Prodotto?"
                message={`Stai per rimuovere "${deleteTarget?.name}" dalla tua vetrina.\nL'azione è irreversibile.`}
                isDeleting={isDeleting}
                icon={<Trash2 className="w-8 h-8 text-red-500"/>}
            />

             {/* SUCCESS TOAST */}
             {successMsg && (
                <div className="fixed top-4 right-4 z-[5000] bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-2 font-bold text-sm">
                    <Sparkles className="w-4 h-4"/> {successMsg}
                </div>
             )}

             {/* FORM AGGIUNTA / MODIFICA */}
             {isAdding && (
                <div className="mb-10 p-6 md:p-8 bg-slate-950 border border-indigo-500/30 rounded-3xl animate-in zoom-in-95 relative shadow-inner">
                    <button onClick={() => setIsAdding(false)} className="absolute top-4 right-4 text-slate-600 hover:text-white transition-colors"><X className="w-6 h-6"/></button>
                    <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Package className="w-5 h-5 text-indigo-500"/> {newProduct.id ? 'Modifica Articolo' : 'Aggiungi Articolo'}
                    </h4>
                    
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Foto *</label>
                                <div 
                                    onClick={() => !isProductUploading && fileInputRefProducts.current?.click()}
                                    className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:border-indigo-500 hover:bg-slate-800 group relative overflow-hidden ${newProduct.imageUrl ? 'border-emerald-500 bg-slate-900' : 'border-slate-700 bg-slate-900'} ${isProductUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isProductUploading ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin"/>
                                            <span className="text-[8px] font-bold text-slate-500 uppercase">Caricamento...</span>
                                        </div>
                                    ) : newProduct.imageUrl ? (
                                        <>
                                            <img src={newProduct.imageUrl} className="w-full h-full object-cover" alt="Preview"/>
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <ImageIcon className="w-6 h-6 text-white"/>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon className="w-6 h-6 text-slate-600 group-hover:text-indigo-400 mb-1"/>
                                            <span className="text-[8px] font-bold text-slate-500 uppercase">Carica</span>
                                        </>
                                    )}
                                    <input ref={fileInputRefProducts} type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isProductUploading} />
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none font-bold text-sm" placeholder="Nome Prodotto"/>
                                    <input type="number" step="0.50" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none font-mono text-sm font-bold" placeholder="Prezzo €"/>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                     <select 
                                        value={newProduct.status} 
                                        onChange={e => setNewProduct({...newProduct, status: e.target.value as any})}
                                        className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs font-bold uppercase outline-none focus:border-indigo-500"
                                     >
                                         <option value="visible">Pubblico</option>
                                         <option value="hidden">Nascosto</option>
                                     </select>
                                     <select 
                                        value={newProduct.shippingMode} 
                                        onChange={e => setNewProduct({...newProduct, shippingMode: e.target.value as any})}
                                        className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs font-bold uppercase outline-none focus:border-indigo-500"
                                     >
                                         <option value="pickup">Solo Ritiro</option>
                                         <option value="ship">Spedizione</option>
                                         <option value="both">Entrambi</option>
                                     </select>
                                </div>

                                <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-white resize-none focus:border-indigo-500 outline-none text-sm h-24" placeholder="Descrizione prodotto..."/>
                            </div>
                        </div>

                        {errorMsg && <div className="text-red-400 text-xs font-bold bg-red-900/20 p-3 rounded border border-red-500/30 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> {errorMsg}</div>}

                        <div className="pt-4 border-t border-slate-800/50">
                            <button onClick={handleSaveProduct} disabled={isProductUploading} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3.5 rounded-xl font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/30 transition-all flex items-center justify-center gap-3 active:scale-95 text-xs">
                                <Save className="w-5 h-5"/> {newProduct.id ? 'Salva Modifiche' : 'Pubblica in Vetrina'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-4 px-1">
                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-300">Prodotti in Vetrina</h4>
                <button onClick={openNewForm} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2"><Plus className="w-4 h-4"/> Nuovo</button>
            </div>
            
            {/* PRODUCT GRID */}
            {currentShop.products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {currentShop.products.map(product => (
                        <div key={product.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group flex flex-col shadow-lg hover:border-slate-600 transition-all relative">
                            
                            {/* ACTION BUTTONS (EDIT/DELETE) */}
                            <div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleEditProduct(product); }} 
                                    className="p-1.5 bg-slate-800 text-indigo-400 hover:text-white hover:bg-indigo-600 rounded-lg shadow-md border border-slate-700 transition-colors"
                                    title="Modifica"
                                >
                                    <Edit2 className="w-3.5 h-3.5"/>
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(product); }} 
                                    className="p-1.5 bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-slate-900 rounded-lg shadow-md border border-slate-700 transition-colors"
                                    title="Elimina"
                                >
                                    <Trash2 className="w-3.5 h-3.5"/>
                                </button>
                            </div>

                            {/* STATUS BADGE */}
                            <div className="absolute top-2 left-2 z-20">
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-sm border ${product.status === 'visible' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-slate-600'}`}>
                                    {product.status === 'visible' ? 'PUBBLICATO' : 'NASCOSTO'}
                                </span>
                            </div>

                            <div className="aspect-square relative overflow-hidden bg-black">
                                <ImageWithFallback src={product.imageUrl} alt={product.name} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${product.status === 'hidden' ? 'opacity-50 grayscale' : ''}`}/>
                            </div>
                            
                            <div className="p-4 flex-1 flex flex-col">
                                <h5 className="font-bold text-white text-sm mb-1 line-clamp-1">{product.name}</h5>
                                <div className="mt-auto flex justify-between items-center border-t border-slate-800 pt-2">
                                    <span className="text-xs text-slate-500 font-bold uppercase">{product.shippingMode === 'pickup' ? 'Ritiro' : 'Spedizione'}</span>
                                    <span className="text-lg font-mono font-black text-emerald-400">€{product.price}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-900/20 rounded-2xl border-2 border-dashed border-slate-800/50 p-12 flex flex-col items-center justify-center text-center">
                    <Package className="w-12 h-12 text-slate-700 mb-4"/>
                    <h5 className="text-slate-500 font-bold uppercase text-sm mb-2">Vetrina Vuota</h5>
                    <p className="text-slate-600 text-xs mb-6">Inizia ad aggiungere i tuoi prodotti per venderli.</p>
                    <button onClick={openNewForm} className="text-indigo-500 font-bold text-xs uppercase hover:text-indigo-400 underline">Crea Primo Prodotto</button>
                </div>
            )}
        </div>
    );
};
