import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCachedSetting, SETTINGS_KEYS, saveSetting, loadGlobalCache } from '../services/settingsService';

// Tipizzazione per le configurazioni
type ConfigContextType = {
  configs: { [key: string]: any };
  isLoading: boolean;
  refreshConfig: () => Promise<void>;
  updateSetting: (key: string, value: any) => Promise<void>;
  updateMultipleSettings: (settings: { key: string; value: any }[]) => Promise<void>;
};

// Creazione del Context
const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// Hook per l'utilizzo del context
export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

// Componente Provider
export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [configs, setConfigs] = useState<{ [key: string]: any }>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadConfig = useCallback(async () => {
    console.log("[ConfigContext] Loading all configurations...");
    setIsLoading(true);

    await loadGlobalCache();

    const newConfigs: { [key: string]: any } = {};

    // ✅ FIX: filtra chiavi invalide
    console.log("SETTINGS_KEYS RUNTIME:", SETTINGS_KEYS);
    const allKeys = Object.values(SETTINGS_KEYS).filter(Boolean);

    // ✅ FIX: protezione totale
    for (const key of allKeys) {
      if (!key) {
        console.warn("[ConfigContext] Skipping invalid key:", key);
        continue;
      }

      const setting = getCachedSetting(key);

      if (setting !== null && setting !== undefined) {
        newConfigs[key] = setting;
      } else {
        newConfigs[key] = null;
      }
    }

    // ======================= 🔥 NUOVO DESIGN SYSTEM =======================
    // Carichiamo le regole dalla tabella nuova (design_system_rules)
    // e le mettiamo in configs.design_system_rules
    try {
      const { getDesignSystemRules } = await import('../services/settingsService');
      const rules = await getDesignSystemRules();

      const rulesMap = rules.reduce((acc: any, rule: any) => {
        acc[rule.component_key] = rule;
        return acc;
      }, {});

      newConfigs.design_system_rules = rulesMap;
      newConfigs.design_system = { components: rulesMap };

      console.log("[ConfigContext] Design system rules loaded:", rulesMap);
    } catch (e) {
      console.warn("[ConfigContext] Failed to load design_system_rules:", e);
    }
    // =====================================================================

    setConfigs(newConfigs);
    setIsLoading(false);
    console.log("[ConfigContext] Configurations loaded.", newConfigs);
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const refreshConfig = async () => {
    await loadConfig();
  };

  const updateSetting = async (key: string, value: any) => {
    if (!key) {
      console.error("[ConfigContext] updateSetting called with invalid key:", key);
      return;
    }
    await saveSetting(key, value);
    await refreshConfig();
  };
    
  const updateMultipleSettings = async (settings: { key: string; value: any }[]) => {
      const validSettings = settings.filter(s => s.key);
      const promises = validSettings.map(s => saveSetting(s.key, s.value));
      await Promise.all(promises);
      await refreshConfig();
  };

  const value = {
    configs,
    isLoading,
    refreshConfig,
    updateSetting,
    updateMultipleSettings,
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};