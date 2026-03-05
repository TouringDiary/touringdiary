
import { supabase } from './supabaseClient';
import { SocialTemplate } from '../types/index';
import { DatabaseSocialTemplate } from '../types/database';
import { getAiClient } from './ai/aiClient';
import { withRetry } from './ai/aiUtils';

// --- CRUD OPERATIONS ---

export const getSocialTemplates = async (): Promise<SocialTemplate[]> => {
    try {
        const { data, error } = await supabase
            .from('social_templates')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data as DatabaseSocialTemplate[]).map(t => ({
            id: t.id,
            name: t.name,
            bgUrl: t.bg_url,
            layoutConfig: t.layout_config as any,
            theme: t.theme,
            isActive: t.is_active,
            createdAt: t.created_at
        }));
    } catch (e) {
        console.error("Error fetching social templates:", e);
        return [];
    }
};

export const getActiveSocialTemplates = async (): Promise<SocialTemplate[]> => {
    try {
        const { data, error } = await supabase
            .from('social_templates')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data as DatabaseSocialTemplate[]).map(t => ({
            id: t.id,
            name: t.name,
            bgUrl: t.bg_url,
            layoutConfig: t.layout_config as any,
            theme: t.theme,
            isActive: t.is_active,
            createdAt: t.created_at
        }));
    } catch (e) {
        console.error("Error fetching active social templates:", e);
        return [];
    }
};

export const saveSocialTemplate = async (template: SocialTemplate): Promise<{ success: boolean; data?: SocialTemplate; error?: string }> => {
    try {
        const payload: Partial<DatabaseSocialTemplate> = {
            id: template.id,
            name: template.name,
            bg_url: template.bgUrl,
            layout_config: template.layoutConfig as any, // Cast to any to fix TS Json error
            theme: template.theme,
            is_active: template.isActive,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('social_templates')
            .upsert(payload)
            .select()
            .single();

        if (error) throw error;

        const saved = data as DatabaseSocialTemplate;
        return {
            success: true,
            data: {
                id: saved.id,
                name: saved.name,
                bgUrl: saved.bg_url,
                layoutConfig: saved.layout_config as any,
                theme: saved.theme,
                isActive: saved.is_active,
                createdAt: saved.created_at
            }
        };
    } catch (e: any) {
        console.error("Error saving social template:", e);
        return { success: false, error: e.message };
    }
};

export const deleteSocialTemplate = async (id: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('social_templates')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Error deleting social template:", e);
        return false;
    }
};

// --- AI GENERATION ---

export const generateSocialBackground = async (prompt: string): Promise<string | null> => {
    return withRetry(async () => {
        const fullPrompt = `Genera un'immagine di sfondo artistica per una cartolina turistica social.
        Soggetto: ${prompt}.
        Stile: Evocativo, luminoso, spazio libero al centro o in basso per testo sovrapposto.
        Formato: Verticale o Quadrato.
        Nessun testo nell'immagine generata.`;

        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: fullPrompt }] },
            config: {
                imageConfig: {
                    aspectRatio: "3:4"
                }
            }
        });

        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    });
};
