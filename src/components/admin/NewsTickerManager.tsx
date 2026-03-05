import React, { useState, useEffect, useRef } from 'react';
import { Newspaper, Plus, Trash2, Globe, MapPin, Sun, Camera, Users, AlertTriangle, Info, Calendar, Gift, Clock, Car, Megaphone, Save, Loader2, CheckCircle, X, ArrowUp, ArrowDown, Edit2 } from 'lucide-react';
import { getNewsTickerItemsAsync, saveNewsTickerItemAsync, deleteNewsTickerItemAsync } from '../../services/contentService';
import { getSetting, saveSetting } from '../../services/settingsService';
import { NewsTickerItem } from '../../types/index';
import { NewsTicker } from '../layout/NewsTicker';
import { useAdminStyles } from '../../hooks/useAdminStyles';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';

const ICONS = [
    { id: 'globe', icon: Globe, label: 'Mondo' }, { id: 'map', icon: MapPin, label: 'Locale' }, { id: 'sun', icon: Sun, label: 'Meteo' },
    { id: 'camera', icon: Camera, label: 'Foto' }, { id: 'users', icon: Users, label: 'Community' }, { id: 'alert', icon: AlertTriangle, label: 'Allerta' },
    { id: 'info', icon: Info, label: 'Info' }, { id: 'calendar', icon: Calendar, label: 'Eventi' }, { id: 'gift', icon: Gift, label: 'Promo' },
    { id: 'clock', icon: Clock, label: 'Tempo' }, { id: 'car', icon: Car, label: 'Traffico' }, { id: 'megaphone', icon: Megaphone, label: 'Avviso' },
];

const RichTextInput = ({ value, onChange, placeholder, onEnter }: { value: string, onChange: (val: string) => void, placeholder?: string, onEnter?: () => void }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (onEnter) onEnter();
        }
    };

    const applyFormat = (e: React.MouseEvent, command: string, val?: string) => {
        e.preventDefault(); // Prevent losing focus
        document.execCommand(command, false, val);
        handleInput();
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-1 items-center bg-slate-950 border border-slate-800 p-1 rounded-lg w-fit">
                <button type="button" onMouseDown={(e) => applyFormat(e, 'bold')} className="px-2 py-1 hover:bg-slate-800 text-slate-300 rounded text-xs font-bold transition-colors">B</button>
                <button type="button" onMouseDown={(e) => applyFormat(e, 'italic')} className="px-2 py-1 hover:bg-slate-800 text-slate-300 rounded text-xs italic transition-colors">I</button>
                <div className="w-px h-4 bg-slate-700 mx-1"></div>
                <button type="button" onMouseDown={(e) => applyFormat(e, 'foreColor', '#f59e0b')} className="w-4 h-4 rounded-full bg-amber-500 hover:scale-110 transition-transform mx-0.5 shadow-sm" title="Arancione"></button>
                <button type="button" onMouseDown={(e) => applyFormat(e, 'foreColor', '#10b981')} className="w-4 h-4 rounded-full bg-emerald-500 hover:scale-110 transition-transform mx-0.5 shadow-sm" title="Verde"></button>
                <button type="button" onMouseDown={(e) => applyFormat(e, 'foreColor', '#3b82f6')} className="w-4 h-4 rounded-full bg-blue-500 hover:scale-110 transition-transform mx-0.5 shadow-sm" title="Blu"></button>
                <button type="button" onMouseDown={(e) => applyFormat(e, 'foreColor', '#f43f5e')} className="w-4 h-4 rounded-full bg-rose-500 hover:scale-110 transition-transform mx-0.5 shadow-sm" title="Rosso"></button>
                <button type="button" onMouseDown={(e) => applyFormat(e, 'foreColor', '#ffffff')} className="w-4 h-4 rounded-full bg-white border border-slate-600 hover:scale-110 transition-transform mx-0.5 shadow-sm" title="Bianco"></button>
                <div className="w-px h-4 bg-slate-700 mx-1"></div>
                <button type="button" onMouseDown={(e) => applyFormat(e, 'removeFormat')} className="px-2 py-1 hover:bg-slate-800 text-slate-400 rounded text-[10px] uppercase font-bold transition-colors" title="Rimuovi formattazione">Clear</button>
            </div>
            <div 
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onBlur={handleInput}
                onKeyDown={handleKeyDown}
                className="w-full min-h-[42px] bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-500"
                data-placeholder={placeholder}
            />
        </div>
    );
};

