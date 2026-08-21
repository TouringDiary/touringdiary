import { useCallback, useEffect, useRef, useState } from 'react';
import type { AdminCityEditorTab } from '@/components/admin/adminCityEditNav';
import type { CityEditorContextType } from '@/context/CityEditorContext';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import type { CityDetails } from '../../types/index';
import { useSystemMessage } from '../useSystemMessage';

const hasAiGenerationLogs = (city: CityDetails): boolean =>
  Array.isArray(city.details.generationLogs) && city.details.generationLogs.length > 0;

const TOAST_DURATION_MS = 4000;

/**
 * Logica UI dell’Admin City Editor.
 * Riceve `CityEditorContextType` dal consumer (già dentro `CityEditorProvider`) per evitare
 * un secondo `useCityEditor()` e per passare `initialTab` (deep-link matita Patrono → Storia).
 */
export const useAdminCityEditorLogic = (
  cityEditor: CityEditorContextType,
  options?: { initialTab?: AdminCityEditorTab },
) => {
  const { city, isLoading, isSaving, isDirty, previewRequest, clearPreviewRequest, saveCity } =
    cityEditor;

  const [activeTab, setActiveTab] = useState<AdminCityEditorTab>(
    () => options?.initialTab ?? 'general',
  );
  const [showNoAiContentConfirm, setShowNoAiContentConfirm] = useState(false);
  const [pendingSaveStatus, setPendingSaveStatus] = useState<'published' | 'draft' | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const isMounted = useRef(true);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (toastTimerRef.current !== null) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, []);

  // ESC preview sullo stack LIFO (useCloseOnEscape), non un listener bubble parallelo:
  // i modal figli (History, Patron, lightbox, CityInfo, SectionPreview) restano prioritari.
  // Copre anche la preview ratings, che non registra ESC in proprio.
  const isPreviewOpen = previewRequest.type !== 'none';
  useGlobalModalEscape(isPreviewOpen, clearPreviewRequest);

  const { getText: getMsgSave } = useSystemMessage('city_save_success');
  const { getText: getMsgPublish } = useSystemMessage('city_publish_success');
  const { getText: getMsgDraft } = useSystemMessage('city_draft_success');

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    if (!isMounted.current) return;
    if (toastTimerRef.current !== null) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      toastTimerRef.current = null;
      if (isMounted.current) setToast(null);
    }, TOAST_DURATION_MS);
  }, []);

  const closeToast = useCallback(() => {
    if (toastTimerRef.current !== null) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    if (isMounted.current) setToast(null);
  }, []);

  const resolveSuccessMessage = useCallback(
    (targetStatus?: 'published' | 'draft'): string => {
      if (targetStatus === 'published') {
        return getMsgPublish().title || 'Città Pubblicata con Successo!';
      }
      if (targetStatus === 'draft') {
        return getMsgDraft().title || 'Bozza Salvata al Sicuro.';
      }
      return getMsgSave().title || 'Modifiche Salvate.';
    },
    [getMsgPublish, getMsgDraft, getMsgSave],
  );

  const executeSave = useCallback(
    async (targetStatus?: 'published' | 'draft') => {
      if (!city) {
        showToast('Impossibile salvare: dati città non disponibili.', 'error');
        return;
      }

      const successMessage = resolveSuccessMessage(targetStatus);

      try {
        const success = await saveCity(targetStatus);
        if (!isMounted.current) return;

        if (success) {
          showToast(successMessage, 'success');
        } else {
          showToast('Errore durante il salvataggio. Riprova.', 'error');
        }
      } catch (error: unknown) {
        console.error('Critical Save Error:', error);
        if (isMounted.current) {
          const message = error instanceof Error ? error.message : 'Sconosciuto';
          showToast(`Errore critico: ${message}`, 'error');
        }
      }
    },
    [city, saveCity, resolveSuccessMessage, showToast],
  );

  const handleSaveRequest = useCallback(
    async (targetStatus?: 'published' | 'draft') => {
      if (!city) {
        showToast('Impossibile salvare: dati città non disponibili.', 'error');
        return;
      }

      const requiresAiConfirm = targetStatus === 'published' && !hasAiGenerationLogs(city);

      if (requiresAiConfirm) {
        setPendingSaveStatus(targetStatus);
        setShowNoAiContentConfirm(true);
        return;
      }

      await executeSave(targetStatus);
    },
    [city, executeSave, showToast],
  );

  const confirmNoAiContentSave = useCallback(async () => {
    const status = pendingSaveStatus;
    setShowNoAiContentConfirm(false);
    setPendingSaveStatus(null);
    if (status) {
      await executeSave(status);
    }
  }, [pendingSaveStatus, executeSave]);

  const cancelNoAiContentSave = useCallback(() => {
    setShowNoAiContentConfirm(false);
    setPendingSaveStatus(null);
  }, []);

  return {
    activeTab,
    showNoAiContentConfirm,
    pendingSaveStatus,
    toast,

    city,
    isLoading,
    isSaving,
    isDirty,
    previewRequest,

    setActiveTab,

    handleSaveRequest,
    confirmNoAiContentSave,
    cancelNoAiContentSave,
    showToast,
    closeToast,
    clearPreviewRequest,
  };
};
