export interface TextStyle {
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontFamily: string;
    textAlign: 'left' | 'center' | 'right';
    shadowColor?: string;
    shadowBlur?: number;
}

export interface SocialLayoutConfig {
    userName: TextStyle;
    referralCode: TextStyle;
    customText?: TextStyle & { text: string }; // Opzionale per testo fisso (es. "Sconto")
}

export interface SocialTemplate {
    id: string;
    name: string;
    bgUrl: string;
    layoutConfig: SocialLayoutConfig;
    theme: string; // es. 'summer', 'culture'
    isActive: boolean;
    createdAt?: string;
}
