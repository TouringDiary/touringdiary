import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  getCachedSetting,
  SETTINGS_KEYS,
  saveSetting,
  loadGlobalCache,
  resolveDesignRulesForFirstPaint,
  getDesignSystemRules,
} from '../services/settingsService';
import {
  designRulesMapsEqual,
  rulesArrayToMap,
} from '@/domain/designSystem/designSnapshot';
import type { StyleRule } from '../types/designSystem';

/** Runtime config bag: settings keys + typed design-system maps. */
export type AppConfigs = {
  design_system_rules?: Record<string, StyleRule>;
  design_system?: { components: Record<string, StyleRule> };
  [key: string]: any;
};

/**
 * STEP S.2 — Shell Ready ≠ Config Fully Loaded (DOC-38 §S.2).
 * - isShellReady: layout/Home may mount (never waits on specialist settings).
 * - isConfigFullyLoaded: settings cache + Snapshot applied (Admin / consumers that need values).
 * - isLoading: legacy alias of !isConfigFullyLoaded (Admin panels).
 */
type ConfigContextType = {
  configs: AppConfigs;
  /** @deprecated Prefer isConfigFullyLoaded — kept for Admin consumers. */
  isLoading: boolean;
  isShellReady: boolean;
  isConfigFullyLoaded: boolean;
  refreshConfig: () => Promise<void>;
  updateSetting: (key: string, value: any) => Promise<void>;
  updateMultipleSettings: (settings: { key: string; value: any }[]) => Promise<void>;
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

function applyDesignBag(configs: AppConfigs, rulesMap: Record<string, StyleRule>): AppConfigs {
  return {
    ...configs,
    design_system_rules: rulesMap,
    design_system: { components: rulesMap },
  };
}

/**
 * Settings keys already published in Phase A (Snapshot / first-paint).
 * Not “all bootstrap keys”: only those applied before the specialist merge,
 * so Phase B can skip them without double-write.
 */
const PHASE_A_SETTINGS_KEYS = new Set<string>([
  SETTINGS_KEYS.DESIGN_SYSTEM_SNAPSHOT,
]);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [configs, setConfigs] = useState<AppConfigs>({});
  /** S.2: shell never blocked — true from first paint. */
  const [isShellReady] = useState(true);
  const [isConfigFullyLoaded, setIsConfigFullyLoaded] = useState(false);
  const loadInFlightRef = useRef<Promise<void> | null>(null);
  const remoteDesignGenerationRef = useRef(0);

  const loadConfig = useCallback(async (_options?: { showLoading?: boolean }) => {
    if (loadInFlightRef.current) {
      return loadInFlightRef.current;
    }

    const run = (async () => {
      console.log('[ConfigContext] S.2 loading settings (non-blocking shell)...');

      try {
        // S.2: shell is already ready (isShellReady). This await fills the settings cache;
        // it is NOT the bootstrap gate. Full Config exists only for specialist consumers
        // (Admin, partner, GPS options, taxonomy, …) — never to unlock MainLayout.
        await loadGlobalCache();

        // Phase A (S.1) — Snapshot + first-paint rules only. Own object; not mutated later.
        const snapshotKey = SETTINGS_KEYS.DESIGN_SYSTEM_SNAPSHOT;
        const snapshotVal = getCachedSetting(snapshotKey);
        const firstPaintRules = resolveDesignRulesForFirstPaint();
        const phaseA: AppConfigs = {
          [snapshotKey]:
            snapshotVal !== null && snapshotVal !== undefined ? snapshotVal : null,
          design_system_rules: firstPaintRules,
          design_system: { components: firstPaintRules },
        };

        // Phase B — full bag = Phase A + remaining SETTINGS_KEYS (specialist / deferred).
        const phaseB: AppConfigs = { ...phaseA };
        for (const key of Object.values(SETTINGS_KEYS).filter(Boolean)) {
          if (!key || PHASE_A_SETTINGS_KEYS.has(key)) continue;
          const setting = getCachedSetting(key);
          phaseB[key] = setting !== null && setting !== undefined ? setting : null;
        }

        // Two setConfigs are intentional (DOC-38 S.1 Snapshot-first, S.2 progressive Config):
        // 1) publish Snapshot bag ASAP; 2) publish full bag, then mark Fully Loaded.
        // Same async continuation → React 18 may batch into one paint; bags stay distinct
        // objects so we never mutate a published snapshot. Do not collapse into one set
        // without an explicit product decision to drop intermediate Snapshot publish.
        setConfigs(phaseA);
        setConfigs(phaseB);
        setIsConfigFullyLoaded(true);
        console.log('[ConfigContext] Config fully loaded (shell was already ready).');
      } catch (error) {
        console.error('[ConfigContext] ERROR during loadConfig. Shell remains ready.', error);
        setIsConfigFullyLoaded(true);
      }

      // Design remoto async — S.1; never gates shell.
      const generation = ++remoteDesignGenerationRef.current;
      void (async () => {
        try {
          const rules = await getDesignSystemRules({ force: true });
          if (generation !== remoteDesignGenerationRef.current) return;

          const remoteMap = rulesArrayToMap(rules);
          setConfigs((prev) => {
            const current = prev.design_system_rules ?? {};
            if (designRulesMapsEqual(current, remoteMap)) {
              console.log('[ConfigContext] Design remoto ≡ Snapshot — no UI override.');
              return prev;
            }
            console.log('[ConfigContext] Design remoto differs — applying UI override.');
            return applyDesignBag(prev, remoteMap);
          });
        } catch (e) {
          console.warn('[ConfigContext] Design remoto fetch failed (non-blocking).', e);
        }
      })();
    })();

    loadInFlightRef.current = run;
    try {
      await run;
    } finally {
      if (loadInFlightRef.current === run) {
        loadInFlightRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const refreshConfig = useCallback(async () => {
    setIsConfigFullyLoaded(false);
    await loadConfig();
  }, [loadConfig]);

  const updateSetting = useCallback(async (key: string, value: any) => {
    if (!key) {
      console.error('[ConfigContext] updateSetting called with invalid key:', key);
      return;
    }
    await saveSetting(key, value);
    await refreshConfig();
  }, [refreshConfig]);

  const updateMultipleSettings = useCallback(async (settings: { key: string; value: any }[]) => {
    const validSettings = settings.filter((s) => s.key);
    await Promise.all(validSettings.map((s) => saveSetting(s.key, s.value)));
    await refreshConfig();
  }, [refreshConfig]);

  const value = useMemo<ConfigContextType>(
    () => ({
      configs,
      isLoading: !isConfigFullyLoaded,
      isShellReady,
      isConfigFullyLoaded,
      refreshConfig,
      updateSetting,
      updateMultipleSettings,
    }),
    [
      configs,
      isShellReady,
      isConfigFullyLoaded,
      refreshConfig,
      updateSetting,
      updateMultipleSettings,
    ],
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};
