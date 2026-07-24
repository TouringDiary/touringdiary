import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { PhotoSubmission, User as UserType, CitySummary } from '@/types/index';
import { uploadCommunityPhoto, updatePhotoData } from '@/services/photoService';
import { analyzeImageSafety, generateImageCaption } from '@/services/ai/aiVision';
import { getCityNameById } from '@/services/geoRegistryService';
import { PLATFORM_FEATURE_FLAG_KEYS, PLATFORM_MESSAGE_TEMPLATE_KEYS } from '@/constants/platformFeatureFlags';
import { evaluateCachedFeatureFlag } from '@/domain/platformControl/platformFlagCache';
import { resolvePlatformUserBody } from '@/services/platformControl/resolvePlatformUserMessage';
import { useFeatureFlag } from '@/context/PlatformControlContext';
import { useGps } from '@/context/GpsContext';
import { findNearestCityId } from '@/domain/geo/nearestCity';
import { joinCaptionAndStreet, splitCaptionAndStreet } from '@/domain/photos/photoCaption';
import { resolvePhotoCityId } from '@/domain/photos/photoOfficial';

/** User-facing Community publish modes. Promote is Live Feed Admin-only. */
export type CommunityPhotoMode = 'create' | 'promote';

/** UX steps — one focused surface at a time (D-009). */
export type CommunityPhotoStep = 'idle' | 'acquire' | 'capture' | 'edit' | 'compose';

export type CommunityPhotoPreview = { url: string; file: File; sessionKey: string };

export type CommunityPhotoEntryPoint = 'liveFeed' | 'gallery';

interface UseCommunityPhotoPublishParams {
    user: UserType;
    entryPoint: CommunityPhotoEntryPoint;
    /** Navigation / GPS city (Live Feed). */
    activeCityId?: string | null;
    userLocation?: { lat: number; lng: number } | null;
    cityManifest: CitySummary[];
    /** Forced city when opening from City Gallery. */
    lockedCityId?: string | null;
    onUserUpdate?: (user: UserType) => void;
    onUploaded: (snap: PhotoSubmission) => void;
    onPromoted?: () => void;
    /** Gallery may prefer success UI instead of XP reward. */
    preferSuccessUi?: boolean;
}

/**
 * Unique Community photo workflow (Live Feed + City Gallery).
 * Security gate for new uploads remains in uploadCommunityPhoto.
 * Original file is kept in-memory for the edit session only (D-004).
 */
