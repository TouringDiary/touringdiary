import { Flag } from 'lucide-react';
import { type KeyboardEvent, useRef, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/common/AdminPageHeader';
import { CountBadge } from '@/components/ui/CountBadge';
import { useReportNotificationCounts } from '@/hooks/admin/useReportNotificationCounts';
import { AdminReportsAiTab } from './AdminReportsAiTab';
import { AdminReportsCommunityTab } from './AdminReportsCommunityTab';
import { AdminReportsFamousPersonTab } from './AdminReportsFamousPersonTab';
import { AdminReportsPatronTab } from './AdminReportsPatronTab';
import { ReportsStatusLegend } from './ReportsStatusLegend';
import { ADMIN_REPORTS_TABS, type AdminReportsTabId } from './reportsHubConstants';

const renderTabPanel = (tabId: AdminReportsTabId, onAiQueueChanged?: () => void) => {
  switch (tabId) {
    case 'community':
      return <AdminReportsCommunityTab />;
    case 'patron':
      return <AdminReportsPatronTab />;
    case 'famous_person':
      return <AdminReportsFamousPersonTab />;
    case 'ai':
      return <AdminReportsAiTab onQueueChanged={onAiQueueChanged} />;
    default:
      return null;
  }
};

type AdminReportsHubProps = {
  initialTab?: AdminReportsTabId;
};

/** Hub centralizzato segnalazioni e suggerimenti (MF2). */
export const AdminReportsHub = ({ initialTab = 'community' }: AdminReportsHubProps) => {
  const [activeTab, setActiveTab] = useState<AdminReportsTabId>(initialTab);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { counts: reportCounts, refresh: refreshReportCounts } = useReportNotificationCounts(true);

  const focusTabAt = (index: number) => {
    const tab = ADMIN_REPORTS_TABS[index];
    if (!tab) return;
    setActiveTab(tab.id);
    tabRefs.current[index]?.focus();
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const count = ADMIN_REPORTS_TABS.length;
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % count;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + count) % count;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = count - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    focusTabAt(nextIndex);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <AdminPageHeader
        icon={Flag}
        title="Segnalazioni"
        subtitle="Hub centralizzato segnalazioni — MF2 + coda AI MF3"
        accent="rose"
      />

      <ReportsStatusLegend />

      <div
        className="bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]"
        role="tablist"
        aria-label="Macro-sezioni segnalazioni"
      >
        <div className="flex flex-nowrap gap-1 min-w-max w-full sm:w-auto sm:min-w-full">
          {ADMIN_REPORTS_TABS.map((tab, index) => {
            const isActive = activeTab === tab.id;
            const panelId = `admin-reports-panel-${tab.id}`;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                role="tab"
                id={`admin-reports-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={panelId}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`shrink-0 min-w-[8.5rem] sm:min-w-0 sm:flex-1 px-3 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 inline-flex items-center justify-center gap-2 ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <span>{tab.label}</span>
                {tab.id === 'ai' && reportCounts.aiVerifyQueueTotal > 0 ? (
                  <CountBadge
                    count={reportCounts.aiVerifyQueueTotal}
                    size="sm"
                    variant="white-black"
                    shape="pill"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {ADMIN_REPORTS_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <div
            key={tab.id}
            id={`admin-reports-panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`admin-reports-tab-${tab.id}`}
            hidden={!isActive}
            className="rounded-xl"
          >
            {isActive ? renderTabPanel(tab.id, () => void refreshReportCounts()) : null}
          </div>
        );
      })}
    </div>
  );
};
