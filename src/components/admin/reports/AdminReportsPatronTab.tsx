import { useState } from 'react';
import { AdminPatronSaintManager } from '@/components/admin/AdminPatronSaintManager';
import { ReportsListPanel } from './ReportsListPanel';
import { ReportsMicroTabBar } from './ReportsMicroTabBar';

const PATRON_MICRO_TABS = [
  { id: 'entity_abuse', label: 'Abuso personaggio' },
  { id: 'image_abuse', label: 'Abuso foto' },
  { id: 'photo_suggestion', label: 'Suggerimento foto' },
  { id: 'person_suggestion', label: 'Suggerimento personaggio' },
] as const;

type PatronMicroTabId = (typeof PATRON_MICRO_TABS)[number]['id'];

export const AdminReportsPatronTab = () => {
  const [microTab, setMicroTab] = useState<PatronMicroTabId>('entity_abuse');

  return (
    <div className="space-y-4">
      <ReportsMicroTabBar
        tabs={PATRON_MICRO_TABS}
        activeId={microTab}
        onChange={(id) => setMicroTab(id as PatronMicroTabId)}
        ariaLabel="Micro-sezioni Santo Patrono"
      />

      <div id={`reports-micro-panel-${microTab}`} role="tabpanel">
        {microTab === 'entity_abuse' ? (
          <ReportsListPanel
            entityTypes={['patron']}
            reportKinds={['entity_abuse']}
            emptyMessage="Nessuna segnalazione abuso Santo Patrono."
          />
        ) : null}

        {microTab === 'image_abuse' ? (
          <ReportsListPanel
            entityTypes={['patron']}
            reportKinds={['image_abuse']}
            emptyMessage="Nessuna segnalazione abuso foto Patrono."
          />
        ) : null}

        {microTab === 'photo_suggestion' ? (
          <AdminPatronSaintManager embeddedSection="photo_suggestions" />
        ) : null}

        {microTab === 'person_suggestion' ? (
          <ReportsListPanel
            entityTypes={['patron']}
            reportKinds={['suggestion_person']}
            emptyMessage="Nessun suggerimento personaggio Patrono in coda."
          />
        ) : null}
      </div>
    </div>
  );
};
