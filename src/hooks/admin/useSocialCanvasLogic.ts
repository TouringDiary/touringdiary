
import { useState, useEffect } from 'react';
import { SocialTemplate, SocialLayoutConfig } from '../../types/index';
import { getGlobalImage } from '../../services/settingsService';

const DEFAULT_LAYOUT: SocialLayoutConfig = {
    userName: { x: 200, y: 100, fontSize: 24, color: '#ffffff', fontFamily: 'sans', textAlign: 'center', shadowColor: '#000000', shadowBlur: 10 },
    referralCode: { x: 200, y: 450, fontSize: 32, color: '#facc15', fontFamily: 'sans', textAlign: 'center', shadowColor: '#000000', shadowBlur: 15 }
};

export const useSocialCanvasLogic = () => {
    // Load default from centralized service
    const defaultBg = getGlobalImage('social_bg');

    // Canvas State
    const [editorBg, setEditorBg] = useState<string>(defaultBg);
    const [editorLayout, setEditorLayout] = useState<SocialLayoutConfig>(DEFAULT_LAYOUT);
    const [templateName, setTemplateName] = useState('Nuovo Template');

    // Load existing template into editor
    const loadFromTemplate = (t: SocialTemplate) => {
        setEditorBg(t.bgUrl);
        setEditorLayout(t.layoutConfig);
        setTemplateName(t.name);
    };

    // Reset to default state
    const resetToDefault = () => {
        setEditorBg(defaultBg);
        setEditorLayout(DEFAULT_LAYOUT);
        setTemplateName('Nuovo Template');
    };

    // Helper to update specific style properties
    const updateTextStyle = (elementKey: 'userName' | 'referralCode', field: string, value: any) => {
        setEditorLayout(prev => ({
            ...prev,
            [elementKey]: { ...prev[elementKey], [field]: value }
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
        updateTextStyle
    };
};
