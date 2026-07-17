import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import type { PlatformMessageTemplateCatalogEntry } from '@/constants/platformFeatureFlags';
import {
    getSystemMessagesAsync,
    type SystemMessageTemplate,
} from '@/services/communicationService';
import {
    resolveTemplateForCatalog,
    saveAuditedSystemMessage,
} from '@/services/platformControl/messageTemplateService';
import { usePlatformControlTypography } from '@/hooks/usePlatformControlTypography';

interface MessageTemplateEditorProps {
    catalogEntry: PlatformMessageTemplateCatalogEntry;
    canWrite: boolean;
    compact?: boolean;
}

const SAVED_FEEDBACK_MS = 2500;

export const MessageTemplateEditor: React.FC<MessageTemplateEditorProps> = ({
    catalogEntry,
    canWrite,
    compact = false,
}) => {
    const ty = usePlatformControlTypography();
    const [title, setTitle] = useState(catalogEntry.defaultTitle);
    const [body, setBody] = useState(catalogEntry.defaultBody);
    const [baselineTitle, setBaselineTitle] = useState(catalogEntry.defaultTitle);
    const [baselineBody, setBaselineBody] = useState(catalogEntry.defaultBody);
    const [previous, setPrevious] = useState<SystemMessageTemplate | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isDirty = title !== baselineTitle || body !== baselineBody;

    useEffect(() => {
        return () => {
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            try {
                const rows = await getSystemMessagesAsync();
                if (cancelled) return;
                const found = rows.find((r) => r.key === catalogEntry.key) ?? null;
                setPrevious(found);
                const resolved = resolveTemplateForCatalog(catalogEntry, found ?? undefined);
                const nextTitle = resolved.titleTemplate ?? '';
                const nextBody = resolved.bodyTemplate;
                setTitle(nextTitle);
                setBody(nextBody);
                setBaselineTitle(nextTitle);
                setBaselineBody(nextBody);
                setSaved(false);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, [catalogEntry.key]);

    const markDirty = () => {
        setSaved(false);
        setError(null);
        if (savedTimerRef.current) {
            clearTimeout(savedTimerRef.current);
            savedTimerRef.current = null;
        }
    };

    const handleSave = async () => {
        if (!canWrite || isSaving || !isDirty) return;
        if (!body.trim()) {
            setError('Il corpo del messaggio è obbligatorio.');
            return;
        }
        setIsSaving(true);
        setError(null);
        setSaved(false);

        const next = resolveTemplateForCatalog(catalogEntry, previous ?? undefined);
        next.titleTemplate = title.trim() || undefined;
        next.bodyTemplate = body.trim();
        next.label = catalogEntry.label;

        const ok = await saveAuditedSystemMessage(next, previous);
        setIsSaving(false);
        if (!ok) {
            setError('Salvataggio messaggio fallito.');
            return;
        }
        const savedTitle = next.titleTemplate ?? '';
        const savedBody = next.bodyTemplate;
        setPrevious(next);
        setTitle(savedTitle);
        setBody(savedBody);
        setBaselineTitle(savedTitle);
        setBaselineBody(savedBody);
        setSaved(true);
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => {
            setSaved(false);
            savedTimerRef.current = null;
        }, SAVED_FEEDBACK_MS);
    };

    if (isLoading) {
        return (
            <div className={`flex items-center gap-2 py-1 ${ty.helper}`}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Caricamento messaggio…
            </div>
        );
    }

    return (
        <div className={compact ? 'space-y-2 border-t border-slate-800 pt-2.5 mt-1' : 'space-y-2'}>
            {compact ? (
                <p className={ty.fieldLabel}>Messaggio utente</p>
            ) : null}
            <input
                type="text"
                value={title}
                disabled={!canWrite || isSaving}
                onChange={(e) => {
                    markDirty();
                    setTitle(e.target.value);
                }}
                placeholder="Titolo"
                aria-label={`Titolo messaggio ${catalogEntry.label}`}
                className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 disabled:opacity-50 ${ty.input}`}
            />
            <textarea
                value={body}
                disabled={!canWrite || isSaving}
                onChange={(e) => {
                    markDirty();
                    setBody(e.target.value);
                }}
                rows={compact ? 2 : 3}
                placeholder="Corpo messaggio"
                aria-label={`Corpo messaggio ${catalogEntry.label}`}
                className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 disabled:opacity-50 resize-y min-h-[3.5rem] ${ty.input}`}
            />
            {canWrite ? (
                <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={isSaving || !isDirty}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 disabled:opacity-50 ${ty.btnPrimary}`}
                >
                    {isSaving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Save className="w-3.5 h-3.5" />
                    )}
                    Salva messaggio
                </button>
            ) : null}
            {saved ? <p className={ty.success}>Messaggio salvato</p> : null}
            {error ? <p className={ty.error}>{error}</p> : null}
        </div>
    );
};
