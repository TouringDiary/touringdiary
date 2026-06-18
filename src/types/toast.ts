export type ToastVariant = 'success' | 'destructive' | 'neutral';

export const SUITCASE_MODIFIED_TOAST = {
  message: 'Valigia modificata',
  description: 'Le modifiche sono state salvate.',
} as const;

export const CATEGORY_ADDED_TOAST = {
  message: 'Categoria aggiunta',
  description: 'La categoria è stata aggiunta alla valigia.',
} as const;
