import { useEffect, useState } from 'react';
import { useConfig } from '@/context/ConfigContext';
import { SETTINGS_KEYS } from '../../services/settingsService';
import type { SocialLayoutConfig, SocialTemplate } from '../../types/index';
import type { TextStyle } from '../../types/models/Social';

const DEFAULT_LAYOUT: SocialLayoutConfig = {
  userName: {
    x: 200,
    y: 100,
    fontSize: 24,
    color: '#ffffff',
    fontFamily: 'sans',
    textAlign: 'center',
    shadowColor: '#000000',
    shadowBlur: 10,
  },
  referralCode: {
    x: 200,
    y: 450,
    fontSize: 32,
    color: '#facc15',
    fontFamily: 'sans',
    textAlign: 'center',
    shadowColor: '#000000',
    shadowBlur: 15,
  },
};

export const useSocialCanvasLogic = () => {
  const { configs } = useConfig();

  const configBg = (value: unknown) => (typeof value === 'string' ? value : '');
  const defaultBg = configBg(configs[SETTINGS_KEYS.SOCIAL_CANVAS_BG]);

  // Canvas State
  const [editorBg, setEditorBg] = useState<string>(defaultBg);
  const [editorLayout, setEditorLayout] = useState<SocialLayoutConfig>(DEFAULT_LAYOUT);
  const [templateName, setTemplateName] = useState('Nuovo Template');

  useEffect(() => {
    const bgFromConfig = configBg(configs[SETTINGS_KEYS.SOCIAL_CANVAS_BG]);
    if (bgFromConfig) {
      setEditorBg(bgFromConfig);
    }
  }, [configs]);

  // Load existing template into editor
  const loadFromTemplate = (t: SocialTemplate) => {
    setEditorBg(t.bgUrl);
    setEditorLayout(t.layoutConfig);
    setTemplateName(t.name);
  };

  // Reset to default state, which is derived from the global config
  const resetToDefault = () => {
    const bgFromConfig = configBg(configs[SETTINGS_KEYS.SOCIAL_CANVAS_BG]);
    setEditorBg(bgFromConfig);
    setEditorLayout(DEFAULT_LAYOUT);
    setTemplateName('Nuovo Template');
  };

  // Helper to update specific style properties
  const updateTextStyle = <K extends keyof TextStyle>(
    elementKey: 'userName' | 'referralCode',
    field: K,
    value: TextStyle[K],
  ) => {
    setEditorLayout((prev) => ({
      ...prev,
      [elementKey]: { ...prev[elementKey], [field]: value },
    }));
  };

  return {
    editorBg,
    setEditorBg,
    editorLayout,
    setEditorLayout,
    templateName,
    setTemplateName,

    // Actions
    loadFromTemplate,
    resetToDefault,
    updateTextStyle,
  };
};
