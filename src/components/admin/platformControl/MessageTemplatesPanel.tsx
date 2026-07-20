import React from 'react';
import { PLATFORM_GLOBAL_MESSAGE_CATALOG } from '@/constants/platformFeatureFlags';
import { usePlatformControlTypography } from '@/hooks/usePlatformControlTypography';
import { MessageTemplateEditor } from './MessageTemplateEditor';

interface MessageTemplatesPanelProps {
    canWrite: boolean;
}

/** Contenuto Info Globali — banner TAB gestito dal Centro di Controllo. */
export const MessageTemplatesPanel: React.FC<MessageTemplatesPanelProps> = ({ canWrite }) => {
    const ty = usePlatformControlTypography();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {PLATFORM_GLOBAL_MESSAGE_CATALOG.map((entry) => (
                <article
                    key={entry.key}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 sm:p-4 space-y-2"
                >
                    <div>
                        <h3 className={ty.cardTitle}>{entry.label}</h3>
                        <p className={`${ty.cardDescription} mt-0.5`}>{entry.description}</p>
                        <p className={`${ty.monoKey} mt-1 truncate`}>{entry.key}</p>
                    </div>
                    <MessageTemplateEditor catalogEntry={entry} canWrite={canWrite} />
                </article>
            ))}
        </div>
    );
};
