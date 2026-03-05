
export type SectionTab = 'diary' | 'home' | 'city' | 'admin' | 'components' | 'planner' | 'roadbook' | 'guide' | 'filters' | 'journey';

export interface DesignRule {
    id: string;
    section: string;
    element_name: string;
    component_key?: string;
    
    // Style Props
    font_family: string;
    text_size?: string;
    font_weight?: string;
    text_transform?: string;
    tracking?: string;
    color_class?: string;
    effect_class?: string;
    
    css_class?: string; 
    preview_text: string;
    notes?: string;
}

export const FONTS = [
    { label: 'Playfair (Display)', value: 'font-display' },
    { label: 'Lato (Sans)', value: 'font-sans' },
    { label: 'Caveat (Handwriting)', value: 'font-handwriting' },
    { label: 'Mono (Code)', value: 'font-mono' }
];

export const SIZES = [
    { label: '8px (Ultra Tiny)', value: 'text-[8px]' },
    { label: '9px (Tiny)', value: 'text-[9px]' },
    { label: '10px (Micro)', value: 'text-[10px]' },
    { label: '11px (Mini)', value: 'text-[11px]' },
    { label: '12px (XS - Extra Small)', value: 'text-xs' },
    { label: '14px (SM - Small)', value: 'text-sm' },
    { label: '16px (Base - Standard)', value: 'text-base' },
    { label: '18px (LG - Large)', value: 'text-lg' },
    { label: '20px (XL)', value: 'text-xl' },
    { label: '24px (2XL)', value: 'text-2xl' },
    { label: '30px (3XL)', value: 'text-3xl' },
    { label: '36px (4XL)', value: 'text-4xl' },
    { label: '48px (5XL)', value: 'text-5xl' }
];

export const WEIGHTS = [
    { label: 'Thin (100)', value: 'font-thin' },
    { label: 'Light (300)', value: 'font-light' },
    { label: 'Normal (400)', value: 'font-normal' },
    { label: 'Medium (500)', value: 'font-medium' },
    { label: 'Bold (700)', value: 'font-bold' },
    { label: 'Black (900)', value: 'font-black' }
];

export const TRACKING = [
    { label: 'Tighter (-0.05em)', value: 'tracking-tighter' },
    { label: 'Tight (-0.025em)', value: 'tracking-tight' },
    { label: 'Normal (0)', value: 'tracking-normal' },
    { label: 'Wide (0.025em)', value: 'tracking-wide' },
    { label: 'Wider (0.05em)', value: 'tracking-wider' },
    { label: 'Widest (0.1em)', value: 'tracking-widest' },
    { label: 'Ultra (0.25em)', value: 'tracking-[0.25em]' }
];

export const COLORS = [
    { label: 'White', value: 'text-white' },
    { label: 'Slate 200', value: 'text-slate-200' },
    { label: 'Slate 300', value: 'text-slate-300' },
    { label: 'Slate 400', value: 'text-slate-400' },
    { label: 'Slate 500', value: 'text-slate-500' },
    { label: 'Stone 600', value: 'text-stone-600' },
    { label: 'Stone 800', value: 'text-stone-800' },
    { label: 'Stone 900', value: 'text-stone-900' },
    { label: 'Amber 300', value: 'text-amber-300' },
    { label: 'Amber 400', value: 'text-amber-400' },
    { label: 'Amber 500', value: 'text-amber-500' },
    { label: 'Amber 600', value: 'text-amber-600' },
    { label: 'Indigo 300', value: 'text-indigo-300' },
    { label: 'Indigo 400', value: 'text-indigo-400' },
    { label: 'Indigo 500', value: 'text-indigo-500' },
    { label: 'Purple 300', value: 'text-purple-300' },
    { label: 'Purple 400', value: 'text-purple-400' },
    { label: 'Purple 500', value: 'text-purple-500' },
    { label: 'Emerald 300', value: 'text-emerald-300' },
    { label: 'Emerald 400', value: 'text-emerald-400' },
    { label: 'Emerald 500', value: 'text-emerald-500' },
    { label: 'Cyan 300', value: 'text-cyan-300' },
    { label: 'Cyan 400', value: 'text-cyan-400' },
    { label: 'Cyan 500', value: 'text-cyan-500' },
    { label: 'Rose 300', value: 'text-rose-300' },
    { label: 'Rose 400', value: 'text-rose-400' },
    { label: 'Rose 500', value: 'text-rose-500' }
];

export const TRANSFORMS = [
    { label: 'Normal', value: 'normal-case' },
    { label: 'Uppercase', value: 'uppercase' },
    { label: 'Lowercase', value: 'lowercase' },
    { label: 'Capitalize', value: 'capitalize' }
];

export const EFFECTS = [
    { label: 'Nessuno', value: 'none' },
    { label: 'Ombra Leggera', value: 'drop-shadow-sm' },
    { label: 'Ombra Media', value: 'drop-shadow-md' },
    { label: 'Italic', value: 'italic' },
    { label: 'Underline', value: 'underline' }
];