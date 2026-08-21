/**
 * Contratto payload eterogeneo del bus modali (`ModalContext`).
 * Campi noti usati oggi da producer/reader; tutte le proprietà sono opzionali.
 * Nessuna index signature / discriminated union — STEP C3 Modal.
 */
import type { WizardEntryMode } from '@/components/collaboration/collaborationSharePresentation';
import type { PlanType } from '@/constants/planTypes';
import type { SharedResourceKind } from '@/domain/collaboration/sharedResource';
import type { CityDetails, PointOfInterest } from './models/City';
import type { ItineraryItem } from './models/Itinerary';
import type { SuggestionType } from './shared/primitives';

export type ModalPropsBag = {
  // POI / diary
  poi?: PointOfInterest;
  conflict?: {
    item: ItineraryItem;
    targetDayIndex: number;
    conflictingItem: ItineraryItem;
    /** Prodotto da useDiaryInteractions; non letto da FeatureModals oggi. */
    targetTime?: string;
  };
  duplicate?: {
    poi: PointOfInterest;
    existingItem: ItineraryItem;
    dayIndex: number;
    timeSlotStr: string;
  };
  items?: ItineraryItem[];
  onRemoveSingle?: (itemId: string) => void;
  onRemoveAll?: () => void;

  // Auth / resume
  mandatory?: boolean;
  message?: string;
  /** GpsErrorModal — passato da GpsContext. */
  isCritical?: boolean;
  returnTo?: string;
  returnProps?: ModalPropsBag;
  intent?: string;

  // Core
  page?: string;

  // Admin / sponsor
  sponsorType?: PlanType;
  /** Chiave usata da MainLayout / city tabs (distinta da PlanType). */
  sponsorTier?: string;

  // Feature / share / suggestion / global
  initialView?: 'details' | 'reviews';
  title?: string;
  text?: string;
  url?: string;
  cityId?: string;
  cityName?: string;
  city?: CityDetails | null;
  type?: SuggestionType | string;
  prefilledName?: string;
  existingPois?: PointOfInterest[];
  isServiceContext?: boolean;
  reason?: string;
  /** Stringa ampia: Navigation/MainLayout non si limitano a GlobalSectionView. */
  section?: string;
  tab?: string;
  id?: string;
  slug?: string;
  /** Ripristino lista Q&A Local dopo navigazione città (CARD-17). */
  qaRestore?: {
    showMyPostsOnly: boolean;
    listScrollTop: number;
  };

  // Collaboration
  entryMode?: WizardEntryMode;
  kind?: SharedResourceKind;
  resourceId?: string;
  resourceTitle?: string;
  preselectedDiaryId?: string;
  preselectedDiaryTitle?: string;
  workspaceId?: string;
  viaggioId?: string;
  viaggioTitle?: string;
  initialSection?: string;

  // Workspace / packing / MySpace
  suitcaseId?: string | null;
  itineraryId?: string | null;
  cityType?: string;
  initialAction?: 'create-suitcase' | 'create-template' | null;
  initialRoot?: string;
  /** Parse dedicato in MySpaceMinimalShell. */
  initialTripsView?: unknown;
  folderTitle?: string;
};
