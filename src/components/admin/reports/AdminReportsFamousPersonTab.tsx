import { useState } from 'react';
import { AdminFamousPeopleManager } from '@/components/admin/AdminFamousPeopleManager';
import { ReportsListPanel } from './ReportsListPanel';
import { ReportsMicroTabBar } from './ReportsMicroTabBar';

const FAMOUS_PERSON_MICRO_TABS = [
  { id: 'entity_abuse', label: 'Abuso personaggio' },
  { id: 'image_abuse', label: 'Abuso foto' },
  { id: 'photo_suggestion', label: 'Suggerimento foto' },
  { id: 'person_suggestion', label: 'Suggerimento personaggio' },
] as const;

type FamousPersonMicroTabId = (typeof FAMOUS_PERSON_MICRO_TABS)[number]['id'];

export const AdminReportsFamousPersonTab = () => {
  const [microTab, setMicroTab] = useState<FamousPersonMicroTabId>('entity_abuse');

  return (
    <div className="space-y-4">
      <ReportsMicroTabBar
        tabs={FAMOUS_PERSON_MICRO_TABS}
        activeId={microTab}
        onChange={(id) => setMicroTab(id as FamousPersonMicroTabId)}
        ariaLabel="Micro-sezioni Personaggio Famoso"
      />

      <div id={`reports-micro-panel-${microTab}`} role="tabpanel">
        {microTab === 'entity_abuse' ? (
          <ReportsListPanel
            entityTypes={['city_person']}
            reportKinds={['entity_abuse']}
            emptyMessage="Nessuna segnalazione abuso personaggio."
          />
        ) : null}

        {microTab === 'image_abuse' ? (
          <ReportsListPanel
            entityTypes={['city_person']}
            reportKinds={['image_abuse']}
            emptyMessage="Nessuna segnalazione abuso foto."
          />
        ) : null}

        {microTab === 'photo_suggestion' ? (
          <AdminFamousPeopleManager embeddedSection="photo_suggestions" />
        ) : null}

        {microTab === 'person_suggestion' ? (
          <AdminFamousPeopleManager embeddedSection="person_suggestions" />
        ) : null}
      </div>
    </div>
  );
};
