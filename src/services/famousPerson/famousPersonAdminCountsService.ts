import { getPendingFamousPersonPhotoReportCount } from './famousPersonPhotoReportService';
import { getPendingFamousPersonPhotoSuggestionCount } from './famousPersonPhotoSuggestionService';
import { getPendingFamousPersonSuggestionCount } from './famousPersonSuggestionService';

export const getPendingFamousPeopleAdminCount = async (): Promise<number> => {
  const [personSuggestions, photoSuggestions, reports] = await Promise.all([
    getPendingFamousPersonSuggestionCount(),
    getPendingFamousPersonPhotoSuggestionCount(),
    getPendingFamousPersonPhotoReportCount(),
  ]);
  return personSuggestions + photoSuggestions + reports;
};

export {
  getPendingFamousPersonPhotoReportCount,
  getPendingFamousPersonPhotoSuggestionCount,
  getPendingFamousPersonSuggestionCount,
};
