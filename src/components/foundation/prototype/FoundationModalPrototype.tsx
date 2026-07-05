import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Layers, ListChecks, Plus, Sparkles } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import {
  FOUNDATION_BODY_CLASS,
  FOUNDATION_BODY_TEXT_FALLBACK,
  FOUNDATION_CARD_CLASS,
  FOUNDATION_CONTAINER_CLASS,
  FOUNDATION_FOOTER_CLASS,
  FOUNDATION_FOOTER_PRIMARY_BTN,
  FOUNDATION_FOOTER_SECONDARY_BTN,
  FOUNDATION_HEADER_CLASS,
  FOUNDATION_HEADER_ICON_BOX_CLASS,
  FOUNDATION_HELPER_TEXT_FALLBACK,
  FOUNDATION_OVERLAY_CLASS,
  FOUNDATION_SECTION_DESCRIPTION_CLASS,
  FOUNDATION_SECTION_HEADING_FALLBACK,
  FOUNDATION_SECTION_HEADING_ICON_CLASS,
  FOUNDATION_MODAL_SUBTITLE_CLASS,
  FOUNDATION_TITLE_FALLBACK_DESKTOP,
  FOUNDATION_TITLE_FALLBACK_MOBILE,
  FOUNDATION_SELECTABLE_TITLE_FALLBACK,
} from './foundationModalPrototypeStyles';
import { FoundationSelectableCard } from './FoundationSelectableCard';

export interface FoundationModalPrototypeProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Mockup tecnico temporaneo dello standard Foundation modali.
 * Riferimento grafico: AiSuggestionsModal (Valigia).
 * Non collegata a flussi di produzione — solo valutazione visiva.
 */
