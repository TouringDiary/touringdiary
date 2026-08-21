import { getPendingPatronPhotoReportCount } from './patronPhotoReportService';
import { getPendingPatronPhotoSuggestionCount } from './patronPhotoSuggestionService';

export const getPendingPatronSaintAdminCount = async (): Promise<number> => {
  const [suggestions, reports] = await Promise.all([
    getPendingPatronPhotoSuggestionCount(),
    getPendingPatronPhotoReportCount(),
  ]);
  return suggestions + reports;
};

export { getPendingPatronPhotoReportCount, getPendingPatronPhotoSuggestionCount };
