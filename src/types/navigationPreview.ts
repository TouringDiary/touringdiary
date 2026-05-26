import type { ReactNode } from 'react';
import type { CitySummary } from './models/City';

/** Category descriptor for Esplora section preview (NavigationContext-owned). */
export interface NavigationPreviewCategory {
  id: string;
  label: string;
  color: string;
  badge: string;
}

export interface NavigationPreviewState {
  isOpen: boolean;
  title: string;
  cities: CitySummary[];
  selectedId: string | null;
  icon?: ReactNode;
  categories?: NavigationPreviewCategory[];
}

export const CLOSED_NAVIGATION_PREVIEW: NavigationPreviewState = {
  isOpen: false,
  title: '',
  cities: [],
  selectedId: null,
  categories: undefined,
};