export const NewsTickerManager = () => {
    const { styles } = useAdminStyles();
    const [items, setItems] = useState<NewsTickerItem[]>([]);
    const [speed, setSpeed] = useState(80);
    const [isLoading, setIsLoading] = useState(true);
    
    // New Item State
    const [newItemText, setNewItemText] = useState('');
    const [newItemIcon, setNewItemIcon] = useState('globe');
    const [isSaving, setIsSaving] = useState(false);
    const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
    
    // Edit State
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editItemText, setEditItemText] = useState('');
    const [editItemIcon, setEditItemIcon] = useState('globe');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [loadedItems, config] = await Promise.all([
            getNewsTickerItemsAsync(),
            getSetting<{ duration: number }>('ticker_config')
        ]);
        
        // Sort by order
        const sorted = (loadedItems || []).sort((a,b) => (a.order || 0) - (b.order || 0));
        setItems(sorted);
        
        if (config && config.duration) setSpeed(config.duration);
        setIsLoading(false);
    };

    const handleAddItem = async () => {
        if (!newItemText.trim()) return;
        setIsSaving(true);
        
        const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order || 0)) : 0;
        
        const newItem: NewsTickerItem = {
            id: `news_${Date.now()}`,
            text: newItemText,
            icon: newItemIcon as any,
            active: true,
            order: maxOrder + 1
        };
        
        await saveNewsTickerItemAsync(newItem);
        setNewItemText('');
        await loadData();
        setIsSaving(false);
    };

    const handleDeleteItem = (id: string) => {
        setDeletingItemId(id);
    };

    const executeDeleteItem = async () => {
        if (!deletingItemId) return;
        setIsSaving(true);
        await deleteNewsTickerItemAsync(deletingItemId);
        await loadData();
        setIsSaving(false);
        setDeletingItemId(null);
    };

    const handleToggleActive = async (item: NewsTickerItem) => {
        setIsSaving(true);
        await saveNewsTickerItemAsync({ ...item, active: !item.active });
        await loadData();
        setIsSaving(false);
    };

    const handleEditItem = (item: NewsTickerItem) => {
        setEditingItemId(item.id);
        setEditItemText(item.text);
        setEditItemIcon(item.icon);
    };

    const handleSaveEdit = async () => {
        if (!editingItemId || !editItemText.trim()) return;
        setIsSaving(true);
        
        const itemToUpdate = items.find(i => i.id === editingItemId);
        if (itemToUpdate) {
            await saveNewsTickerItemAsync({
                ...itemToUpdate,
                text: editItemText,
                icon: editItemIcon as any
            });
            await loadData();
        }
        
        setEditingItemId(null);
        setEditItemText('');
        setEditItemIcon('globe');
        setIsSaving(false);
    };

    const handleCancelEdit = () => {
        setEditingItemId(null);
        setEditItemText('');
        setEditItemIcon('globe');
    };

    const handleSaveSpeed = async () => {
        setIsSaving(true);
        await saveSetting('ticker_config', { duration: speed });
        setIsSaving(false);
        alert("Velocità aggiornata");
    };
    
    const handleReorder = async (id: string, direction: 'up' | 'down') => {
        const index = items.findIndex(i => i.id === id);
        if (index === -1) return;
        
        const newItems = [...items];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (swapIndex < 0 || swapIndex >= newItems.length) return;
        
        const temp = newItems[index];
        newItems[index] = newItems[swapIndex];
        newItems[swapIndex] = temp;
        
        // Update order indices locally and save all
        const updated = newItems.map((item, idx) => ({ ...item, order: idx + 1 }));
        setItems(updated);
        
        setIsSaving(true);
        await Promise.all(updated.map(item => saveNewsTickerItemAsync(item)));
        setIsSaving(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in h-full flex flex-col">
            <DeleteConfirmationModal 
                isOpen={!!deletingItemId}
                onClose={() => setDeletingItemId(null)}
                onConfirm={executeDeleteItem}
                title="Elimina Notizia"
                message="Eliminare questa notizia?"
                confirmLabel="Elimina"
                variant="danger"
            />
            <div className="flex justify-between items-center mb-2 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 rounded-xl shadow-lg">
                        <Newspaper className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className={styles.admin_page_title}>News Ticker</h2>
                        <p className={styles.admin_page_subtitle}>Gestione notizie scorrevoli in alto</p>
                    </div>
                </div>
            </div>

            {/* LIVE PREVIEW */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shrink-0">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Anteprima Live</h4>
                <div className="border border-slate-700 rounded-lg overflow-hidden">
                    <NewsTicker overrideSpeed={speed} overrideItems={items} isVisible={true} />
                </div>
            </div>

            {/* SPEED CONFIG */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 shrink-0">
                <label className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Velocità Scorrimento (sec)</label>
                <input 
                    type="range" 
                    min="20" 
                    max="200" 
                    step="10" 
                    value={speed} 
                    onChange={e => setSpeed(Number(e.target.value))} 
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-white font-mono font-bold w-12 text-center">{speed}s</span>
                <button onClick={handleSaveSpeed} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors">
                    Salva
                </button>
            </div>

            {/* ADD FORM */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shrink-0">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Testo Notizia</label>
                        <RichTextInput 
                            value={newItemText} 
                            onChange={setNewItemText} 
                            placeholder="Es. Nuovi orari per i traghetti..." 
                            onEnter={handleAddItem}
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Icona</label>
                        <select 
                            value={newItemIcon} 
                            onChange={e => setNewItemIcon(e.target.value)} 
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                        >
                            {ICONS.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button 
                            onClick={handleAddItem} 
                            disabled={!newItemText || isSaving}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-bold text-xs uppercase flex items-center gap-2 shadow-lg transition-transform active:scale-95 disabled:opacity-50 h-[42px]"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>} Aggiungi
                        </button>
                    </div>
                </div>
            </div>

            {/* LIST */}
            <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {items.map((item, idx) => {
                        const Icon = ICONS.find(i => i.id === item.icon)?.icon || Globe;
                        
                        if (editingItemId === item.id) {
                            return (
                                <div key={item.id} className="flex flex-col md:flex-row gap-4 p-3 rounded-lg border bg-indigo-900/20 border-indigo-500/50">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-indigo-400 uppercase block mb-1">Modifica Testo</label>
                                        <RichTextInput 
                                            value={editItemText} 
                                            onChange={setEditItemText} 
                                            onEnter={handleSaveEdit}
                                        />
                                    </div>
                                    <div className="w-full md:w-48">
                                        <label className="text-[10px] font-bold text-indigo-400 uppercase block mb-1">Icona</label>
                                        <select 
                                            value={editItemIcon} 
                                            onChange={e => setEditItemIcon(e.target.value)} 
                                            className="w-full bg-slate-950 border border-indigo-500/50 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none h-[42px] mt-8"
                                        >
                                            {ICONS.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <button 
                                            onClick={handleSaveEdit} 
                                            disabled={!editItemText || isSaving}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-bold text-xs uppercase flex items-center gap-2 shadow-lg transition-transform active:scale-95 disabled:opacity-50 h-[42px]"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Salva
                                        </button>
                                        <button 
                                            onClick={handleCancelEdit} 
                                            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg font-bold text-xs uppercase flex items-center gap-2 transition-transform active:scale-95 h-[42px]"
                                        >
                                            <X className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={item.id} className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${item.active ? 'bg-slate-950 border-slate-800' : 'bg-slate-900/50 border-slate-800/50 opacity-60'}`}>
                                <div className="flex flex-col gap-1">
                                    <button onClick={() => handleReorder(item.id, 'up')} disabled={idx === 0} className="text-slate-500 hover:text-white disabled:opacity-30"><ArrowUp className="w-3 h-3"/></button>
                                    <button onClick={() => handleReorder(item.id, 'down')} disabled={idx === items.length - 1} className="text-slate-500 hover:text-white disabled:opacity-30"><ArrowDown className="w-3 h-3"/></button>
                                </div>
                                <div className={`p-2 rounded-lg ${item.active ? 'bg-indigo-900/30 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                                    <Icon className="w-5 h-5"/>
                                </div>
                                <div className="flex-1 font-medium text-slate-300 text-sm" dangerouslySetInnerHTML={{ __html: item.text }} />
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleToggleActive(item)} 
                                        className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase border transition-colors ${item.active ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/40' : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-white'}`}
                                    >
                                        {item.active ? 'Attivo' : 'Nascosto'}
                                    </button>
                                    <button onClick={() => handleEditItem(item)} className="p-2 bg-slate-800 hover:bg-indigo-900/30 text-slate-500 hover:text-indigo-400 rounded-lg transition-colors">
                                        <Edit2 className="w-4 h-4"/>
                                    </button>
                                    <button onClick={() => handleDeleteItem(item.id)} className="p-2 bg-slate-800 hover:bg-red-900/30 text-slate-500 hover:text-red-400 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {items.length === 0 && <div className="text-center py-10 text-slate-500 italic">Nessuna notizia nel ticker.</div>}
                </div>
            </div>
        </div>
    );
};