import React from 'react';
import { Type } from 'lucide-react';
import { PLATFORM_GLOBAL_MESSAGE_CATALOG } from '@/constants/platformFeatureFlags';
import { AdminSectionCard } from '@/components/admin/common/AdminSectionCard';
import { usePlatformControlTypography } from '@/hooks/usePlatformControlTypography';
import { MessageTemplateEditor } from './MessageTemplateEditor';

interface MessageTemplatesPanelProps {
    canWrite: boolean;
}

/** Informazioni globali piattaforma (non legate a una card Feature Flag). */
export const MessageTemplatesPanel: React.FC<MessageTemplatesPanelProps> = ({ canWrite }) => {
    const ty = usePlatformControlTypography();

    return (
        <AdminSectionCard
            icon={Type}
            title="Info Globali"
            subtitle="Informazioni globali modificabili non collegate a un singolo interruttore (disclosure CRM, registrazione). I messaggi di disabilitazione delle funzioni si editano nella card del Feature Flag."
        >
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
        </AdminSectionCard>
    );
};
