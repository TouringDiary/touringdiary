import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { GLOBAL_ASSET_DEFAULTS } from '@/components/admin/adminHeaderManager/constants';
import type {
  AssetUploadTarget,
  DeleteAssetTarget,
  DeletePlaceholderTarget,
} from '@/components/admin/adminHeaderManager/types';
import { useConfig } from '@/context/ConfigContext';
import { isPlatformPlaceholderUrl } from '@/domain/placeholders/platformPlaceholderRegistry';
import { deleteAdminAssetByUrl, uploadPublicMedia } from '../../services/mediaService';
import {
  getPlatformPlaceholderRegistryAsync,
  retirePlatformPlaceholderUrls,
  SETTINGS_KEYS,
} from '../../services/settingsService';
import { compressImage, dataURLtoFile } from '../../utils/common';

/** Legge una stringa URL/valore da configs senza cast. */
function readConfigString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** URL precedente per retirement/cleanup: stringa non vuota oppure null se assente. */
function readPreviousConfigUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const useAdminHeaderManager = () => {
  const { configs, isLoading, updateSetting, updateMultipleSettings } = useConfig();

  // STATE
  const [patronImage, setPatronImage] = useState('');
  const [placeholders, setPlaceholders] = useState<Record<string, string>>({});
  const [suitcasePlaceholders, setSuitcasePlaceholders] = useState<Record<string, string>>({});
  const [famousPersonCategoryPlaceholders, setFamousPersonCategoryPlaceholders] = useState<
    Record<string, string>
  >({});
  const [famousPersonGeneralPlaceholder, setFamousPersonGeneralPlaceholder] = useState('');
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
  const famousPersonPlaceholderInputRef = useRef<HTMLInputElement>(null);
  const famousPersonGeneralInputRef = useRef<HTMLInputElement>(null);
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
      const fph = configs[SETTINGS_KEYS.FAMOUS_PERSON_CATEGORY_PLACEHOLDERS];
      const fpg = configs[SETTINGS_KEYS.FAMOUS_PERSON_GENERAL_PLACEHOLDER];

      setPreviewImage(heroImage);
      setPatronImage(patron);
      setAuthBg(auth);
      setSocialBg(social);
      setAiBg(ai);
      setFaviconImage(typeof favicon === 'string' ? favicon : '');
      setPlaceholders(asUrlMap(ph));
      setSuitcasePlaceholders(asUrlMap(sph));
      setFamousPersonCategoryPlaceholders(asUrlMap(fph));
      setFamousPersonGeneralPlaceholder(typeof fpg === 'string' ? fpg : '');
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

  const filterRetirablePlaceholderUrls = async (
    urls: ReadonlyArray<string | null | undefined>,
  ): Promise<string[]> => {
    const registry = await getPlatformPlaceholderRegistryAsync();
    const out: string[] = [];
    for (const url of urls) {
      if (typeof url !== 'string' || !url.trim()) continue;
      if (isPlatformPlaceholderUrl(url, registry)) out.push(url);
    }
    return out;
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
    await updateSetting(params.settingKey, params.value);

    if (params.retireUrls?.length) {
      try {
        const toRetire = await filterRetirablePlaceholderUrls(params.retireUrls);
        if (toRetire.length > 0) {
          await retirePlatformPlaceholderUrls(toRetire);
        }
      } catch (err) {
        console.warn('[AssetGlobali] Retirement registry failed after SoT update:', err);
      }
    }

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
    if (target === 'famous_person_placeholder' && phCat) {
      await handleSaveFamousPersonCategoryPlaceholder(phCat, publicUrl);
      return 'persisted';
    }
    if (target === 'famous_person_general') {
      await handleSaveFamousPersonGeneralPlaceholder(publicUrl);
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
      if (famousPersonPlaceholderInputRef.current)
        famousPersonPlaceholderInputRef.current.value = '';
      if (famousPersonGeneralInputRef.current) famousPersonGeneralInputRef.current.value = '';
      if (authInputRef.current) authInputRef.current.value = '';
      if (socialInputRef.current) socialInputRef.current.value = '';
      if (aiBgInputRef.current) aiBgInputRef.current.value = '';
      if (faviconInputRef.current) faviconInputRef.current.value = '';
    }
  };

  const handleSaveHero = async () => {
    setIsSavingHero(true);
    try {
      const valToSave = previewImage === GLOBAL_ASSET_DEFAULTS.hero ? '' : previewImage;
      const previousStored = readConfigString(configs[SETTINGS_KEYS.HERO_IMAGE]);
      const replaced = Boolean(previousStored && previousStored !== valToSave);
      await commitAssetSettingChange({
        settingKey: SETTINGS_KEYS.HERO_IMAGE,
        value: valToSave,
        retireUrls: replaced ? [previousStored] : undefined,
        // Asset Globali: sostituzione admin_assets → cleanup best-effort (come favicon/extra).
        cleanupUrl: replaced ? previousStored : undefined,
        successMessage: 'Header salvato!',
      });
      setHeroNote('');
    } catch (err) {
      console.error(err);
      showToast('Errore salvataggio header.', 'error');
    } finally {
      setIsSavingHero(false);
    }
  };

  const handleRemoveHeroRequest = () => setShowDeleteHeroConfirm(true);

  const confirmRemoveHero = async () => {
    const previousUrl = readPreviousConfigUrl(configs[SETTINGS_KEYS.HERO_IMAGE]);
    try {
      await commitAssetSettingChange({
        settingKey: SETTINGS_KEYS.HERO_IMAGE,
        value: '',
        retireUrls: [previousUrl],
        cleanupUrl: previousUrl,
        successMessage: 'Hero eliminato da Asset Globali.',
      });
      setPreviewImage(GLOBAL_ASSET_DEFAULTS.hero);
    } catch (err) {
      console.error(err);
      showToast('Errore eliminazione hero.', 'error');
    } finally {
      setShowDeleteHeroConfirm(false);
    }
  };

  const handleRemoveAssetRequest = (target: DeleteAssetTarget) => setDeleteAssetTarget(target);

  const confirmRemoveAsset = async () => {
    if (!deleteAssetTarget) return;

    let settingKey = SETTINGS_KEYS.AI_CONSULTANT_BG;
    if (deleteAssetTarget === 'auth') {
      settingKey = SETTINGS_KEYS.AUTH_BACKGROUND_IMAGE;
    } else if (deleteAssetTarget === 'social') {
      settingKey = SETTINGS_KEYS.SOCIAL_CANVAS_BG;
    } else if (deleteAssetTarget === 'favicon') {
      settingKey = SETTINGS_KEYS.FAVICON_IMAGE;
    }
    const previousUrl = readPreviousConfigUrl(configs[settingKey]);

    try {
      await commitAssetSettingChange({
        settingKey,
        value: '',
        retireUrls: [previousUrl],
        cleanupUrl: previousUrl,
        successMessage: 'Asset eliminato da Asset Globali.',
      });
      if (deleteAssetTarget === 'auth') {
        setAuthBg(GLOBAL_ASSET_DEFAULTS.auth_bg);
      } else if (deleteAssetTarget === 'social') {
        setSocialBg(GLOBAL_ASSET_DEFAULTS.social_bg);
      } else if (deleteAssetTarget === 'favicon') {
        setFaviconImage('');
      } else {
        setAiBg('');
      }
    } catch (err) {
      console.error(err);
      showToast('Errore eliminazione asset.', 'error');
    } finally {
      setDeleteAssetTarget(null);
    }
  };

  const handleSaveFavicon = async () => {
    setIsSavingFavicon(true);
    try {
      const valToSave = faviconImage || '';
      const previousStored = readConfigString(configs[SETTINGS_KEYS.FAVICON_IMAGE]);
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
    try {
      const valToSave = patronImage.trim() ? patronImage : '';
      const previousStored = readConfigString(configs[SETTINGS_KEYS.DEFAULT_PATRON_IMAGE]);
      const replaced = Boolean(previousStored && previousStored !== valToSave);
      await commitAssetSettingChange({
        settingKey: SETTINGS_KEYS.DEFAULT_PATRON_IMAGE,
        value: valToSave,
        retireUrls: replaced ? [previousStored] : undefined,
        // Coerente con favicon/hero: sostituzione admin_assets → cleanup Storage best-effort.
        cleanupUrl: replaced ? previousStored : undefined,
        successMessage: 'Patrono master aggiornato!',
      });
    } catch (err) {
      console.error(err);
      showToast('Errore salvataggio patrono master.', 'error');
    } finally {
      setIsSavingPatron(false);
    }
  };

  const handleSaveExtraAssets = async () => {
    setIsSavingExtra(true);
    try {
      const newAssetData = {
        auth_background_image: authBg === GLOBAL_ASSET_DEFAULTS.auth_bg ? '' : authBg,
        social_canvas_bg: socialBg === GLOBAL_ASSET_DEFAULTS.social_bg ? '' : socialBg,
        ai_consultant_bg: aiBg,
      };

      const prevAuth = readPreviousConfigUrl(configs[SETTINGS_KEYS.AUTH_BACKGROUND_IMAGE]);
      const prevSocial = readPreviousConfigUrl(configs[SETTINGS_KEYS.SOCIAL_CANVAS_BG]);
      const prevAi = readPreviousConfigUrl(configs[SETTINGS_KEYS.AI_CONSULTANT_BG]);
      const replacedAuth =
        prevAuth && prevAuth !== newAssetData.auth_background_image ? prevAuth : null;
      const replacedSocial =
        prevSocial && prevSocial !== newAssetData.social_canvas_bg ? prevSocial : null;
      const replacedAi = prevAi && prevAi !== newAssetData.ai_consultant_bg ? prevAi : null;

      await updateMultipleSettings([
        { key: SETTINGS_KEYS.AUTH_BACKGROUND_IMAGE, value: newAssetData.auth_background_image },
        { key: SETTINGS_KEYS.SOCIAL_CANVAS_BG, value: newAssetData.social_canvas_bg },
        { key: SETTINGS_KEYS.AI_CONSULTANT_BG, value: newAssetData.ai_consultant_bg },
      ]);

      try {
        const toRetire = await filterRetirablePlaceholderUrls([
          replacedAuth,
          replacedSocial,
          replacedAi,
        ]);
        if (toRetire.length > 0) {
          await retirePlatformPlaceholderUrls(toRetire);
        }
      } catch (err) {
        console.warn('[AssetGlobali] Retirement registry failed after extra assets save:', err);
      }

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
    const previousUrl = readPreviousConfigUrl(configs[SETTINGS_KEYS.HERO_IMAGE]);
    try {
      await commitAssetSettingChange({
        settingKey: SETTINGS_KEYS.HERO_IMAGE,
        value: '',
        retireUrls: [previousUrl],
        cleanupUrl: previousUrl,
        successMessage: 'Reset completato.',
      });
      setPreviewImage(GLOBAL_ASSET_DEFAULTS.hero);
    } catch (err) {
      console.error(err);
      showToast('Errore reset hero.', 'error');
    } finally {
      setShowResetConfirm(false);
    }
  };

  const handleResetPatronGlobal = async () => {
    const previousUrl = readPreviousConfigUrl(configs[SETTINGS_KEYS.DEFAULT_PATRON_IMAGE]);
    try {
      await commitAssetSettingChange({
        settingKey: SETTINGS_KEYS.DEFAULT_PATRON_IMAGE,
        value: '',
        retireUrls: [previousUrl],
        cleanupUrl: previousUrl,
        successMessage: 'Patrono eliminato da Asset Globali.',
      });
      setPatronImage('');
    } catch (err) {
      console.error(err);
      showToast('Errore eliminazione patrono master.', 'error');
    }
  };

  const handleSavePlaceholder = async (cat: string, url: string) => {
    const previousUrl = placeholders[cat];
    const updated = { ...placeholders, [cat]: url };
    try {
      await commitAssetSettingChange({
        settingKey: SETTINGS_KEYS.CATEGORY_PLACEHOLDERS,
        value: updated,
        retireUrls: previousUrl && previousUrl !== url ? [previousUrl] : undefined,
        cleanupUrl: previousUrl && previousUrl !== url ? previousUrl : undefined,
        successMessage: `Placeholder per ${cat} aggiornato!`,
      });
      setPlaceholders(updated);
    } catch (err) {
      console.error(err);
      showToast(`Errore salvataggio placeholder ${cat}.`, 'error');
    }
  };

  const handleSaveSuitcasePlaceholder = async (cat: string, url: string) => {
    const previousUrl = suitcasePlaceholders[cat];
    const updated = { ...suitcasePlaceholders, [cat]: url };
    try {
      await commitAssetSettingChange({
        settingKey: SETTINGS_KEYS.SUITCASE_PLACEHOLDERS,
        value: updated,
        retireUrls: previousUrl && previousUrl !== url ? [previousUrl] : undefined,
        cleanupUrl: previousUrl && previousUrl !== url ? previousUrl : null,
        successMessage: `Placeholder valigia per ${cat} aggiornato!`,
      });
      setSuitcasePlaceholders(updated);
    } catch (err) {
      console.error(err);
      showToast(`Errore salvataggio placeholder valigia ${cat}.`, 'error');
    }
  };

  const handleSaveFamousPersonCategoryPlaceholder = async (cat: string, url: string) => {
    const previousUrl = famousPersonCategoryPlaceholders[cat];
    const updated = { ...famousPersonCategoryPlaceholders, [cat]: url };
    try {
      await commitAssetSettingChange({
        settingKey: SETTINGS_KEYS.FAMOUS_PERSON_CATEGORY_PLACEHOLDERS,
        value: updated,
        retireUrls: previousUrl && previousUrl !== url ? [previousUrl] : undefined,
        cleanupUrl: previousUrl && previousUrl !== url ? previousUrl : undefined,
        successMessage: `Placeholder Personaggio (${cat}) aggiornato!`,
      });
      setFamousPersonCategoryPlaceholders(updated);
    } catch (err) {
      console.error(err);
      showToast(`Errore salvataggio placeholder Personaggio (${cat}).`, 'error');
    }
  };

  const handleSaveFamousPersonGeneralPlaceholder = async (url: string) => {
    const previousUrl = famousPersonGeneralPlaceholder.trim() || null;
    try {
      await commitAssetSettingChange({
        settingKey: SETTINGS_KEYS.FAMOUS_PERSON_GENERAL_PLACEHOLDER,
        value: url,
        retireUrls: previousUrl && previousUrl !== url ? [previousUrl] : undefined,
        cleanupUrl: previousUrl && previousUrl !== url ? previousUrl : undefined,
        successMessage: 'Placeholder generale Personaggi Famosi aggiornato!',
      });
      setFamousPersonGeneralPlaceholder(url);
    } catch (err) {
      console.error(err);
      showToast('Errore salvataggio placeholder generale Personaggi.', 'error');
    }
  };

  const requestDeletePlaceholder = (kind: 'category' | 'suitcase', catId: string) => {
    const url = kind === 'category' ? placeholders[catId] : suitcasePlaceholders[catId];
    if (!url) return;
    setDeletePlaceholderTarget({ kind, catId, url });
  };

  const requestDeleteFamousPersonPlaceholder = (
    kind: 'famous_person_category' | 'famous_person_general',
    catId: string,
  ) => {
    const url =
      kind === 'famous_person_general'
        ? famousPersonGeneralPlaceholder
        : famousPersonCategoryPlaceholders[catId];
    if (!url) return;
    setDeletePlaceholderTarget({ kind, catId, url });
  };

  const confirmDeletePlaceholder = async () => {
    if (!deletePlaceholderTarget) return;
    const { kind, catId, url } = deletePlaceholderTarget;

    try {
      if (kind === 'category') {
        const updated = { ...placeholders };
        delete updated[catId];
        await commitAssetSettingChange({
          settingKey: SETTINGS_KEYS.CATEGORY_PLACEHOLDERS,
          value: updated,
          retireUrls: [url],
          cleanupUrl: url,
          successMessage: `Placeholder "${catId}" eliminato.`,
        });
        setPlaceholders(updated);
      } else if (kind === 'suitcase') {
        const updated = { ...suitcasePlaceholders };
        delete updated[catId];
        await commitAssetSettingChange({
          settingKey: SETTINGS_KEYS.SUITCASE_PLACEHOLDERS,
          value: updated,
          retireUrls: [url],
          cleanupUrl: url,
          successMessage: `Placeholder "${catId}" eliminato.`,
        });
        setSuitcasePlaceholders(updated);
      } else if (kind === 'famous_person_category') {
        const updated = { ...famousPersonCategoryPlaceholders };
        delete updated[catId];
        await commitAssetSettingChange({
          settingKey: SETTINGS_KEYS.FAMOUS_PERSON_CATEGORY_PLACEHOLDERS,
          value: updated,
          retireUrls: [url],
          cleanupUrl: url,
          successMessage: `Placeholder Personaggio "${catId}" eliminato.`,
        });
        setFamousPersonCategoryPlaceholders(updated);
      } else if (kind === 'famous_person_general') {
        await commitAssetSettingChange({
          settingKey: SETTINGS_KEYS.FAMOUS_PERSON_GENERAL_PLACEHOLDER,
          value: '',
          retireUrls: [url],
          cleanupUrl: url,
          successMessage: 'Placeholder generale Personaggi Famosi eliminato.',
        });
        setFamousPersonGeneralPlaceholder('');
      }
    } catch (err) {
      console.error(err);
      showToast('Errore eliminazione placeholder.', 'error');
    } finally {
      setDeletePlaceholderTarget(null);
    }
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
    } else if (editTarget === 'famous_person_placeholder' && editPlaceholderCat) {
      await handleSaveFamousPersonCategoryPlaceholder(editPlaceholderCat, newImageUrl);
    } else if (editTarget === 'famous_person_general') {
      await handleSaveFamousPersonGeneralPlaceholder(newImageUrl);
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

  const triggerFamousPersonPlaceholderUpload = (cat: string) => {
    setEditPlaceholderCat(cat);
    if (famousPersonPlaceholderInputRef.current) famousPersonPlaceholderInputRef.current.value = '';
    famousPersonPlaceholderInputRef.current?.click();
  };

  const triggerFamousPersonGeneralUpload = () => {
    if (famousPersonGeneralInputRef.current) famousPersonGeneralInputRef.current.value = '';
    famousPersonGeneralInputRef.current?.click();
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
    famousPersonCategoryPlaceholders,
    famousPersonGeneralPlaceholder,
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
    famousPersonPlaceholderInputRef,
    famousPersonGeneralInputRef,
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
    requestDeleteFamousPersonPlaceholder,
    confirmDeletePlaceholder,
    openEditor,
    handleEditorSave,
    triggerPlaceholderUpload,
    triggerSuitcasePlaceholderUpload,
    triggerFamousPersonPlaceholderUpload,
    triggerFamousPersonGeneralUpload,
    handleSafeArtSuccess,
  };
};
