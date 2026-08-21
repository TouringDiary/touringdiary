import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { GLOBAL_ASSET_DEFAULTS } from '@/components/admin/adminHeaderManager/constants';
import type {
  AssetUploadTarget,
  DeleteAssetTarget,
  DeletePlaceholderTarget,
} from '@/components/admin/adminHeaderManager/types';
import { useConfig } from '@/context/ConfigContext';
import { deleteAdminAssetByUrl, uploadPublicMedia } from '../../services/mediaService';
import { retirePlatformPlaceholderUrls, SETTINGS_KEYS } from '../../services/settingsService';
import { compressImage, dataURLtoFile } from '../../utils/common';

export const useAdminHeaderManager = () => {
  const { configs, isLoading, updateSetting } = useConfig();

  // STATE
  const [currentImage, setCurrentImage] = useState(GLOBAL_ASSET_DEFAULTS.hero);
  const [patronImage, setPatronImage] = useState('');
  const [placeholders, setPlaceholders] = useState<Record<string, string>>({});
  const [suitcasePlaceholders, setSuitcasePlaceholders] = useState<Record<string, string>>({});
  const [authBg, setAuthBg] = useState(GLOBAL_ASSET_DEFAULTS.auth_bg);
  const [socialBg, setSocialBg] = useState(GLOBAL_ASSET_DEFAULTS.social_bg);
  const [aiBg, setAiBg] = useState(GLOBAL_ASSET_DEFAULTS.ai_box);
  const [faviconImage, setFaviconImage] = useState('');

  // UI State
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [mode, setMode] = useState<'upload' | 'generate'>('upload');
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [isSavingPatron, setIsSavingPatron] = useState(false);
  const [isSavingExtra, setIsSavingExtra] = useState(false);
  const [isSavingFavicon, setIsSavingFavicon] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [imageToEdit, setImageToEdit] = useState('');
  const [editTarget, setEditTarget] = useState<AssetUploadTarget>('hero');
  const [editPlaceholderCat, setEditPlaceholderCat] = useState<string>('');
  const [heroNote, setHeroNote] = useState('');

  // DELETE CONFIRMATION STATE
  const [showDeleteHeroConfirm, setShowDeleteHeroConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [deleteAssetTarget, setDeleteAssetTarget] = useState<DeleteAssetTarget | null>(null);
  const [deletePlaceholderTarget, setDeletePlaceholderTarget] =
    useState<DeletePlaceholderTarget | null>(null);

  // REFS
  const fileInputRef = useRef<HTMLInputElement>(null);
  const patronInputRef = useRef<HTMLInputElement>(null);
  const placeholderInputRef = useRef<HTMLInputElement>(null);
  const suitcasePlaceholderInputRef = useRef<HTMLInputElement>(null);
  const authInputRef = useRef<HTMLInputElement>(null);
  const socialInputRef = useRef<HTMLInputElement>(null);
  const aiBgInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Initial Load from ConfigContext
  useEffect(() => {
    if (!isLoading && configs) {
      const asUrl = (value: unknown, fallback: string) =>
        typeof value === 'string' ? value : fallback;
      const asUrlMap = (value: unknown): Record<string, string> => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
        const out: Record<string, string> = {};
        for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
          if (typeof entry === 'string') out[key] = entry;
        }
        return out;
      };

      const heroImage = asUrl(configs[SETTINGS_KEYS.HERO_IMAGE], GLOBAL_ASSET_DEFAULTS.hero);
      const patron = asUrl(configs[SETTINGS_KEYS.DEFAULT_PATRON_IMAGE], '');
      const auth = asUrl(
        configs[SETTINGS_KEYS.AUTH_BACKGROUND_IMAGE],
        GLOBAL_ASSET_DEFAULTS.auth_bg,
      );
      const social = asUrl(
        configs[SETTINGS_KEYS.SOCIAL_CANVAS_BG],
        GLOBAL_ASSET_DEFAULTS.social_bg,
      );
      const aiRaw = configs[SETTINGS_KEYS.AI_CONSULTANT_BG];
      const ai = typeof aiRaw === 'string' ? aiRaw : GLOBAL_ASSET_DEFAULTS.ai_box;
      const favicon = configs[SETTINGS_KEYS.FAVICON_IMAGE];
      const ph = configs[SETTINGS_KEYS.CATEGORY_PLACEHOLDERS];
      const sph = configs[SETTINGS_KEYS.SUITCASE_PLACEHOLDERS];

      setCurrentImage(heroImage);
      setPreviewImage(heroImage);
      setPatronImage(patron);
      setAuthBg(auth);
      setSocialBg(social);
      setAiBg(ai);
      setFaviconImage(typeof favicon === 'string' ? favicon : '');
      setPlaceholders(asUrlMap(ph));
      setSuitcasePlaceholders(asUrlMap(sph));
    }
  }, [configs, isLoading]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), type === 'error' ? 8000 : 4000);
  };

  /**
   * Storage cleanup is best-effort after settings SoT update.
   * Failure must not roll back settings; returns whether cleanup failed.
   */
  const cleanupAdminAssetStorage = async (
    url: string | null | undefined,
  ): Promise<'skipped' | 'ok' | 'failed'> => {
    if (!url?.trim()) return 'skipped';
    // Only files we own under admin_assets; external/default URLs are skipped.
    if (!url.includes('/admin_assets/')) return 'skipped';

    try {
      const removed = await deleteAdminAssetByUrl(url);
      if (removed) return 'ok';
      console.warn('[AssetGlobali] Settings aggiornate; cleanup Storage non riuscito:', url);
      return 'failed';
    } catch (err) {
      console.warn('[AssetGlobali] Settings aggiornate; errore cleanup Storage:', url, err);
      return 'failed';
    }
  };

  const toastSettingsUpdated = (successMessage: string, cleanup: 'skipped' | 'ok' | 'failed') => {
    if (cleanup === 'failed') {
      showToast(
        `${successMessage} Cleanup Storage non completato (file eventualmente ancora in admin_assets).`,
        'error',
      );
      return;
    }
    showToast(successMessage, 'success');
  };

  /**
   * Shared Asset Globali persist path.
   * ConfigContext.updateSetting already refreshes SoT — no extra refreshConfig.
   */
  const commitAssetSettingChange = async (params: {
    settingKey: string;
    value: unknown;
    retireUrls?: ReadonlyArray<string | null | undefined>;
    cleanupUrl?: string | null | undefined;
    successMessage: string;
  }): Promise<void> => {
    if (params.retireUrls?.length) {
      await retirePlatformPlaceholderUrls(params.retireUrls);
    }
    await updateSetting(params.settingKey, params.value);
    const cleanup = await cleanupAdminAssetStorage(params.cleanupUrl);
    toastSettingsUpdated(params.successMessage, cleanup);
  };

  /** Updates local state (or persists placeholders). Returns whether a save toast already fired. */
  const applyUploadedImage = async (
    target: AssetUploadTarget,
    publicUrl: string,
    phCat?: string,
  ): Promise<'local' | 'persisted'> => {
    if (target === 'hero') {
      setPreviewImage(publicUrl);
      return 'local';
    }
    if (target === 'patron') {
      setPatronImage(publicUrl);
      return 'local';
    }
    if (target === 'auth') {
      setAuthBg(publicUrl);
      return 'local';
    }
    if (target === 'social') {
      setSocialBg(publicUrl);
      return 'local';
    }
    if (target === 'ai_bg') {
      setAiBg(publicUrl);
      return 'local';
    }
    if (target === 'favicon') {
      setFaviconImage(publicUrl);
      return 'local';
    }
    if (target === 'placeholder' && phCat) {
      await handleSavePlaceholder(phCat, publicUrl);
      return 'persisted';
    }
    if (target === 'suitcase_placeholder' && phCat) {
      await handleSaveSuitcasePlaceholder(phCat, publicUrl);
      return 'persisted';
    }
    return 'local';
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: AssetUploadTarget,
    phCat?: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImage(file);
      const compressedFile = dataURLtoFile(compressedBase64, file.name);
      const publicUrl = await uploadPublicMedia(compressedFile, 'admin_assets');

      if (publicUrl) {
        const applyMode = await applyUploadedImage(target, publicUrl, phCat);
        // Placeholder save already toasts — avoid duplicate "Immagine caricata"
        if (applyMode === 'local') {
          showToast('Immagine caricata con successo!', 'success');
        }
      } else {
        showToast('Errore upload cloud.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Errore elaborazione file.', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (patronInputRef.current) patronInputRef.current.value = '';
      if (placeholderInputRef.current) placeholderInputRef.current.value = '';
      if (suitcasePlaceholderInputRef.current) suitcasePlaceholderInputRef.current.value = '';
      if (authInputRef.current) authInputRef.current.value = '';
      if (socialInputRef.current) socialInputRef.current.value = '';
      if (aiBgInputRef.current) aiBgInputRef.current.value = '';
      if (faviconInputRef.current) faviconInputRef.current.value = '';
    }
  };

  const handleSaveHero = async () => {
    setIsSavingHero(true);
    const valToSave = previewImage === GLOBAL_ASSET_DEFAULTS.hero ? '' : previewImage;
    const previousStored = configs[SETTINGS_KEYS.HERO_IMAGE] as string | null | undefined;
    await commitAssetSettingChange({
      settingKey: SETTINGS_KEYS.HERO_IMAGE,
      value: valToSave,
      retireUrls: previousStored && previousStored !== valToSave ? [previousStored] : undefined,
      successMessage: 'Header salvato!',
    });
    setCurrentImage(previewImage || GLOBAL_ASSET_DEFAULTS.hero);
    setHeroNote('');
    setIsSavingHero(false);
  };

  const handleRemoveHeroRequest = () => setShowDeleteHeroConfirm(true);

  const confirmRemoveHero = async () => {
    const previousUrl =
      previewImage && previewImage !== GLOBAL_ASSET_DEFAULTS.hero ? previewImage : null;
    setPreviewImage(GLOBAL_ASSET_DEFAULTS.hero);
    setCurrentImage(GLOBAL_ASSET_DEFAULTS.hero);
    await commitAssetSettingChange({
      settingKey: SETTINGS_KEYS.HERO_IMAGE,
      value: '',
      retireUrls: [previousUrl],
      cleanupUrl: previousUrl,
      successMessage: 'Hero eliminato da Asset Globali.',
    });
    setShowDeleteHeroConfirm(false);
  };

  const handleRemoveAssetRequest = (target: DeleteAssetTarget) => setDeleteAssetTarget(target);

  const confirmRemoveAsset = async () => {
    if (!deleteAssetTarget) return;

    let previousUrl: string | null = null;
    let settingKey = SETTINGS_KEYS.AI_CONSULTANT_BG;
    if (deleteAssetTarget === 'auth') {
      previousUrl = authBg !== GLOBAL_ASSET_DEFAULTS.auth_bg ? authBg : null;
      setAuthBg(GLOBAL_ASSET_DEFAULTS.auth_bg);
      settingKey = SETTINGS_KEYS.AUTH_BACKGROUND_IMAGE;
    } else if (deleteAssetTarget === 'social') {
      previousUrl = socialBg !== GLOBAL_ASSET_DEFAULTS.social_bg ? socialBg : null;
      setSocialBg(GLOBAL_ASSET_DEFAULTS.social_bg);
      settingKey = SETTINGS_KEYS.SOCIAL_CANVAS_BG;
    } else if (deleteAssetTarget === 'favicon') {
      previousUrl = faviconImage || null;
      setFaviconImage('');
      settingKey = SETTINGS_KEYS.FAVICON_IMAGE;
    } else {
      previousUrl = aiBg || null;
      setAiBg('');
      settingKey = SETTINGS_KEYS.AI_CONSULTANT_BG;
    }

    await commitAssetSettingChange({
      settingKey,
      value: '',
      retireUrls: [previousUrl],
      cleanupUrl: previousUrl,
      successMessage: 'Asset eliminato da Asset Globali.',
    });
    setDeleteAssetTarget(null);
  };

  const handleSaveFavicon = async () => {
    setIsSavingFavicon(true);
    try {
      const valToSave = faviconImage || '';
      const previousStored = configs[SETTINGS_KEYS.FAVICON_IMAGE] as string | null | undefined;
      const replaced = Boolean(previousStored && previousStored !== valToSave);
      await commitAssetSettingChange({
        settingKey: SETTINGS_KEYS.FAVICON_IMAGE,
        value: valToSave,
        retireUrls: replaced ? [previousStored] : undefined,
        cleanupUrl: replaced ? previousStored : undefined,
        successMessage: 'Favicon salvato. Esposto su /favicon.ico.',
      });
    } catch (err) {
      console.error(err);
      showToast('Errore salvataggio favicon.', 'error');
    } finally {
      setIsSavingFavicon(false);
    }
  };

  const handleSavePatron = async () => {
    setIsSavingPatron(true);
    const valToSave = patronImage.trim() ? patronImage : '';
    const previousStored = configs[SETTINGS_KEYS.DEFAULT_PATRON_IMAGE] as string | null | undefined;
    await commitAssetSettingChange({
      settingKey: SETTINGS_KEYS.DEFAULT_PATRON_IMAGE,
      value: valToSave,
      retireUrls: previousStored && previousStored !== valToSave ? [previousStored] : undefined,
      successMessage: 'Patrono master aggiornato!',
    });
    setIsSavingPatron(false);
  };

  const handleSaveExtraAssets = async () => {
    setIsSavingExtra(true);
    try {
      const newAssetData = {
        auth_background_image: authBg === GLOBAL_ASSET_DEFAULTS.auth_bg ? '' : authBg,
        social_canvas_bg: socialBg === GLOBAL_ASSET_DEFAULTS.social_bg ? '' : socialBg,
        ai_consultant_bg: aiBg,
      };

      const prevAuth = configs[SETTINGS_KEYS.AUTH_BACKGROUND_IMAGE] as string | null | undefined;
      const prevSocial = configs[SETTINGS_KEYS.SOCIAL_CANVAS_BG] as string | null | undefined;
      const prevAi = configs[SETTINGS_KEYS.AI_CONSULTANT_BG] as string | null | undefined;
      const replacedAuth =
        prevAuth && prevAuth !== newAssetData.auth_background_image ? prevAuth : null;
      const replacedSocial =
        prevSocial && prevSocial !== newAssetData.social_canvas_bg ? prevSocial : null;
      const replacedAi = prevAi && prevAi !== newAssetData.ai_consultant_bg ? prevAi : null;

      await retirePlatformPlaceholderUrls([replacedAuth, replacedSocial, replacedAi]);

      // updateSetting already refreshes ConfigContext SoT per call
      await Promise.all([
        updateSetting(SETTINGS_KEYS.AUTH_BACKGROUND_IMAGE, newAssetData.auth_background_image),
        updateSetting(SETTINGS_KEYS.SOCIAL_CANVAS_BG, newAssetData.social_canvas_bg),
        updateSetting(SETTINGS_KEYS.AI_CONSULTANT_BG, newAssetData.ai_consultant_bg),
      ]);

      // Best-effort storage cleanup for replaced assets (no rollback, same as commitAssetSettingChange)
      await Promise.all([
        cleanupAdminAssetStorage(replacedAuth),
        cleanupAdminAssetStorage(replacedSocial),
        cleanupAdminAssetStorage(replacedAi),
      ]);

      showToast("Asset funzionali salvati in 'design_system'!", 'success');
    } catch (err) {
      console.error('Errore durante il salvataggio degli asset:', err);
      showToast('Errore imprevisto durante il salvataggio.', 'error');
    } finally {
      setIsSavingExtra(false);
    }
  };

  const handleReset = () => setShowResetConfirm(true);

  const executeReset = async () => {
    const previousUrl =
      currentImage && currentImage !== GLOBAL_ASSET_DEFAULTS.hero ? currentImage : null;
    setPreviewImage(GLOBAL_ASSET_DEFAULTS.hero);
    setCurrentImage(GLOBAL_ASSET_DEFAULTS.hero);
    await commitAssetSettingChange({
      settingKey: SETTINGS_KEYS.HERO_IMAGE,
      value: '',
      retireUrls: [previousUrl],
      cleanupUrl: previousUrl,
      successMessage: 'Reset completato.',
    });
    setShowResetConfirm(false);
  };

  const handleResetPatronGlobal = async () => {
    const previousUrl = patronImage.trim() ? patronImage : null;
    setPatronImage('');
    await commitAssetSettingChange({
      settingKey: SETTINGS_KEYS.DEFAULT_PATRON_IMAGE,
      value: '',
      retireUrls: [previousUrl],
      cleanupUrl: previousUrl,
      successMessage: 'Patrono eliminato da Asset Globali.',
    });
  };

  const handleSavePlaceholder = async (cat: string, url: string) => {
    const previousUrl = placeholders[cat];
    const updated = { ...placeholders, [cat]: url };
    setPlaceholders(updated);
    await commitAssetSettingChange({
      settingKey: SETTINGS_KEYS.CATEGORY_PLACEHOLDERS,
      value: updated,
      retireUrls: previousUrl && previousUrl !== url ? [previousUrl] : undefined,
      cleanupUrl: previousUrl && previousUrl !== url ? previousUrl : undefined,
      successMessage: `Placeholder per ${cat} aggiornato!`,
    });
  };

  const handleSaveSuitcasePlaceholder = async (cat: string, url: string) => {
    const previousUrl = suitcasePlaceholders[cat];
    const updated = { ...suitcasePlaceholders, [cat]: url };
    setSuitcasePlaceholders(updated);
    await commitAssetSettingChange({
      settingKey: SETTINGS_KEYS.SUITCASE_PLACEHOLDERS,
      value: updated,
      retireUrls: previousUrl && previousUrl !== url ? [previousUrl] : undefined,
      cleanupUrl: previousUrl && previousUrl !== url ? previousUrl : null,
      successMessage: `Placeholder valigia per ${cat} aggiornato!`,
    });
  };

  const requestDeletePlaceholder = (kind: 'category' | 'suitcase', catId: string) => {
    const url = kind === 'category' ? placeholders[catId] : suitcasePlaceholders[catId];
    if (!url) return;
    setDeletePlaceholderTarget({ kind, catId, url });
  };

  const confirmDeletePlaceholder = async () => {
    if (!deletePlaceholderTarget) return;
    const { kind, catId, url } = deletePlaceholderTarget;

    if (kind === 'category') {
      const updated = { ...placeholders };
      delete updated[catId];
      setPlaceholders(updated);
      await commitAssetSettingChange({
        settingKey: SETTINGS_KEYS.CATEGORY_PLACEHOLDERS,
        value: updated,
        retireUrls: [url],
        cleanupUrl: url,
        successMessage: `Placeholder "${catId}" eliminato.`,
      });
    } else {
      const updated = { ...suitcasePlaceholders };
      delete updated[catId];
      setSuitcasePlaceholders(updated);
      await commitAssetSettingChange({
        settingKey: SETTINGS_KEYS.SUITCASE_PLACEHOLDERS,
        value: updated,
        retireUrls: [url],
        cleanupUrl: url,
        successMessage: `Placeholder "${catId}" eliminato.`,
      });
    }

    setDeletePlaceholderTarget(null);
  };

  const openEditor = (url: string, target: AssetUploadTarget, cat?: string) => {
    if (!url) return;
    setImageToEdit(url);
    setEditTarget(target);
    if (cat) setEditPlaceholderCat(cat);
    setInspectorOpen(true);
  };

  const handleEditorSave = async (data: { image: string }) => {
    const newImageUrl = data.image;
    if (editTarget === 'hero') {
      setPreviewImage(newImageUrl);
      setHeroNote('Immagine modificata pronta per il salvataggio.');
    } else if (editTarget === 'patron') {
      setPatronImage(newImageUrl);
    } else if (editTarget === 'auth') {
      setAuthBg(newImageUrl);
    } else if (editTarget === 'social') {
      setSocialBg(newImageUrl);
    } else if (editTarget === 'ai_bg') {
      setAiBg(newImageUrl);
    } else if (editTarget === 'favicon') {
      setFaviconImage(newImageUrl);
    } else if (editTarget === 'placeholder' && editPlaceholderCat) {
      await handleSavePlaceholder(editPlaceholderCat, newImageUrl);
    } else if (editTarget === 'suitcase_placeholder' && editPlaceholderCat) {
      await handleSaveSuitcasePlaceholder(editPlaceholderCat, newImageUrl);
    }
    setInspectorOpen(false);
  };

  const triggerPlaceholderUpload = (cat: string) => {
    setEditPlaceholderCat(cat);
    if (placeholderInputRef.current) placeholderInputRef.current.value = '';
    placeholderInputRef.current?.click();
  };

  const triggerSuitcasePlaceholderUpload = (cat: string) => {
    setEditPlaceholderCat(cat);
    if (suitcasePlaceholderInputRef.current) suitcasePlaceholderInputRef.current.value = '';
    suitcasePlaceholderInputRef.current?.click();
  };

  const handleSafeArtSuccess = (url: string) => {
    setPreviewImage(url);
    setMode('upload');
    showToast('Safe-Art Generata con successo!', 'success');
  };

  return {
    previewImage,
    mode,
    setMode,
    isSavingHero,
    patronImage,
    isSavingPatron,
    placeholders,
    suitcasePlaceholders,
    authBg,
    socialBg,
    aiBg,
    faviconImage,
    isSavingExtra,
    isSavingFavicon,
    toast,
    setToast,
    inspectorOpen,
    setInspectorOpen,
    imageToEdit,
    editTarget,
    editPlaceholderCat,
    heroNote,
    showDeleteHeroConfirm,
    setShowDeleteHeroConfirm,
    showResetConfirm,
    setShowResetConfirm,
    deleteAssetTarget,
    setDeleteAssetTarget,
    deletePlaceholderTarget,
    setDeletePlaceholderTarget,
    fileInputRef,
    patronInputRef,
    placeholderInputRef,
    suitcasePlaceholderInputRef,
    authInputRef,
    socialInputRef,
    aiBgInputRef,
    faviconInputRef,
    showToast,
    handleFileUpload,
    handleSaveHero,
    handleRemoveHeroRequest,
    confirmRemoveHero,
    handleRemoveAssetRequest,
    confirmRemoveAsset,
    handleSaveFavicon,
    handleSavePatron,
    handleSaveExtraAssets,
    handleReset,
    executeReset,
    handleResetPatronGlobal,
    requestDeletePlaceholder,
    confirmDeletePlaceholder,
    openEditor,
    handleEditorSave,
    triggerPlaceholderUpload,
    triggerSuitcasePlaceholderUpload,
    handleSafeArtSuccess,
  };
};
