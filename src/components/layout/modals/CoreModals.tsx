import { CheckCircle, Trophy } from 'lucide-react';

import React from 'react';
import { RewardsFreezeNotice } from '@/components/gamification/RewardsFreezeNotice';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useAreRewardsEnabled } from '@/hooks/useAreRewardsEnabled';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import type { ModalPropsBag } from '@/types/modalProps';
import type { User } from '@/types/users';
import { StaticPage } from '../StaticPage';

// Lazy Imports per Core
const AuthModal = React.lazy(() =>
  import('../../modals/AuthModal').then((module) => ({ default: module.AuthModal })),
);
const SetUsernameModal = React.lazy(() =>
  import('../../modals/SetUsernameModal').then((module) => ({ default: module.SetUsernameModal })),
);
const GpsAlertModal = React.lazy(() =>
  import('../../modals/GpsAlertModal').then((module) => ({ default: module.GpsAlertModal })),
);
const GpsErrorModal = React.lazy(() =>
  import('../../modals/GpsErrorModal').then((module) => ({ default: module.GpsErrorModal })),
);

interface CoreModalsProps {
  activeModal: string | null;
  /** Stesso bus payload di ModalManager / FeatureModals (`intent` condiviso). */
  modalProps: ModalPropsBag;
  closeModal: () => void;
  onConfirmGps: () => void;
  onAuthSuccess: (user: User) => void;
  onCloseAuth: () => void;
  user: User;
  onUsernameComplete: (user: User) => void;
}

/**
 * Conferma post-submit recensione (insert | update).
 * Montata solo quando `activeModal === 'reviewSuccess'` così Foundation/rewards
 * non sottoscrivono CoreModals per le altre chiavi (auth/gps/…).
 *
 * ESC: CloseButton → useCloseOnEscape (LIFO). Nessun listener locale.
 * Focus: nessun trap/autofocus in ModalManager; TAB tra CloseButton e CTA.
 * Backdrop: pattern A1 (sibling button), non onClick sull'overlay.
 */
function ReviewSuccessModal({ intent, onClose }: { intent?: string; onClose: () => void }) {
  const rewardsEnabled = useAreRewardsEnabled();
  const isMobile = useMobileDetect();
  const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
  const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
  const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
  const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
  const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
  const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);

  const isUpdate = intent === 'update';

  return (
    <div
      className={`td-modal-overlay ${overlayShell} !items-center animate-in fade-in`}
      style={{ zIndex: Z_OVERLAY }}
      role="presentation"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
        onClick={onClose}
      />
      <div
        className={`${containerShell} max-w-sm border-emerald-500/50 animate-in zoom-in-95`}
        style={{ zIndex: Z_MODAL }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-success-title"
        aria-describedby="review-success-desc"
      >
        <CloseButton
          onClose={onClose}
          variant="primary"
          position="absolute"
          className={`${closeOffsetShell} z-local-overlay`}
        />
        <div className={`${bodyShell} flex flex-col items-center text-center gap-4 min-h-0`}>
          {isUpdate ? (
            <>
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">
                <CheckCircle className="w-8 h-8 text-emerald-500" aria-hidden />
              </div>
              <div className="w-full min-w-0">
                <h3 id="review-success-title" className={`${modalTitleShell} mb-2`}>
                  Recensione aggiornata
                </h3>
                <p id="review-success-desc" className={`${modalSubtitleShell} leading-relaxed`}>
                  Le modifiche sono state salvate.
                </p>
              </div>
              <div className="w-full">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95 text-xs uppercase tracking-wide"
                >
                  OK
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)] shrink-0">
                <Trophy className="w-10 h-10 text-emerald-500 animate-bounce" aria-hidden />
              </div>
              <div className="w-full min-w-0">
                <h3 id="review-success-title" className={`${modalTitleShell} mb-2`}>
                  Recensione Inviata!
                </h3>
                <p
                  id="review-success-desc"
                  className={`${modalSubtitleShell} leading-relaxed mb-0`}
                >
                  Grazie per il tuo contributo prezioso.
                  <strong className="text-white block mt-2 text-lg font-bold">+20 XP</strong>
                  <span className="text-xs font-normal opacity-70">Aggiunti al tuo profilo</span>
                </p>
              </div>
              {!rewardsEnabled && (
                <div className="w-full">
                  <RewardsFreezeNotice variant="compact" />
                </div>
              )}
              <div className="w-full">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-2xl uppercase tracking-widest text-xs shadow-lg transition-all active:scale-95"
                >
                  Fantastico!
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const CoreModals = ({
  activeModal,
  modalProps,
  closeModal,
  onConfirmGps,
  onAuthSuccess,
  onCloseAuth,
  user,
  onUsernameComplete,
}: CoreModalsProps) => {
  if (!activeModal) return null;

  return (
    <>
      {activeModal === 'auth' && (
        <AuthModal isOpen={true} onClose={onCloseAuth} onAuthSuccess={onAuthSuccess} />
      )}

      {activeModal === 'setUsername' && user.role !== 'guest' && (
        <SetUsernameModal
          isOpen={true}
          user={user}
          mandatory={modalProps.mandatory !== false}
          onClose={closeModal}
          onComplete={onUsernameComplete}
        />
      )}

      {activeModal === 'gpsAlert' && (
        <GpsAlertModal isOpen={true} onClose={closeModal} onConfirm={onConfirmGps} />
      )}

      {activeModal === 'gpsError' && (
        <GpsErrorModal
          isOpen={true}
          onClose={closeModal}
          error={modalProps.message || 'Segnale GPS assente'}
          onRetry={onConfirmGps}
        />
      )}

      {activeModal === 'reviewSuccess' && (
        <ReviewSuccessModal intent={modalProps.intent} onClose={closeModal} />
      )}

      {activeModal === 'static' && modalProps.page && (
        <StaticPage type={modalProps.page} onBack={closeModal} />
      )}
    </>
  );
};