export const FoundationModalPrototype: React.FC<FoundationModalPrototypeProps> = ({
  isOpen,
  onClose,
}) => {
  const isMobile = useMobileDetect();
  const titleStyle = useDynamicStyles('suitcase_title', isMobile);
  const sectionHeadingStyle = useDynamicStyles('suitcase_label_caps', isMobile);
  const helperStyle = useDynamicStyles('suitcase_text_support', isMobile);
  const bodyTextStyle = useDynamicStyles('suitcase_item_primary', isMobile);
  const modeCardTitleStyle = useDynamicStyles('suitcase_mode_card_title', isMobile);
  const [selectedCard, setSelectedCard] = useState<'review' | 'direct'>('review');

  const titleFallback = isMobile
    ? FOUNDATION_TITLE_FALLBACK_MOBILE
    : FOUNDATION_TITLE_FALLBACK_DESKTOP;

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDismiss = () => {
    onClose();
  };

  return createPortal(
    <div
      className={FOUNDATION_OVERLAY_CLASS}
      style={{ zIndex: Z_OVERLAY }}
      onClick={handleDismiss}
      data-foundation-modal-prototype=""
    >
      <div
        className={FOUNDATION_CONTAINER_CLASS}
        style={{ zIndex: Z_MODAL }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="foundation-modal-prototype-title"
        aria-describedby="foundation-modal-prototype-subtitle"
      >
        <CloseButton
          onClose={handleDismiss}
          variant="primary"
          position="absolute"
          className="top-6 right-8"
        />

        <header className={FOUNDATION_HEADER_CLASS}>
          <div className="flex items-center gap-4 pr-12 min-w-0">
            <div className={FOUNDATION_HEADER_ICON_BOX_CLASS}>
              <Sparkles className="w-6 h-6" aria-hidden />
            </div>
            <div className="min-w-0">
              <h3
                id="foundation-modal-prototype-title"
                className={`${titleStyle || titleFallback} mb-1`}
              >
                Anteprima Foundation
              </h3>
              <p
                id="foundation-modal-prototype-subtitle"
                className={FOUNDATION_MODAL_SUBTITLE_CLASS}
              >
                Mockup tecnico dello standard modale TouringDiary
              </p>
            </div>
          </div>
        </header>

        <div className={FOUNDATION_BODY_CLASS}>
          <section className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Layers className={FOUNDATION_SECTION_HEADING_ICON_CLASS} aria-hidden />
                <h4 className={sectionHeadingStyle || FOUNDATION_SECTION_HEADING_FALLBACK}>
                  Titolo e testo
                </h4>
              </div>
              <p className={FOUNDATION_SECTION_DESCRIPTION_CLASS}>
                Gerarchia tipografica del contenuto principale.
              </p>
              <div className={FOUNDATION_CARD_CLASS}>
                <p className={`${bodyTextStyle || FOUNDATION_BODY_TEXT_FALLBACK} font-normal`}>
                  Questo paragrafo rappresenta il testo descrittivo standard: tono informativo,
                  colore slate chiaro, interlinea rilassata e larghezza contenuta nel corpo
                  modale.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Layers className={FOUNDATION_SECTION_HEADING_ICON_CLASS} aria-hidden />
                <h4 className={sectionHeadingStyle || FOUNDATION_SECTION_HEADING_FALLBACK}>
                  Spaziature e contenitore
                </h4>
              </div>
              <p className={FOUNDATION_SECTION_DESCRIPTION_CLASS}>
                Padding interno, raggi, bordo e ombra del pannello.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={FOUNDATION_CARD_CLASS}>
                  <p className={`${helperStyle || FOUNDATION_HELPER_TEXT_FALLBACK} mb-1 font-normal`}>
                    Card secondaria
                  </p>
                  <p className={`${bodyTextStyle || FOUNDATION_BODY_TEXT_FALLBACK} font-normal`}>
                    Blocco di esempio per valutare margini e densità del layout.
                  </p>
                </div>
                <div className={FOUNDATION_CARD_CLASS}>
                  <p className={`${helperStyle || FOUNDATION_HELPER_TEXT_FALLBACK} mb-1 font-normal`}>
                    Card secondaria
                  </p>
                  <p className={`${bodyTextStyle || FOUNDATION_BODY_TEXT_FALLBACK} font-normal`}>
                    Stesso trattamento visivo su più elementi affiancati.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Layers className={FOUNDATION_SECTION_HEADING_ICON_CLASS} aria-hidden />
                <h4 className={sectionHeadingStyle || FOUNDATION_SECTION_HEADING_FALLBACK}>
                  Card selezionabili
                </h4>
              </div>
              <p className={FOUNDATION_SECTION_DESCRIPTION_CLASS}>
                Standard Foundation per opzioni selezionabili — riferimento card &quot;Valuta ed
                inserisci&quot;.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                <FoundationSelectableCard
                  isSelected={selectedCard === 'review'}
                  onSelect={() => setSelectedCard('review')}
                  icon={ListChecks}
                  title="Valuta ed inserisci"
                  description="Potrai valutare gli oggetti suggeriti prima di inserirli in valigia."
                  titleClassName={modeCardTitleStyle || FOUNDATION_SELECTABLE_TITLE_FALLBACK}
                  descriptionClassName={helperStyle || FOUNDATION_HELPER_TEXT_FALLBACK}
                />
                <FoundationSelectableCard
                  isSelected={selectedCard === 'direct'}
                  onSelect={() => setSelectedCard('direct')}
                  icon={Plus}
                  title="Inserimento diretto"
                  description="I suggerimenti verranno inseriti immediatamente in valigia."
                  titleClassName={modeCardTitleStyle || FOUNDATION_SELECTABLE_TITLE_FALLBACK}
                  descriptionClassName={helperStyle || FOUNDATION_HELPER_TEXT_FALLBACK}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Layers className={FOUNDATION_SECTION_HEADING_ICON_CLASS} aria-hidden />
                <h4 className={sectionHeadingStyle || FOUNDATION_SECTION_HEADING_FALLBACK}>
                  Icona e azioni
                </h4>
              </div>
              <p className={FOUNDATION_SECTION_DESCRIPTION_CLASS}>
                Icona header, pulsante X e footer con CTA primaria e secondaria.
              </p>
            </div>
          </section>
        </div>

        <footer className={FOUNDATION_FOOTER_CLASS}>
          <div className="flex items-center justify-center gap-3 w-full">
            <button type="button" onClick={handleDismiss} className={FOUNDATION_FOOTER_SECONDARY_BTN}>
              Annulla
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className={FOUNDATION_FOOTER_PRIMARY_BTN}
            >
              <Sparkles className="w-4 h-4" aria-hidden />
              Conferma
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
};
