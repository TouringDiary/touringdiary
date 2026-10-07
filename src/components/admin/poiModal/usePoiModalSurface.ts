import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';

/** Classi Foundation già definite per card e testi di sezione. Nessuno stile nuovo. */
export function usePoiModalSurface() {
  const cardSurface = useFoundationStyles(FOUNDATION_STYLE_KEYS.cardSurface);
  const sectionTitle = useFoundationStyles(FOUNDATION_STYLE_KEYS.sectionTitle);
  const sectionDescription = useFoundationStyles(FOUNDATION_STYLE_KEYS.sectionDescription);
  const cardLabel = useFoundationStyles(FOUNDATION_STYLE_KEYS.cardLabel);
  const bodyText = useFoundationStyles(FOUNDATION_STYLE_KEYS.bodyText);
  return { cardSurface, sectionTitle, sectionDescription, cardLabel, bodyText };
}
