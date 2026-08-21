export type AssetUploadTarget =
  | 'hero'
  | 'patron'
  | 'placeholder'
  | 'suitcase_placeholder'
  | 'auth'
  | 'social'
  | 'ai_bg'
  | 'favicon';

export type DeleteAssetTarget = 'auth' | 'social' | 'ai_bg' | 'favicon';

export type DeletePlaceholderTarget = {
  kind: 'category' | 'suitcase';
  catId: string;
  url: string;
};
