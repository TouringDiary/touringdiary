import React, { useState } from 'react';
import { Edit, Save, X } from 'lucide-react';
import { StyleRule } from '../../../types/designSystem';

// Estendiamo localmente il tipo per essere più precisi sul contratto del componente
// Questo riflette la realtà dei dati che il componente si aspetta di ricevere.
type DesignRule = StyleRule & {
    component_key: string; // La chiave è richiesta per salvare
    desktop_classes?: string;
    mobile_classes?: string;
};

interface DesignRuleEditorProps {
    rule: DesignRule;
    onUpdate: (key: string, newClasses: { desktop: string; mobile: string }) => void;
}

export const DesignRuleEditor: React.FC<DesignRuleEditorProps> = ({ rule, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    
    // FIX: Inizializzazione corretta dalle proprietà distinte
    const [desktopClasses, setDesktopClasses] = useState(rule.desktop_classes || rule.css_class || ''); 
    const [mobileClasses, setMobileClasses] = useState(rule.mobile_classes || rule.css_class || '');

    const handleSave = () => {
        // Guard clause per sicurezza, anche se il tipo ora lo richiede
        if (!rule.component_key) return; 
        onUpdate(rule.component_key, { desktop: desktopClasses, mobile: mobileClasses });
        setIsEditing(false);
    };

    // --- Valori di default per retrocompatibilità ---
    const previewType = rule.preview_type || 'text';
    const previewSize = rule.preview_size || 'small';
    const previewContent = rule.preview_content || '';

    const previewHeightClass = previewSize === 'large' ? 'h-48' : 'h-10';

    const renderPreviewContent = (classes: string) => {
        const sharedWrapperClasses = "w-full flex items-center justify-center";
        
        if (previewType === 'html') {
            // Applica il wrapper .prose per le preview di tipografia
            if (rule.section === 'typography') {
                return (
                    <div className={`prose prose-invert max-w-none ${classes} break-words`}
                         dangerouslySetInnerHTML={{ __html: previewContent || '<h1>Titolo</h1><p>Paragrafo</p>' }}
                    />
                )
            }
            return (
                <div 
                    className={`${classes} ${sharedWrapperClasses}`}
                    dangerouslySetInnerHTML={{ __html: previewContent }}
                />
            );
        }

        // Preview di testo (default)
        return (
            <span className={`${classes} w-full truncate text-center break-words`}>
                {rule.preview_text || 'Sample'}
            </span>
        );
    };

    return (
        <div className="border-b border-slate-800 last:border-b-0">
            <div className="grid grid-cols-6 gap-4 items-center p-4">
                <div className="col-span-2">
                    <p className="font-medium text-white">{rule.component_key.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400">{rule.section}</p>
                </div>
                <div className="text-sm text-slate-400 truncate">{rule.component_key}</div>
                
                {/* Preview Desktop con overflow fix */}
                <div className={`w-24 md:w-32 ${previewHeightClass} flex items-center justify-center bg-slate-800 rounded-md overflow-hidden`}>
                   {renderPreviewContent(desktopClasses)} 
                </div>

                {/* Preview Mobile con overflow fix */}
                <div className={`w-24 md:w-32 ${previewHeightClass} flex items-center justify-center bg-slate-800 rounded-md overflow-hidden`}>
                    {renderPreviewContent(mobileClasses)}
                </div>
                
                <div>
                    <button onClick={() => setIsEditing(!isEditing)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md">
                        {isEditing ? <X size={16} /> : <Edit size={16} />}
                    </button>
                </div>
            </div>

            {/* --- FIX 4: Pannello Editor con stile corretto --- */}
            {isEditing && (
                <div className="bg-slate-900 border-t border-slate-800 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-bold text-slate-200 mb-3">Editor Classi CSS</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Desktop Classes</label>
                                    <input
                                        type="text"
                                        value={desktopClasses}
                                        onChange={(e) => setDesktopClasses(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-slate-200 placeholder-slate-500 focus:ring-amber-500 focus:border-amber-500"
                                        placeholder="e.g., text-lg font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Mobile Classes</label>
                                    <input
                                        type="text"
                                        value={mobileClasses}
                                        onChange={(e) => setMobileClasses(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-slate-200 placeholder-slate-500 focus:ring-amber-500 focus:border-amber-500"
                                        placeholder="e.g., text-base font-semibold"
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-200 mb-3">Live Preview (Desktop)</h4>
                            <div className={`p-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center ${previewHeightClass} transition-all overflow-hidden`}>
                                {renderPreviewContent(desktopClasses)}
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600">Annulla</button>
                        <button onClick={handleSave} disabled={!rule.component_key} className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-500 flex items-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed">
                            <Save size={16} /> Salva Modifiche
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};