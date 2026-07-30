import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  Globe2,
  Loader2,
  RefreshCw,
  Smartphone,
} from 'lucide-react';
import { useConfig } from '@/context/ConfigContext';
import type { StyleRule } from '@/types/designSystem';
import { updateDesignSystemRule, rebuildDesignSystemCache } from '@/services/settingsService';
import { MYWORLD_SETTINGS_GROUPS } from '@/data/system/myWorldSettingsCatalog';
import ComponentPreviewHost from '../design/ComponentPreviewHost';
import { SideEditorPanel } from '../design/SideEditorPanel';

const isMyWorldRule = (rule: StyleRule): boolean =>
  (rule.section?.trim() ?? '') === 'myworld';

/** Confronto locale StyleRule (nessuna utility condivisa nel progetto; evita JSON.stringify). */
const isSameStyleRule = (a: StyleRule | undefined, b: StyleRule): boolean => {
  if (!a) return false;
  return (
    a.component_key === b.component_key &&
    a.element_name === b.element_name &&
    a.section === b.section &&
    a.font_family === b.font_family &&
    a.text_size === b.text_size &&
    a.font_weight === b.font_weight &&
    a.text_transform === b.text_transform &&
    a.tracking === b.tracking &&
    a.color_class === b.color_class &&
    a.line_height === b.line_height &&
    a.effect_class === b.effect_class &&
    a.css_class === b.css_class &&
    a.preview_text === b.preview_text
  );
};

/**
 * Sezione Admin del Design System dedicata agli elementi grafici MyWorld
 * (MySpace + Workspace). Stessa SoT `design_system_rules` di Foundation/Legacy.
 */
const MyWorldStyleSettingsPanel: React.FC = () => {
  const { configs, isLoading: isConfigLoading, refreshConfig } = useConfig();

  const [originalRules, setOriginalRules] = useState<Record<string, StyleRule> | null>(null);
  const [editedRules, setEditedRules] = useState<Record<string, StyleRule> | null>(null);
  const [selectedBaseKey, setSelectedBaseKey] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(MYWORLD_SETTINGS_GROUPS.map((g) => [g.id, true])),
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [rebuildError, setRebuildError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const source = configs.design_system_rules;
    if (!source) return;

    const myworldOnly = Object.entries(source).reduce<Record<string, StyleRule>>(
      (acc, [key, value]) => {
        const rule = { ...value, component_key: key, section: value.section ?? 'uncategorized' };
        if (isMyWorldRule(rule)) {
          acc[key] = rule;
        }
        return acc;
      },
      {},
    );

    // Due clone distinti: editedRules viene mutato indipendentemente da originalRules.
    const snapshot = structuredClone(myworldOnly);
    setOriginalRules(snapshot);
    setEditedRules(structuredClone(snapshot));
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

    if (isSameStyleRule(originalRules[saveKey], ruleToSave)) {
      setSelectedBaseKey(null);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      await updateDesignSystemRule(ruleToSave);
      await rebuildDesignSystemCache();
      await refreshConfig();
      setSelectedBaseKey(null);
    } catch (err) {
      console.error('Failed to save MyWorld Style settings:', err);
      setSaveError(err instanceof Error ? err.message : 'Errore salvataggio MyWorld Style.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const ruleCount = Object.keys(activeRules).filter((k) => !k.endsWith('_mobile')).length;

  if (isConfigLoading) {
    return (
      <div className="p-8 flex items-center justify-center gap-3">
        <Loader2 className="animate-spin text-slate-500" />
        <span className="text-slate-400">Caricamento MyWorld Style...</span>
      </div>
    );
  }

  if (ruleCount === 0) {
    return (
      <div style={{ paddingBottom: '80px' }}>
        <div className="p-8 text-center bg-slate-800 rounded-lg border border-yellow-500/50">
          <div className="flex items-center justify-center gap-3 text-yellow-400">
            <AlertTriangle />
            <h3 className="text-xl font-bold">MyWorld Style non inizializzato</h3>
          </div>
          <p className="mt-2 text-slate-300">
            Nessuna regola <code className="text-indigo-300">section: myworld</code> in{' '}
            <code className="text-indigo-300">design_system_rules</code>.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Esegui la migration seed MyWorld Style. I componenti usano già i seed di default
            finché il DB non è popolato.
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
      {saveError && (
        <div className="p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-sm text-red-300">
          <strong>Errore salvataggio:</strong> {saveError}
        </div>
      )}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <Globe2 className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Design System</span>
          </div>
          <h3 className="text-lg font-bold text-white">MyWorld Style</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Sezione specializzata del Design System per l&apos;identità visiva di MyWorld (MySpace e
            Workspace). Stessa Source of Truth di Foundation e del Design System legacy — non un
            sistema separato. Riferimento grafico: Valigia.
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

      {MYWORLD_SETTINGS_GROUPS.map((group) => (
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
                      <div className="xl:col-span-3 text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <Smartphone className="w-3 h-3" /> Variante mobile disponibile
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

export default MyWorldStyleSettingsPanel;
