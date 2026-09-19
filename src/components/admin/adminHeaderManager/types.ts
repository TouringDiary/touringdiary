export type AssetUploadTarget =
  | 'hero'
  | 'patron'
  | 'placeholder'
  | 'suitcase_placeholder'
  | 'famous_person_placeholder'
  | 'famous_person_general'
  | 'auth'
  | 'social'
  | 'ai_bg'
  | 'favicon';

export type DeleteAssetTarget = 'auth' | 'social' | 'ai_bg' | 'favicon';

export type DeletePlaceholderTarget = {
  kind: 'category' | 'suitcase' | 'famous_person_category' | 'famous_person_general';
  catId: string;
  url: string;
};
