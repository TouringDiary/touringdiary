import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  Layers,
  Loader2,
  Monitor,
  RefreshCw,
  Smartphone,
} from 'lucide-react';
import { useConfig } from '@/context/ConfigContext';
import type { StyleRule } from '@/types/designSystem';
import { updateDesignSystemRule, rebuildDesignSystemCache } from '@/services/settingsService';
import { FOUNDATION_SETTINGS_GROUPS } from '@/data/system/foundationSettingsCatalog';
import { getFoundationPreviewMeta } from '../design/foundation/foundationPreviewMeta';
import { FoundationModalLivePreview } from '../design/foundation/FoundationPreviewComponents';
import ComponentPreviewHost from '../design/ComponentPreviewHost';
import { SideEditorPanel } from '../design/SideEditorPanel';

const isFoundationRule = (rule: StyleRule): boolean =>
  (rule.section?.trim() ?? '') === 'foundation';

const FoundationSettingsPanel: React.FC = () => {
  const { configs, isLoading: isConfigLoading, refreshConfig } = useConfig();

  const [originalRules, setOriginalRules] = useState<Record<string, StyleRule> | null>(null);
  const [editedRules, setEditedRules] = useState<Record<string, StyleRule> | null>(null);
  const [selectedBaseKey, setSelectedBaseKey] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(FOUNDATION_SETTINGS_GROUPS.map((g) => [g.id, true]))
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [rebuildError, setRebuildError] = useState<string | null>(null);

  useEffect(() => {
    const source = configs.design_system_rules;
    if (!source) return;

    const foundationOnly = Object.entries(source).reduce<Record<string, StyleRule>>(
      (acc, [key, value]) => {
        const rule = { ...value, component_key: key, section: value.section ?? 'uncategorized' };
        if (isFoundationRule(rule)) {
          acc[key] = rule;
        }
        return acc;
      },
      {}
    );

    setOriginalRules(structuredClone(foundationOnly));
    setEditedRules(structuredClone(foundationOnly));
  }, [configs]);

  const activeRules = editedRules ?? {};

  const selectedEditorContext = useMemo(() => {
    if (!editedRules || !selectedBaseKey) return null;
    return {
      baseKey: selectedBaseKey,
      desktop: editedRules[selectedBaseKey] ?? null,
      mobile: editedRules[`${selectedBaseKey}_mobile`] ?? null,
    };
  }, [editedRules, selectedBaseKey]);

  const handleRuleChange = useCallback((ruleKey: string, updatedRule: StyleRule) => {
    setEditedRules((prev) => (prev ? { ...prev, [ruleKey]: updatedRule } : null));
  }, []);

  const handleRebuildCache = useCallback(async () => {
    setIsRebuilding(true);
    setRebuildError(null);
    try {
      await rebuildDesignSystemCache();
      await refreshConfig();
    } catch (err) {
      setRebuildError(err instanceof Error ? err.message : 'Errore sconosciuto.');
    } finally {
      setIsRebuilding(false);
    }
  }, [refreshConfig]);

  const handleSaveChanges = async (ruleToSave: StyleRule) => {
    if (!originalRules) return;
    const saveKey = ruleToSave.component_key;
    if (!saveKey) return;

    if (JSON.stringify(ruleToSave) === JSON.stringify(originalRules[saveKey])) {
      setSelectedBaseKey(null);
      return;
    }

    setIsSaving(true);
    try {
      await updateDesignSystemRule(ruleToSave);
      await rebuildDesignSystemCache();
      await refreshConfig();
      setSelectedBaseKey(null);
    } catch (err) {
      console.error('Failed to save foundation settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const foundationRuleCount = Object.keys(activeRules).filter((k) => !k.endsWith('_mobile')).length;

  if (isConfigLoading) {
    return (
      <div className="p-8 flex items-center justify-center gap-3">
        <Loader2 className="animate-spin text-slate-500" />
        <span className="text-slate-400">Caricamento Foundation...</span>
      </div>
    );
  }

  if (foundationRuleCount === 0) {
    return (
      <div style={{ paddingBottom: '80px' }}>
        <div className="p-8 text-center bg-slate-800 rounded-lg border border-yellow-500/50">
          <div className="flex items-center justify-center gap-3 text-yellow-400">
            <AlertTriangle />
            <h3 className="text-xl font-bold">Foundation non inizializzata</h3>
          </div>
          <p className="mt-2 text-slate-300">
            Nessuna regola Foundation trovata in <code className="text-indigo-300">design_system_rules</code>.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Esegui la migration seed Foundation o premi Rigenera Cache dopo il deploy.
          </p>
          {rebuildError && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-sm text-red-300">
              <strong>Errore:</strong> {rebuildError}
            </div>
          )}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleRebuildCache}
              disabled={isRebuilding}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 mx-auto"
            >
              {isRebuilding ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              {isRebuilding ? 'Rigenerazione in corso...' : 'Rigenera Cache'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <Layers className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Design System</span>
          </div>
          <h3 className="text-lg font-bold text-white">Foundation modali</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Standard grafico ufficiale per modali e componenti condivisi. Le modali future leggeranno
            questi token tramite <code className="text-slate-300">useFoundationStyles</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRebuildCache}
          disabled={isRebuilding}
          className="self-start lg:self-center bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-slate-700 disabled:opacity-50"
        >
          {isRebuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Rigenera cache
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white">Anteprima live modale</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Composizione dai token Foundation correnti (non salvati finché non confermi nel editor).
            </p>
          </div>
          <div className="flex items-center gap-2 p-1 bg-slate-800 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`p-2 rounded-md flex items-center gap-1.5 text-xs font-bold uppercase ${
                previewDevice === 'desktop' ? 'bg-slate-700 text-indigo-400' : 'text-slate-400'
              }`}
            >
              <Monitor className="w-4 h-4" /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`p-2 rounded-md flex items-center gap-1.5 text-xs font-bold uppercase ${
                previewDevice === 'mobile' ? 'bg-slate-700 text-indigo-400' : 'text-slate-400'
              }`}
            >
              <Smartphone className="w-4 h-4" /> Mobile
            </button>
          </div>
        </div>
        <div className="p-4 bg-slate-950/50">
          <FoundationModalLivePreview rules={activeRules} isMobile={previewDevice === 'mobile'} />
        </div>
      </div>

      {FOUNDATION_SETTINGS_GROUPS.map((group) => (
        <section
          key={group.id}
          className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
        >
          <button
            type="button"
            onClick={() => toggleGroup(group.id)}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-800/40 transition-colors"
          >
            <div>
              <h4 className="text-sm font-bold text-white">{group.label}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{group.description}</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 shrink-0">
              {group.items.length} elementi {expandedGroups[group.id] ? '▾' : '▸'}
            </span>
          </button>

          {expandedGroups[group.id] && (
            <div className="border-t border-slate-800 divide-y divide-slate-800">
              {group.items.map(({ baseKey, label }) => {
                const desktop = activeRules[baseKey];
                const mobile = activeRules[`${baseKey}_mobile`] ?? null;
                if (!desktop) return null;

                const displayName = label ?? desktop.element_name ?? baseKey;
                const previewMeta = getFoundationPreviewMeta(baseKey);

                return (
                  <div
                    key={baseKey}
                    className="grid grid-cols-1 xl:grid-cols-[1fr_280px_auto] gap-4 px-5 py-4 items-center hover:bg-slate-800/30"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white">{displayName}</div>
                      <code className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded mt-1 inline-block">
                        {baseKey}
                      </code>
                    </div>

                    <div className="bg-slate-800 rounded-lg border border-slate-700 p-2 min-h-[64px] flex items-center justify-center overflow-hidden">
                      <ComponentPreviewHost
                        rule={desktop}
                        componentKey={baseKey}
                        isLarge={false}
                        isMobile={false}
                        meta={previewMeta}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedBaseKey(baseKey)}
                      className="flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
                    >
                      Modifica
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {mobile && (
                      <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3 pl-0 md:pl-4 border-t border-slate-800/60 pt-3 md:border-0 md:pt-0">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          <Smartphone className="w-3 h-3" /> Variante mobile disponibile
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ))}

      {selectedEditorContext?.desktop && (
        <SideEditorPanel
          baseKey={selectedEditorContext.baseKey}
          desktopRule={selectedEditorContext.desktop}
          mobileRule={selectedEditorContext.mobile}
          editedRules={editedRules}
          isSaving={isSaving}
          onRuleChange={handleRuleChange}
          onClose={() => setSelectedBaseKey(null)}
          onSave={handleSaveChanges}
        />
      )}
    </div>
  );
};

export default FoundationSettingsPanel;
