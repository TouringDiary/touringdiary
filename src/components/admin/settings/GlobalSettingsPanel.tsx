
import React, { useState, useEffect } from 'react';
import { Loader2, Save, AlertTriangle } from 'lucide-react';
import { useConfig } from '@/context/ConfigContext';
import { FieldRenderer } from './FieldRenderer';

interface Props {
    title: string;
    configKey: string;
    data: any;
    onSaveSuccess: () => void;
}

// Funzione helper per l'aggiornamento immutabile
const updateValueByPath = (obj: any, path: (string | number)[], value: any) => {
    const newObj = JSON.parse(JSON.stringify(obj)); // Clonazione semplice e sicura per dati JSON
    let current = newObj;
    for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    return newObj;
};

export const GlobalSettingsPanel: React.FC<Props> = ({ title, configKey, data, onSaveSuccess }) => {
    const [formData, setFormData] = useState<any>(data);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { updateSetting } = useConfig();

    useEffect(() => {
        if (data) {
            setFormData(data);
        }
    }, [data]);

    const handleUpdate = (path: (string | number)[], value: any) => {
        const newFormData = updateValueByPath(formData, path, value);
        setFormData(newFormData);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            await updateSetting(configKey, formData);
            onSaveSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Errore sconosciuto');
        } finally {
            setIsSaving(false);
        }
    };

    if (!formData) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Caricamento configurazione...
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">{title}</h3>
            
            <div className="space-y-6">
                {Object.entries(formData).map(([key, value]) => {
                    const path = [key];
                    return (
                        <FieldRenderer
                            key={path.join('.')}
                            fieldKey={key}
                            fieldValue={value}
                            path={path}
                            onUpdate={handleUpdate}
                        />
                    );
                })}
            </div>

            {error && (
                <div className="mt-6 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-sm text-red-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <div><strong>Errore:</strong> {error}</div>
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50">
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
            </div>
        </div>
    );
};
