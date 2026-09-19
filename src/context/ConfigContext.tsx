import type React from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { designRulesMapsEqual, rulesArrayToMap } from '@/domain/designSystem/designSnapshot';
import {
  getCachedSetting,
  getDesignSystemRules,
  loadGlobalCache,
  resolveDesignRulesForFirstPaint,
  SETTINGS_KEYS,
  saveSetting,
} from '../services/settingsService';
import type { StyleRule } from '../types/designSystem';
import type { PartnerIntegration } from '../types/partners';

/**
 * Runtime config bag: settings keys + typed design-system maps.
 * Chiavi note tipizzate in modo stretto; il resto resta `unknown` (no `any`).
 */
export type AppConfigs = {
  design_system_rules?: Record<string, StyleRule>;
  design_system?: { components: Record<string, StyleRule> };
  /** Mappa partner (SoT settings); non il wrapper `{ partners }`. */
  partner_integrations?: Record<string, PartnerIntegration> | null;
  hero_image?: string | null;
  /** Alias legacy letto da alcuni path Admin. */
  HERO_IMAGE?: string | null;
  default_patron_image?: string | null;
  auth_background_image?: string | null;
  /** Alias legacy (AuthModal). */
  AUTH_BACKGROUND_IMAGE?: string | null;
  social_canvas_bg?: string | null;
  ai_consultant_bg?: string | null;
  favicon_image?: string | null;
  category_placeholders?: Record<string, string> | null;
  suitcase_placeholders?: Record<string, string> | null;
  famous_person_category_placeholders?: Record<string, string> | null;
  famous_person_general_placeholder?: string | null;
  collaboration_live_config?: unknown;
  workspace_engine_config?: unknown;
  design_system_snapshot?: unknown;
  [key: string]: unknown;
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
  updateSetting: (key: string, value: unknown) => Promise<void>;
  updateMultipleSettings: (settings: { key: string; value: unknown }[]) => Promise<void>;
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
const PHASE_A_SETTINGS_KEYS = new Set<string>([SETTINGS_KEYS.DESIGN_SYSTEM_SNAPSHOT]);

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
        const cacheLoaded = await loadGlobalCache();
        if (!cacheLoaded) {
          console.error(
            '[ConfigContext] Global settings cache load failed — config not fully loaded.',
          );
          return;
        }

        // Phase A (S.1) — Snapshot + first-paint rules only. Own object; not mutated later.
        const snapshotKey = SETTINGS_KEYS.DESIGN_SYSTEM_SNAPSHOT;
        const snapshotVal = getCachedSetting(snapshotKey);
        const firstPaintRules = resolveDesignRulesForFirstPaint();
        const phaseA: AppConfigs = {
          [snapshotKey]: snapshotVal !== null && snapshotVal !== undefined ? snapshotVal : null,
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

        // S.1 Snapshot-first (logical): phaseA is assembled as a distinct object before phaseB.
        // S.2 progressive Config: phaseB spreads phaseA and adds specialist keys without mutating
        // the snapshot bag. React 18 may batch both setConfigs into a single paint — an intermediate
        // render with only phaseA is NOT guaranteed. Consumers that need the full specialist bag
        // must gate on isConfigFullyLoaded, not on observing phaseA in isolation.
        setConfigs(phaseA);
        setConfigs(phaseB);
        setIsConfigFullyLoaded(true);
        console.log('[ConfigContext] Config fully loaded (shell was already ready).');
      } catch (error) {
        // S.2: shell stays ready (isShellReady); "fully loaded" means cache + Snapshot applied.
        // On failure the specialist bag was not published — keep isConfigFullyLoaded false so
        // Admin/consumers can distinguish failed load from success (refreshConfig may retry).
        console.error('[ConfigContext] ERROR during loadConfig. Shell remains ready.', error);
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

  const updateSetting = useCallback(
    async (key: string, value: unknown) => {
      if (!key) {
        console.error('[ConfigContext] updateSetting called with invalid key:', key);
        return;
      }
      await saveSetting(key, value);
      await refreshConfig();
    },
    [refreshConfig],
  );

  const updateMultipleSettings = useCallback(
    async (settings: { key: string; value: unknown }[]) => {
      const validSettings = settings.filter((s) => s.key);
      await Promise.all(validSettings.map((s) => saveSetting(s.key, s.value)));
      await refreshConfig();
    },
    [refreshConfig],
  );

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
