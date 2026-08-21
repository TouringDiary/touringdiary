import { Camera, Edit3, Loader2, Smile, Trophy } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CitySelector } from '@/components/common/CitySelector';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { CAPTION_EMOJI_CATEGORIES } from '@/constants/captionEmojis';
import { Z_MODAL_NESTED, Z_POPOVER } from '@/constants/zIndex';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import type { CommunityPhotoMode } from '@/hooks/photos/useCommunityPhotoPublish';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useMobileDiaryOverlayGeometry } from '@/hooks/ui/useMobileDiaryOverlayGeometry';
import { useVirtualKeyboardOpen } from '@/hooks/ui/useVirtualKeyboardOpen';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';

interface Props {
  isOpen: boolean;
  mode: CommunityPhotoMode;
  isAdmin: boolean;
  isUploading: boolean;
  uploadStep: string;
  previewUrl: string | null;
  selectedCityId: string;
  onCityChange: (cityId: string) => void;
  snapCaption: string;
  onCaptionChange: (value: string) => void;
  streetName: string;
  onStreetChange: (value: string) => void;
  isOfficialUpload: boolean;
  onOfficialChange: (value: boolean) => void;
  showEmojiPicker: boolean;
  onToggleEmojiPicker: () => void;
  /** Closes the emoji panel (click-outside / explicit close). */
  onCloseEmojiPicker: () => void;
  onEmojiClick: (emoji: string) => void;
  canReedit: boolean;
  onClose: () => void;
  onChangePhoto: () => void;
  onReedit: () => void;
  onPublish: () => void;
  canPublish: boolean;
}

/**
 * Step compose — unique metadata + publish screen (D-006).
 * Photo is already acquired/edited; change/reedit go to previous steps.
 */
