import React from 'react';
import { Copy } from 'lucide-react';
import { TemplateRow } from './TemplateRow';
import { TemplatePreview } from './TemplatePreview';
import { Suitcase } from '@/types/suitcase';

interface TemplateSelectorSectionProps {
  globalTemplates: Suitcase[];
  suggestedTemplateIds: string[];
  preferences: Record<string, { enabled: boolean; priority: number }>;
  showDismissed: boolean;
  hoveredItemId: string | null;
  isCloning: boolean;
  onHover: (id: string) => void;
  onTogglePreference: (id: string, enabled: boolean) => void;
  onUseTemplate: (id: string) => void;
  onAddCategory: (id: string) => void;
}

export const TemplateSelectorSection: React.FC<TemplateSelectorSectionProps> = ({
  globalTemplates,
  suggestedTemplateIds,
  preferences,
  showDismissed,
  hoveredItemId,
  isCloning,
  onHover,
  onTogglePreference,
  onUseTemplate,
  onAddCategory
}) => {
  const filteredTemplates = globalTemplates.filter(
    tpl => showDismissed || preferences[tpl.id]?.enabled !== false
  );

  const hoveredTemplate = globalTemplates.find(t => t.id === hoveredItemId) || filteredTemplates[0] || null;

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start max-w-[1280px] mx-auto w-full px-4 lg:px-0">
        {/* Lista template */}
        <div role="listbox" aria-label="Template valigia disponibili" className="space-y-2">
          {filteredTemplates.map(tpl => {
            const isSuggested = suggestedTemplateIds.includes(tpl.id);
            const isPreferred = preferences[tpl.id]?.enabled === true;
            const isHovered = hoveredItemId === tpl.id;

            return (
              <TemplateRow
                key={tpl.id}
                template={tpl}
                isSuggested={isSuggested}
                isPreferred={isPreferred}
                isHovered={isHovered}
                isCloning={isCloning}
                onHover={() => onHover(tpl.id)}
                onTogglePreference={() => onTogglePreference(tpl.id, !isPreferred)}
                onUse={() => onUseTemplate(tpl.id)}
              />
            );
          })}
        </div>

        {/* Preview dinamica (Sticky su desktop) */}
        <div aria-live="polite" aria-atomic="true" className="block animate-in fade-in slide-in-from-bottom-4 duration-500">
          <TemplatePreview template={hoveredTemplate} onAddCategory={onAddCategory} />
        </div>
      </div>
    </div>
  );
};