export function useCommunityPhotoPublish({
    user,
    entryPoint,
    activeCityId = null,
    userLocation = null,
    cityManifest,
    lockedCityId = null,
    onUserUpdate,
    onUploaded,
    onPromoted,
    preferSuccessUi = false,
}: UseCommunityPhotoPublishParams) {
    const photosFlag = useFeatureFlag(PLATFORM_FEATURE_FLAG_KEYS.MODERATION_PHOTOS);
    /** Fail-closed: solo `enabled === true` consente upload (CC / evaluateFeatureFlag SoT). */
    const photosEnabled = photosFlag?.enabled === true;
    const { requestPosition } = useGps();

    const [mode, setMode] = useState<CommunityPhotoMode>('create');
    const [step, setStep] = useState<CommunityPhotoStep>('idle');
    const [promotePhotoId, setPromotePhotoId] = useState<string | null>(null);
    const [promotePreviewUrl, setPromotePreviewUrl] = useState<string | null>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadStep, setUploadStep] = useState('');
    const [uploadPreview, setUploadPreview] = useState<CommunityPhotoPreview | null>(null);
    /** Session-only original (never uploaded). */
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [snapCaption, setSnapCaption] = useState('');
    const [streetName, setStreetName] = useState('');
    const [isOfficialUpload, setIsOfficialUpload] = useState(false);
    const [selectedCityId, setSelectedCityId] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [earnedXp, setEarnedXp] = useState(0);

    const processedSessionKeys = useRef<Set<string>>(new Set());
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const allowAutoCityRef = useRef(true);

    /** Preview URLs from the editor are data: URLs today; revoke only if a blob: URL appears. */
    const revokePreviewUrl = useCallback((url: string | null | undefined) => {
        if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
    }, []);

    const isAdmin = user.role === 'admin_all' || user.role === 'admin_limited';
    const isGuest = user.role === 'guest';

    /**
     * Prefill order (create):
     * 1. lockedCityId (City Gallery)
     * 2. nearest published city from GPS (current position)
     * 3. activeCityId (navigation context fallback)
     */
    const resolvePrefillCityId = useCallback((): string => {
        if (lockedCityId) return lockedCityId;
        const nearest = findNearestCityId(userLocation, cityManifest);
        if (nearest) return nearest;
        if (activeCityId) return activeCityId;
        return '';
    }, [lockedCityId, activeCityId, userLocation, cityManifest]);

    const setSelectedCityIdFromUser = useCallback((cityId: string) => {
        allowAutoCityRef.current = false;
        setSelectedCityId(cityId);
    }, []);

    // Auto-prefill whenever GPS/manifest/navigation become available during create,
    // across idle → acquire → edit → compose (no premature lock on empty id).
    useEffect(() => {
        if (mode !== 'create') return;
        if (!allowAutoCityRef.current) return;
        if (selectedCityId) return;
        const next = resolvePrefillCityId();
        if (next) setSelectedCityId(next);
    }, [mode, step, resolvePrefillCityId, selectedCityId]);

    useEffect(() => {
        if (step !== 'idle') return;
        if (mode !== 'create') return;
        allowAutoCityRef.current = true;
    }, [step, mode]);

    /** Session field reset only — does not resolve or write selectedCityId. */
    const resetCreateSessionFields = useCallback(() => {
        setUploadPreview((prev) => {
            revokePreviewUrl(prev?.url);
            return null;
        });
        setMode('create');
        setPromotePhotoId(null);
        setPromotePreviewUrl(null);
        setOriginalFile(null);
        setSnapCaption('');
        setStreetName('');
        setShowEmojiPicker(false);
        setIsOfficialUpload(false);
        allowAutoCityRef.current = true;
        processedSessionKeys.current.clear();
    }, [revokePreviewUrl]);

    /** Applies current auto-prefill into selectedCityId (create session). */
    const applyAutoCityPrefill = useCallback(() => {
        allowAutoCityRef.current = true;
        setSelectedCityId(resolvePrefillCityId());
    }, [resolvePrefillCityId]);

    /** Clears create-session fields then applies city prefill (shared by resetWorkflow + startPublish). */
    const clearCreateSession = useCallback(() => {
        resetCreateSessionFields();
        applyAutoCityPrefill();
    }, [resetCreateSessionFields, applyAutoCityPrefill]);

    const resetWorkflow = useCallback(() => {
        clearCreateSession();
        setStep('idle');
        setIsUploading(false);
        setUploadStep('');
    }, [clearCreateSession]);

    /** Guest auth UX is the caller's job (LiveFeedTab / CityGallery → onOpenAuth). */
    const startPublish = useCallback(() => {
        if (!photosEnabled) return;
        // Fire-and-forget GPS acquire in the same user-gesture stack when position is missing.
        // Result is intentionally unused here:
        // - success → GpsContext updates userLocation → auto-prefill effect sets city
        // - failure → no modal/alert (compose stays usable; user picks city manually)
        if (!lockedCityId && !userLocation) {
            void requestPosition();
        }
        clearCreateSession();
        setIsUploading(false);
        setUploadStep('');
        setStep('acquire');
    }, [photosEnabled, lockedCityId, userLocation, requestPosition, clearCreateSession]);

    const openPromoteModal = useCallback(
        (snap: PhotoSubmission) => {
            if (!photosEnabled) return;
            if (!isAdmin || entryPoint !== 'liveFeed') return;
            const { caption, street } = splitCaptionAndStreet(snap.description);
            const cityId =
                resolvePhotoCityId(snap, cityManifest) || resolvePrefillCityId();

            setMode('promote');
            setPromotePhotoId(snap.id);
            setPromotePreviewUrl(snap.url);
            setUploadPreview((prev) => {
                revokePreviewUrl(prev?.url);
                return null;
            });
            setOriginalFile(null);
            setSnapCaption(caption);
            setStreetName(street);
            setIsOfficialUpload(true);
            setShowEmojiPicker(false);
            allowAutoCityRef.current = false;
            setSelectedCityId(cityId);
            setStep('compose');
        },
        [photosEnabled, isAdmin, entryPoint, cityManifest, resolvePrefillCityId, revokePreviewUrl]
    );

    const closeWorkflow = useCallback(() => {
        if (isUploading) return;
        resetWorkflow();
    }, [isUploading, resetWorkflow]);

    const closeAcquire = useCallback(() => {
        if (originalFile || uploadPreview) {
            setStep('compose');
            return;
        }
        resetWorkflow();
    }, [originalFile, uploadPreview, resetWorkflow]);

    /** Opens in-page getUserMedia capture (does not background the tab). */
    const triggerCamera = useCallback(() => {
        if (!photosEnabled) return;
        setStep('capture');
    }, [photosEnabled]);

    const closeCapture = useCallback(() => {
        setStep('acquire');
    }, []);

    const triggerGallery = useCallback(() => {
        if (!photosEnabled) return;
        galleryInputRef.current?.click();
    }, [photosEnabled]);

    const acceptImageFile = useCallback((file: File) => {
        if (!photosEnabled) return;
        setShowEmojiPicker(false);
        setOriginalFile(file);
        setUploadPreview((prev) => {
            revokePreviewUrl(prev?.url);
            return null;
        });
        setStep('edit');
    }, [photosEnabled, revokePreviewUrl]);

    const handleFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        acceptImageFile(file);
    }, [acceptImageFile]);

    const handleCameraCaptured = useCallback((file: File) => {
        acceptImageFile(file);
    }, [acceptImageFile]);

    const handleEditorSave = useCallback((editedFile: File, previewUrl: string) => {
        setShowEmojiPicker(false);
        // Session fingerprint (not a cryptographic hash): blocks accidental double-save in-session.
        // Deterministic from file identity only — no Date.now()/lastModified (those change every export).
        const sessionKey = `${editedFile.name}-${editedFile.size}`;
        if (processedSessionKeys.current.has(sessionKey)) {
            alert('File già processato.');
            return;
        }
        setUploadPreview((prev) => {
            revokePreviewUrl(prev?.url);
            return { url: previewUrl, file: editedFile, sessionKey };
        });
        setStep('compose');
    }, [revokePreviewUrl]);

    const handleEditorCancel = useCallback(() => {
        setShowEmojiPicker(false);
        if (uploadPreview) {
            setStep('compose');
            return;
        }
        setOriginalFile(null);
        setStep('acquire');
    }, [uploadPreview]);

    const reeditFromOriginal = useCallback(() => {
        if (mode === 'promote' || !originalFile) return;
        setShowEmojiPicker(false);
        setStep('edit');
    }, [mode, originalFile]);

    const changePhoto = useCallback(() => {
        if (mode === 'promote') return;
        setShowEmojiPicker(false);
        setStep('acquire');
    }, [mode]);

    const getPublishBlockReason = useCallback((): string | null => {
        const flagCtx = {
            userRole: user.role,
            isAuthenticated: !isGuest,
        };
        // SoT dominio foto: solo feature.moderation.photos (UI + uploadCommunityPhoto).
        const photos = evaluateCachedFeatureFlag(
            PLATFORM_FEATURE_FLAG_KEYS.MODERATION_PHOTOS,
            flagCtx
        );
        // Fail-closed: assenza valutazione o enabled !== true → blocco.
        if (photos?.enabled === true) return null;
        // Testo solo da Message Template CC (DB) / catalogo seed — nessun hardcode locale.
        return resolvePlatformUserBody(
            photos?.messageKey ?? PLATFORM_MESSAGE_TEMPLATE_KEYS.MODERATION_PHOTOS_PAUSED,
            ''
        );
    }, [user.role, isGuest]);

    const handleConfirmUpload = useCallback(async () => {
        // --- Feature flag (prima di qualsiasi ramo) — SoT CC ---
        const blockReason = getPublishBlockReason();
        if (blockReason !== null) {
            if (blockReason) alert(blockReason);
            return;
        }

        // --- Validation ---
        if (!selectedCityId) {
            alert('Seleziona la città!');
            return;
        }
        if (!snapCaption.trim()) {
            alert('Inserisci una didascalia!');
            return;
        }

        // --- Promote flow ---
        if (mode === 'promote') {
            if (!promotePhotoId || !promotePreviewUrl) return;
            setIsUploading(true);
            setUploadStep('Salvataggio...');
            try {
                let cityName = await getCityNameById(selectedCityId);
                if (!cityName) {
                    cityName =
                        cityManifest.find((c) => c.id === selectedCityId)?.name || 'Città';
                }
                const finalCaption = joinCaptionAndStreet(snapCaption, streetName);
                await updatePhotoData(promotePhotoId, {
                    description: finalCaption,
                    locationName: cityName,
                    cityId: selectedCityId,
                    isOfficial: isOfficialUpload,
                    url: promotePreviewUrl,
                });
                onPromoted?.();
                resetWorkflow();
            } catch (e: unknown) {
                console.error(e);
                const message = e instanceof Error ? e.message : 'Errore durante il salvataggio.';
                alert(message);
                setIsUploading(false);
                setUploadStep('');
            }
            return;
        }

        if (!uploadPreview) return;

        setIsUploading(true);
        let cityName = await getCityNameById(selectedCityId);
        if (!cityName) {
            cityName = cityManifest.find((c) => c.id === selectedCityId)?.name || 'Città';
        }

        try {
            // --- AI checks ---
            setUploadStep('AI: Controllo Duplicati...');
            const aiVisualFingerprint = await generateImageCaption(
                uploadPreview.url,
                `Descrivi dettagliatamente questa foto di ${cityName} per controllo duplicati.`
            );
            const isGenericStock =
                aiVisualFingerprint.toLowerCase().includes('stock') ||
                aiVisualFingerprint.toLowerCase().includes('generica');
            if (isGenericStock) {
                throw new Error("L'AI ha identificato questa come un'immagine generica o stock.");
            }

            setUploadStep('AI: Analisi Sicurezza...');
            let finalStatus: 'approved' | 'pending' = 'pending';
            if (!isAdmin) {
                const safetyResult = await analyzeImageSafety(uploadPreview.url);
                if (safetyResult.isSafe) finalStatus = 'approved';
            } else {
                finalStatus = 'approved';
            }

            // --- Upload ---
            setUploadStep('Salvataggio...');
            const finalCaption = joinCaptionAndStreet(snapCaption, streetName);

            const savedSnap = await uploadCommunityPhoto(
                uploadPreview.file,
                user.id,
                user.name,
                cityName,
                finalCaption,
                selectedCityId,
                finalStatus,
                isOfficialUpload
            );

            if (!savedSnap) throw new Error('Salvataggio fallito');

            processedSessionKeys.current.add(uploadPreview.sessionKey);
            onUploaded(savedSnap);

            // --- Reward / Success UI ---
            if (preferSuccessUi || entryPoint === 'gallery') {
                setShowSuccessModal(true);
                resetWorkflow();
            } else if (!isGuest) {
                const xpAmount = 50;
                if (onUserUpdate) {
                    onUserUpdate({ ...user, xp: (user.xp || 0) + xpAmount });
                }
                setEarnedXp(xpAmount);
                setShowRewardModal(true);
                resetWorkflow();
            } else {
                resetWorkflow();
                alert('Foto caricata! Accedi per guadagnare XP.');
            }
        } catch (e: unknown) {
            console.error(e);
            const message = e instanceof Error ? e.message : 'Errore durante il caricamento.';
            alert(message);
            setIsUploading(false);
            setUploadStep('');
        }
    }, [
        mode,
        promotePhotoId,
        promotePreviewUrl,
        uploadPreview,
        selectedCityId,
        snapCaption,
        streetName,
        getPublishBlockReason,
        isAdmin,
        isOfficialUpload,
        user,
        isGuest,
        onUserUpdate,
        onUploaded,
        onPromoted,
        resetWorkflow,
        cityManifest,
        preferSuccessUi,
        entryPoint,
    ]);

    const handleEmojiClick = useCallback((emoji: string) => {
        setSnapCaption((prev) => prev + emoji);
        setShowEmojiPicker(false);
    }, []);

    const previewUrl = mode === 'promote' ? promotePreviewUrl : uploadPreview?.url ?? null;

    const canPublish = useMemo(() => {
        if (!photosEnabled) return false;
        if (isUploading) return false;
        if (!selectedCityId || !snapCaption.trim()) return false;
        if (mode === 'promote') return Boolean(promotePhotoId && promotePreviewUrl);
        return Boolean(uploadPreview);
    }, [
        photosEnabled,
        isUploading,
        selectedCityId,
        snapCaption,
        mode,
        promotePhotoId,
        promotePreviewUrl,
        uploadPreview,
    ]);

    return {
        mode,
        step,
        entryPoint,
        photosEnabled,
        isAdmin,
        isGuest,
        startPublish,
        openPromoteModal,
        closeWorkflow,
        closeAcquire,
        isUploading,
        uploadStep,
        previewUrl,
        originalFile,
        snapCaption,
        setSnapCaption,
        streetName,
        setStreetName,
        isOfficialUpload,
        setIsOfficialUpload,
        selectedCityId,
        setSelectedCityId: setSelectedCityIdFromUser,
        showEmojiPicker,
        setShowEmojiPicker,
        galleryInputRef,
        triggerCamera,
        closeCapture,
        triggerGallery,
        handleFileSelected,
        handleCameraCaptured,
        handleEditorSave,
        handleEditorCancel,
        reeditFromOriginal,
        changePhoto,
        handleConfirmUpload,
        handleEmojiClick,
        showRewardModal,
        setShowRewardModal,
        showSuccessModal,
        setShowSuccessModal,
        earnedXp,
        canPublish,
        /** @deprecated alias for Live Feed toolbar */
        openUploadModal: startPublish,
        isComposeOpen: step === 'compose',
        isAcquireOpen: step === 'acquire',
        isCaptureOpen: step === 'capture',
        isEditOpen: step === 'edit',
    };
}

/** @deprecated Use CommunityPhotoMode */
export type LiveFeedUploadMode = CommunityPhotoMode;
/** @deprecated Use CommunityPhotoPreview */
export type LiveFeedUploadPreview = CommunityPhotoPreview;