export const CommunityPhotoPublishModal: React.FC<Props> = ({
  isOpen,
  mode,
  isAdmin,
  isUploading,
  uploadStep,
  previewUrl,
  selectedCityId,
  onCityChange,
  snapCaption,
  onCaptionChange,
  streetName,
  onStreetChange,
  isOfficialUpload,
  onOfficialChange,
  showEmojiPicker,
  onToggleEmojiPicker,
  onCloseEmojiPicker,
  onEmojiClick,
  canReedit,
  onClose,
  onChangePhoto,
  onReedit,
  onPublish,
  canPublish,
}) => {
  const isMobile = useMobileDetect();
  const isKeyboardOpen = useVirtualKeyboardOpen(isOpen && isMobile);
  // Foundation bottom sheets: with interactive-widget=resizes-content the overlay
  // shrinks and a shrink-0 footer would ride up with the keyboard, stealing space
  // from CitySelector. Keep footer in the Foundation slot only when keyboard is closed.
  const showFooter = !isMobile || !isKeyboardOpen;
  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const headerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeader);
  // foundation_modal_body = flex-1 overflow-y-auto overscroll-contain (scroll reale).
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
  const footerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalFooter);
  const footerActionsShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalFooterActions);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
  const headerIconBoxShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeaderIconBox);
  const headerIconGlyphShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeaderIconGlyph);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
  const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);
  const btnPrimaryShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.btnPrimary);

  const dialogRef = useRef<HTMLDivElement>(null);
  const emojiToggleRef = useRef<HTMLButtonElement>(null);
  const emojiPanelRef = useRef<HTMLFieldSetElement>(null);

  // Allinea il foglio al visual viewport quando la tastiera overlaya (pattern Diario esistente).
  useMobileDiaryOverlayGeometry(dialogRef, isOpen && isMobile);

  const isPromote = mode === 'promote';
  const title = isPromote ? 'Promuovi Official' : 'Pubblica Foto';
  const subtitle = isPromote
    ? 'Rivedi i dati prima della promozione'
    : 'Aggiungi luogo e didascalia';
  const primaryLabel =
    isUploading && uploadStep ? uploadStep : isPromote ? 'Salva e promuovi' : 'Pubblica Foto';

  const primaryActionButton = (
    <button
      type="button"
      onClick={onPublish}
      disabled={!canPublish}
      className={`${btnPrimaryShell} w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]`}
    >
      {isUploading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden />
          {primaryLabel}
        </>
      ) : isPromote ? (
        <>
          <Trophy className="w-5 h-5 shrink-0" aria-hidden />
          {primaryLabel}
        </>
      ) : (
        <span className="flex flex-col items-center justify-center text-center leading-tight gap-0.5">
          <span>{primaryLabel}</span>
          <span className="text-[10px] font-bold tracking-widest opacity-80">+50 XP</span>
        </span>
      )}
    </button>
  );

  useGlobalModalEscape(isOpen && !isUploading, onClose);

  // Click outside: close when pointer is neither on the 😊 toggle nor inside the panel.
  useEffect(() => {
    if (!isOpen || !showEmojiPicker) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (emojiToggleRef.current?.contains(target)) return;
      if (emojiPanelRef.current?.contains(target)) return;
      onCloseEmojiPicker();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, showEmojiPicker, onCloseEmojiPicker]);

  if (!isOpen) return null;

  // Foundation pair (overlay + container) is a mobile bottom sheet:
  // overlay `items-end` + container `rounded-t-*` / `slide-in-from-bottom` / `pb-safe`.
  // Do NOT add `!items-center` here — that creates a hybrid (floating sheet with empty space below).
  // True centered compact shell is not a live Foundation token yet (TODO overlay/shell compact).
  return createPortal(
    <div
      className={`td-modal-overlay ${overlayShell}`}
      style={{ zIndex: Z_POPOVER }}
      role="presentation"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className={`${containerShell} max-w-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 min-h-0`}
        style={{ zIndex: Z_MODAL_NESTED }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-photo-publish-title"
        aria-describedby="community-photo-publish-desc"
      >
        <CloseButton
          onClose={onClose}
          variant="primary"
          position="absolute"
          withEscape={false}
          disabled={isUploading}
          className={`${closeOffsetShell} z-local-overlay`}
        />

        <header className={headerShell}>
          <div className="flex items-center gap-3 pr-10 min-w-0">
            <div className={headerIconBoxShell}>
              {isPromote ? (
                <Trophy className={headerIconGlyphShell} aria-hidden />
              ) : (
                <Camera className={headerIconGlyphShell} aria-hidden />
              )}
            </div>
            <div className="min-w-0">
              <h3 id="community-photo-publish-title" className={`${modalTitleShell} truncate`}>
                {title}
              </h3>
              <p id="community-photo-publish-desc" className={modalSubtitleShell}>
                {subtitle}
              </p>
            </div>
          </div>
        </header>

        <div className={`${bodyShell} space-y-4 min-h-0`}>
          {previewUrl && (
            /* Flexible frame: object-contain preserves AR; no aspect-video shrink on portraits. */
            <div className="relative w-full rounded-xl overflow-hidden border border-slate-700 bg-black flex items-center justify-center min-h-[10rem] max-h-56 sm:max-h-64">
              <img
                src={previewUrl}
                className="max-w-full max-h-56 sm:max-h-64 w-auto h-auto object-contain"
                alt="Preview"
              />
              {!isPromote && (
                <div className="absolute bottom-2 right-2 flex gap-2">
                  {canReedit && (
                    <button
                      type="button"
                      onClick={onReedit}
                      className="bg-slate-800 text-white p-2 rounded-full shadow-lg border border-slate-600 hover:bg-slate-700"
                      title="Modifica / filtri"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onChangePhoto}
                    className="bg-slate-800 text-white p-2 rounded-full shadow-lg border border-slate-600 hover:bg-slate-700"
                    title="Cambia foto"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="bg-indigo-900/10 border border-indigo-500/20 p-3 rounded-xl">
            <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5 block">
              Città *
            </label>
            <CitySelector
              value={selectedCityId}
              onChange={onCityChange}
              placeholder="Seleziona città"
              required
            />
          </div>

          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            {isAdmin && (
              <div className="flex items-center justify-between gap-3 p-3 bg-slate-900 rounded-lg border border-indigo-500/30">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">
                    Tipo Contenuto
                  </p>
                  <p className="text-[10px] text-slate-400">Community o Official</p>
                </div>
                <div className="flex bg-slate-800 p-1 rounded-lg shrink-0">
                  <button
                    type="button"
                    onClick={() => onOfficialChange(false)}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${
                      !isOfficialUpload
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Community
                  </button>
                  <button
                    type="button"
                    onClick={() => onOfficialChange(true)}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${
                      isOfficialUpload
                        ? 'bg-amber-500 text-black shadow-lg'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Official
                  </button>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="fld-photos-communityphotopublishmodal-tsx-l255"
                className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block"
              >
                Via / Luogo
              </label>
              <input
                id="fld-photos-communityphotopublishmodal-tsx-l255"
                value={streetName}
                onChange={(e) => onStreetChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none"
                placeholder="Es. Piazza del Plebiscito"
              />
            </div>

            <div className="relative">
              <label
                htmlFor="fld-photos-communityphotopublishmodal-tsx-l267"
                className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block"
              >
                Didascalia *
              </label>
              <div className="relative">
                <input
                  id="fld-photos-communityphotopublishmodal-tsx-l267"
                  value={snapCaption}
                  onChange={(e) => onCaptionChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pr-10 text-white focus:border-indigo-500 outline-none"
                  placeholder="Scrivi un pensiero..."
                />
                <button
                  ref={emojiToggleRef}
                  type="button"
                  onClick={onToggleEmojiPicker}
                  className="absolute right-2 bottom-2 text-slate-400 hover:text-amber-400 transition-colors p-1"
                  aria-label="Emoji"
                  aria-expanded={showEmojiPicker}
                >
                  <Smile className="w-5 h-5" />
                </button>
                {showEmojiPicker && (
                  <fieldset
                    ref={emojiPanelRef}
                    className="absolute bottom-full right-0 mb-2 w-[min(100vw-2rem,17.5rem)] max-h-[min(14.5rem,40dvh)] overflow-y-auto custom-scrollbar bg-slate-800 border border-slate-700 rounded-xl p-2 shadow-xl space-y-3 z-local-overlay m-0 min-w-0"
                  >
                    <legend className="sr-only">Seleziona emoji</legend>
                    {CAPTION_EMOJI_CATEGORIES.map((category) => (
                      <div key={category.id}>
                        <p className="-mx-2 mb-1.5 px-2.5 py-1.5 text-[10px] font-bold text-slate-300 tracking-wide bg-slate-900/90 border-b border-slate-700/50">
                          {category.label}
                        </p>
                        <div className="grid grid-cols-5 gap-1">
                          {category.emojis.map((em) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => onEmojiClick(em)}
                              className="text-xl p-1 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-slate-700 rounded transition-colors"
                              aria-label={`Inserisci emoji ${em}`}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </fieldset>
                )}
              </div>
            </div>
          </div>

          {/* Con tastiera aperta il footer Foundation esce dal viewport: CTA primaria resta nel body scrollabile. */}
          {isMobile && isKeyboardOpen && <div className="pt-1 shrink-0">{primaryActionButton}</div>}
        </div>

        {/* Safe-area: foundation_modal_container already applies pb-safe on mobile — do not override footer padding. */}
        {/* Keyboard: footer stays out of the shrunk viewport so body/CitySelector keep usable space (Foundation gap). */}
        {showFooter && (
          <footer className={footerShell}>
            <div className={footerActionsShell}>{primaryActionButton}</div>
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
};
