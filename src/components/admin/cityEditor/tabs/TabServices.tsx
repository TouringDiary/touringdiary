import { useCityEditor } from '@/context/CityEditorContext';
import type { User } from '../../../../types/users';
import { EditorInfo } from '../services/EditorInfo';

export const TabServices = ({ currentUser }: { currentUser: User }) => {
  const { city } = useCityEditor();

  if (!city) return null;

  // Regen massiva: EditorInfo / useServiceRegeneration (non più in questo wrapper).

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in relative">
      {/* The EditorInfo component handles the top regeneration bar and the grids */}
      <EditorInfo currentUser={currentUser} />
    </div>
  );
};
