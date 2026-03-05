
import React from 'react';
import { Eye } from 'lucide-react';
import { AiFieldHelper } from '../AiFieldHelper';

interface FormFieldProps {
    label: string;
    description: string;
    /* fix: make children optional to resolve TS detection issues in call sites where it's passed via JSX */
    children?: React.ReactNode;
    aiContext?: string;
    onAiApply?: (value: any) => void;
    aiMode?: 'text' | 'number' | 'list';
    currentValue?: any;
    fieldId?: string;
    onPreview?: () => void;
}

export const FormField = ({ 
    label, description, children, aiContext, onAiApply, aiMode = 'text', 
    currentValue, fieldId, onPreview 
}: FormFieldProps) => (
    <div className="mb-8 p-4 md:p-6 bg-slate-950/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors group relative shadow-inner">
        <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-2">
            <div className="flex flex-col">
                <label className="text-lg font-bold text-slate-200 uppercase tracking-wide block mb-2">{label}</label>
                <p className="text-sm text-slate-400 leading-relaxed max-w-3xl mb-2">{description}</p>
            </div>
            {onPreview && (
                <button 
                    onClick={(e) => { e.preventDefault(); onPreview(); }}
                    className="p-2 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700 flex items-center gap-2 text-xs font-bold uppercase shadow-lg self-end md:self-start"
                >
                    <Eye className="w-4 h-4"/> Anteprima
                </button>
            )}
        </div>
        <div className="space-y-4">
            {children}
            {aiContext && onAiApply && (
                <div className="mt-2">
                    <AiFieldHelper 
                        contextLabel={aiContext} 
                        onApply={onAiApply} 
                        mode={aiMode} 
                        currentValue={currentValue} 
                        fieldId={fieldId}
                    />
                </div>
            )}
        </div>
    </div>
);
