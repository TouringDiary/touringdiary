import { useCityEditor } from '@/context/CityEditorContext';
import type { User } from '../../../../types/users';
import { AdminPoiManager } from '../../AdminPoiManager';

// Wrapper pulito per mantenere la struttura a tab
export const TabPois = ({ currentUser }: { currentUser?: User }) => {
  const { city } = useCityEditor();

  if (!city) return null;

  return <AdminPoiManager cityId={city.id} cityName={city.name} currentUser={currentUser} />;
};
