/**
 * Caption emoji palette for Live Feed upload — tourism-oriented, categorized, no duplicates.
 */

export type CaptionEmojiCategory = {
    id: string;
    /** Section title shown above the grid (includes leading emoji). */
    label: string;
    emojis: readonly string[];
};

export const CAPTION_EMOJI_CATEGORIES: readonly CaptionEmojiCategory[] = [
    {
        id: 'emotions',
        label: '😊 Emozioni',
        emojis: ['😀', '😍', '😎', '🤩', '🥳', '😊', '😁', '❤️', '✨', '🔥', '🎉', '🙌', '👏'],
    },
    {
        id: 'travel',
        label: '🌍 Viaggio',
        emojis: ['🌍', '🗺️', '🧭', '🎒', '🧳', '📸', '📷', '🎥'],
    },
    {
        id: 'transport',
        label: '🚗 Trasporti',
        emojis: ['🚗', '🚙', '🚌', '🚆', '🚄', '🚇', '✈️', '🛫', '🛬', '⛵', '🚤', '🛳️', '⚓'],
    },
    {
        id: 'places',
        label: '🏛️ Luoghi',
        emojis: ['🏛️', '🏰', '🗼', '🗽', '⛪', '🕌', '🎡', '🎭'],
    },
    {
        id: 'nature',
        label: '🏖️ Natura',
        emojis: [
            '🏖️',
            '🏝️',
            '🌊',
            '🌅',
            '🌄',
            '🌈',
            '☀️',
            '⛅',
            '🌙',
            '⭐',
            '⛰️',
            '🏔️',
            '🌋',
            '🏞️',
            '🌳',
            '🌲',
            '🌴',
            '🌸',
            '🌺',
            '🌻',
            '🍀',
            '🍁',
        ],
    },
    {
        id: 'flavors',
        label: '🍕 Sapori',
        emojis: ['🍕', '🍝', '🍷', '🍺', '☕', '🍦', '🥐', '🥘', '🌮', '🍣'],
    },
] as const;

/** Flat unique count (for docs / sanity checks). */
export const CAPTION_EMOJI_COUNT = CAPTION_EMOJI_CATEGORIES.reduce(
    (n, cat) => n + cat.emojis.length,
    0
);
