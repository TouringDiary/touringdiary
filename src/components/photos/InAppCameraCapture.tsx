import { Z_POPOVER, Z_MODAL_NESTED } from '@/constants/zIndex';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Loader2, SwitchCamera } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';

interface Props {
    isOpen: boolean;
    onCapture: (file: File) => void;
    onCancel: () => void;
}

type FacingMode = 'environment' | 'user';

/**
 * In-page camera (getUserMedia) — keeps the SPA tab in the foreground.
 * System `<input capture>` backgrounds the tab (camera app) and can trigger
 * Vite HMR full-reload / OS discard of the document; this avoids that path.
 */
export const InAppCameraCapture: React.FC<Props> = ({ isOpen, onCapture, onCancel }) => {
    const isMobile = useMobileDetect();
    const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
    const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
    const headerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeader);
    const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
    const footerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalFooter);
    const footerActionsShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalFooterActions);
    const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
    const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
    const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);
    const btnPrimaryShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.btnPrimary);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [facingMode, setFacingMode] = useState<FacingMode>('environment');
    const [isStarting, setIsStarting] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const stopStream = useCallback(() => {
        const stream = streamRef.current;
        if (!stream) return;
        for (const track of stream.getTracks()) {
            track.stop();
        }
        streamRef.current = null;
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const startStream = useCallback(async (facing: FacingMode) => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setError('La fotocamera in-app non è supportata su questo browser.');
            return;
        }

        setIsStarting(true);
        setError(null);
        stopStream();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    facingMode: { ideal: facing },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
            });
            streamRef.current = stream;
            const video = videoRef.current;
            if (video) {
                video.srcObject = stream;
                await video.play();
            }
        } catch (err) {
            console.error('[InAppCameraCapture] getUserMedia failed:', err);
            setError(
                'Impossibile accedere alla fotocamera. Verifica i permessi del browser e riprova.'
            );
        } finally {
            setIsStarting(false);
        }
    }, [stopStream]);

    useEffect(() => {
        if (!isOpen) {
            stopStream();
            return;
        }
        void startStream(facingMode);
        return () => {
            stopStream();
        };
    }, [isOpen, facingMode, startStream, stopStream]);

    // Release the camera while the document is backgrounded / unloaded (privacy +
    // hardware indicator). Normal in-app use stays visibilityState === 'visible',
    // so this does not interrupt preview/shutter. Resume only if we still own the
    // open session and no live stream remains (not a failed-capture retry loop).
    useEffect(() => {
        if (!isOpen) return;

        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                stopStream();
                return;
            }
            if (!streamRef.current) {
                void startStream(facingMode);
            }
        };

        const onPageHide = () => {
            stopStream();
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('pagehide', onPageHide);
        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('pagehide', onPageHide);
        };
    }, [isOpen, facingMode, startStream, stopStream]);

    useGlobalModalEscape(isOpen && !isCapturing, onCancel);

    const handleShutter = useCallback(async () => {
        const video = videoRef.current;
        if (!video || !streamRef.current || isCapturing) return;

        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) {
            setError('Anteprima non pronta. Attendi un istante e riprova.');
            return;
        }

        setIsCapturing(true);
        try {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                setError('Impossibile catturare il fotogramma.');
                return;
            }
            ctx.drawImage(video, 0, 0, w, h);

            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob(resolve, 'image/jpeg', 0.92);
            });
            if (!blob) {
                setError('Impossibile creare il file immagine.');
                return;
            }

            const file = new File([blob], `capture-${Date.now()}.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now(),
            });
            stopStream();
            onCapture(file);
        } finally {
            setIsCapturing(false);
        }
    }, [isCapturing, onCapture, stopStream]);

    const toggleFacing = () => {
        setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className={`td-modal-overlay ${overlayShell}`}
            style={{ zIndex: Z_POPOVER }}
            onClick={onCancel}
            role="presentation"
        >
            <div
                className={`${containerShell} w-full max-w-lg outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 min-h-0`}
                style={{ zIndex: Z_MODAL_NESTED }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="in-app-camera-title"
            >
                <CloseButton
                    onClose={onCancel}
                    variant="primary"
                    position="absolute"
                    withEscape={false}
                    disabled={isCapturing}
                    className={`${closeOffsetShell} z-local-overlay`}
                />

                <header className={`${headerShell} pr-12`}>
                    <div className="min-w-0">
                        <h3 id="in-app-camera-title" className={modalTitleShell}>
                            Scatta foto
                        </h3>
                        <p className={modalSubtitleShell}>
                            Fotocamera in-app — la sessione resta aperta
                        </p>
                    </div>
                </header>

                <div className={`${bodyShell} space-y-3 min-h-0`}>
                    <div className="relative w-full overflow-hidden rounded-xl border border-slate-700 bg-black aspect-[3/4] max-h-[min(60vh,28rem)]">
                        <video
                            ref={videoRef}
                            playsInline
                            muted
                            autoPlay
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                        {(isStarting || error) && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/80 p-4 text-center">
                                {isStarting && !error ? (
                                    <>
                                        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                                        <p className="text-xs font-medium text-slate-300">
                                            Avvio fotocamera…
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-red-300">{error}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <footer className={footerShell}>
                    <div className={`${footerActionsShell} gap-2`}>
                        <button
                            type="button"
                            onClick={toggleFacing}
                            disabled={isStarting || isCapturing}
                            className="shrink-0 rounded-xl border border-slate-700 bg-slate-900 p-3 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                            aria-label="Cambia fotocamera"
                            title="Cambia fotocamera"
                        >
                            <SwitchCamera className="h-5 w-5" />
                        </button>
                        {error ? (
                            <button
                                type="button"
                                onClick={() => void startStream(facingMode)}
                                disabled={isStarting || isCapturing}
                                className={`${btnPrimaryShell} flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                Riprova
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => void handleShutter()}
                                disabled={isStarting || isCapturing}
                                className={`${btnPrimaryShell} flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isCapturing ? (
                                    <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                                ) : (
                                    <Camera className="h-5 w-5 shrink-0" />
                                )}
                                Scatta
                            </button>
                        )}
                    </div>
                </footer>
            </div>
        </div>,
        document.body
    );
};
