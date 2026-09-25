import { useState } from 'react';
import { AdminReportsCommunitySuggestionsPanel } from './AdminReportsCommunitySuggestionsPanel';
import { ReportsListPanel } from './ReportsListPanel';
import { ReportsMicroTabBar } from './ReportsMicroTabBar';

const COMMUNITY_MICRO_TABS = [
  { id: 'places', label: 'Luoghi suggeriti' },
  { id: 'errors', label: 'Errori segnalati' },
  { id: 'poi_abuse', label: 'Abuso POI' },
  { id: 'photo_live', label: 'Abusi Foto Live' },
  { id: 'photo_gallery', label: 'Abusi Foto Galleria' },
] as const;

type CommunityMicroTabId = (typeof COMMUNITY_MICRO_TABS)[number]['id'];

export const AdminReportsCommunityTab = () => {
  const [microTab, setMicroTab] = useState<CommunityMicroTabId>('places');

  return (
    <div className="space-y-4">
      <ReportsMicroTabBar
        tabs={COMMUNITY_MICRO_TABS}
        activeId={microTab}
        onChange={(id) => setMicroTab(id as CommunityMicroTabId)}
        ariaLabel="Micro-sezioni Community"
      />

      <div id={`reports-micro-panel-${microTab}`} role="tabpanel">
        {microTab === 'places' ? (
          <AdminReportsCommunitySuggestionsPanel
            types={['new_place']}
            emptyMessage="Nessun luogo suggerito in coda."
          />
        ) : null}

        {microTab === 'errors' ? (
          <AdminReportsCommunitySuggestionsPanel
            types={['edit_info', 'history_culture']}
            emptyMessage="Nessun errore segnalato in coda."
          />
        ) : null}

        {microTab === 'poi_abuse' ? (
          <ReportsListPanel
            entityTypes={['poi']}
            reportKinds={['entity_abuse', 'image_abuse']}
            emptyMessage="Nessuna segnalazione abuso POI."
          />
        ) : null}

        {microTab === 'photo_live' ? (
          <ReportsListPanel
            entityTypes={['photo_submission']}
            sourceContexts={['community_live']}
            reportKinds={['image_abuse']}
            emptyMessage="Nessuna segnalazione abuso Foto Live."
          />
        ) : null}

        {microTab === 'photo_gallery' ? (
          <ReportsListPanel
            entityTypes={['photo_submission']}
            sourceContexts={['city_gallery']}
            reportKinds={['image_abuse']}
            emptyMessage="Nessuna segnalazione abuso Galleria città."
          />
        ) : null}
      </div>
    </div>
  );
};
