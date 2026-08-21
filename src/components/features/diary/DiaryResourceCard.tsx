import { Eye, Globe, Pencil, Phone, Trash2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { SwipeToDelete } from '@/components/common/SwipeToDelete';
import { useMobileCompact } from '@/hooks/ui/useMobileCompact';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';
import { useSystemMessage } from '@/hooks/useSystemMessage';
import type { ItineraryItem, PointOfInterest } from '@/types';

interface DiaryResourceCardProps {
  item: ItineraryItem;
  onViewDetail: (poi: PointOfInterest) => void;
  /** Apre la schermata di modifica della guida/tour operator già nel Diario. */
  onEditResource: (item: ItineraryItem) => void;
  onRemove: (id: string) => void;
}

/**
 * Guida / Tour Operator nel Diario.
 * Mobile (<lg): contenuto + barra azioni a target touch 44px (altezza auto).
 * Desktop (lg+): griglia compatta 2×1.75rem come le altre righe diario.
 */
export const DiaryResourceCard: React.FC<DiaryResourceCardProps> = ({
  item,
  onViewDetail,
  onEditResource,
  onRemove,
}) => {
  const { poi } = item;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isMobile = useMobileCompact();
  const poiNameStyle = useDynamicStyles('diary_poi_name', isMobile);
  const { getText: getDeleteText } = useSystemMessage('confirm_delete_diary_item');

  const typeLabel =
    poi.resourceType === 'guide'
      ? 'Guida Turistica'
      : poi.resourceType === 'operator'
        ? 'Tour Operator'
        : 'Servizio';

  const hasWeb = !!poi.contactInfo?.website;

  const deleteMsgData = getDeleteText({
    poiName: poi.name,
    timeSlot: '',
  });

  const handleConfirmRemove = () => {
    onRemove(item.id);
    setShowDeleteConfirm(false);
  };

  const actionClass =
    'inline-flex items-center justify-center min-h-11 min-w-11 rounded transition-colors touch-manipulation hover:bg-stone-200 lg:min-h-8 lg:min-w-8';

  return (
    <SwipeToDelete
      onDelete={() => setShowDeleteConfirm(true)}
      label={`Elimina ${typeLabel.toLowerCase()}`}
      inlineLabel
      revealClassName="inset-y-[10%] rounded-xl"
    >
      <div
        id={`resource-${item.id}`}
        className="group/item relative flex w-full min-w-0 flex-col border-b border-stone-200/50 last:border-0 box-border lg:h-[3.5rem] lg:flex-row lg:overflow-hidden"
      >
        {/* Superficie principale → mini-card (BusinessView). */}
        <button
          type="button"
          onClick={() => onViewDetail(poi)}
          className="flex min-w-0 flex-1 items-stretch text-left border-0 bg-transparent p-0 cursor-pointer hover:bg-black/[0.03] transition-colors rounded-sm min-h-[3.5rem] lg:h-full"
          aria-label={`Apri scheda ${typeLabel}: ${poi.name}`}
        >
          <div className="w-14 shrink-0 relative flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-300 shadow-sm bg-stone-200">
              <ImageWithFallback
                src={poi.imageUrl}
                alt=""
                className="w-full h-full object-cover"
                category="guide"
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0 justify-center pr-1 pointer-events-none py-1 lg:py-0">
            <div className="flex items-center min-h-[1.75rem] w-full min-w-0">
              <h4
                className={`${poiNameStyle} truncate leading-none group-hover/item:text-amber-700 transition-colors`}
              >
                {poi.name}
              </h4>
            </div>
            <div className="flex items-center min-h-[1.75rem] w-full min-w-0 border-t border-stone-100/50 lg:border-t">
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wide truncate pr-2">
                {typeLabel}
              </span>
            </div>
          </div>
        </button>

        {/* Azioni: barra touch dedicata su mobile; colonna compatta su desktop. */}
        <div className="flex shrink-0 flex-row items-center justify-end gap-0.5 border-t border-stone-100/50 px-1 py-1 min-h-11 lg:min-h-0 lg:h-full lg:w-auto lg:max-w-[12rem] lg:flex-col lg:justify-between lg:border-t-0 lg:py-0 lg:pr-1">
          <div className="flex items-center justify-end gap-0.5">
            {hasWeb && (
              <a
                href={poi.contactInfo?.website ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={`${actionClass} text-stone-500 hover:text-indigo-600`}
                title="Sito Web"
                aria-label="Sito Web"
              >
                <Globe className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={() => onViewDetail(poi)}
              className={`${actionClass} text-stone-500 hover:text-stone-800`}
              title="Dettagli"
              aria-label="Dettagli"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onEditResource(item)}
              className={`${actionClass} text-stone-500 hover:text-amber-600`}
              title="Modifica"
              aria-label="Modifica"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className={`hidden lg:inline-flex ${actionClass} text-stone-400 hover:bg-red-100 hover:text-red-500`}
              title="Rimuovi"
              aria-label={`Rimuovi ${typeLabel}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {poi.contactInfo?.phone ? (
            <a
              href={`tel:${poi.contactInfo.phone}`}
              className="flex items-center gap-1 max-w-[9rem] min-h-11 px-1.5 text-[10px] font-bold text-stone-600 hover:text-emerald-600 transition-colors bg-white/50 rounded border border-stone-200 touch-manipulation lg:min-h-0 lg:h-auto lg:max-w-full lg:py-0.5"
            >
              <Phone className="w-3 h-3 shrink-0" />
              <span className="truncate">{poi.contactInfo.phone}</span>
            </a>
          ) : null}
        </div>

        <DeleteConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleConfirmRemove}
          title={deleteMsgData.title}
          message={deleteMsgData.body}
          confirmLabel={deleteMsgData.confirmLabel}
          cancelLabel={deleteMsgData.cancelLabel}
          variant="danger"
          icon={<Trash2 className="w-8 h-8 text-red-500" />}
        />
      </div>
    </SwipeToDelete>
  );
};
