/**
 * Named photo filter presets for Community photo editor (session-only; applied on canvas).
 */

export type PhotoFilterId =
    | 'original'
    | 'vivid'
    | 'warm'
    | 'cool'
    | 'dramatic'
    | 'soft'
    | 'mono'
    | 'sunset';

export type PhotoFilterAdjustments = {
    brightness: number;
    contrast: number;
    saturation: number;
};

export type PhotoFilterPreset = {
    id: PhotoFilterId;
    label: string;
    adjustments: PhotoFilterAdjustments;
};

export const PHOTO_FILTER_PRESETS: readonly PhotoFilterPreset[] = [
    { id: 'original', label: 'Originale', adjustments: { brightness: 100, contrast: 100, saturation: 100 } },
    { id: 'vivid', label: 'Vivace', adjustments: { brightness: 105, contrast: 115, saturation: 130 } },
    { id: 'warm', label: 'Caldo', adjustments: { brightness: 108, contrast: 105, saturation: 120 } },
    { id: 'cool', label: 'Freddo', adjustments: { brightness: 102, contrast: 108, saturation: 90 } },
    { id: 'dramatic', label: 'Drammatico', adjustments: { brightness: 95, contrast: 130, saturation: 110 } },
    { id: 'soft', label: 'Morbido', adjustments: { brightness: 110, contrast: 90, saturation: 95 } },
    { id: 'mono', label: 'B&N', adjustments: { brightness: 105, contrast: 115, saturation: 0 } },
    { id: 'sunset', label: 'Tramonto', adjustments: { brightness: 112, contrast: 110, saturation: 125 } },
] as const;

export function getPhotoFilterPreset(id: PhotoFilterId): PhotoFilterPreset {
    return PHOTO_FILTER_PRESETS.find((p) => p.id === id) ?? PHOTO_FILTER_PRESETS[0];
}
