/**
 * Platform feature-flag keys and message templates (SSOT: DOC 30).
 * Runtime resolution via Centro di Controllo — WF-02 STEP-3.
 *
 * UI TAB (PO 2026-07-17): AI | Comunicazioni | Sponsor | Moderazione |
 * Manutenzione (include programmazione) | Info Globali | Storico Audit.
 * Le TAB flag-grid usano PLATFORM_CONTROL_SECTION_KEYS; le altre sono pannelli dedicati.
 */

export const PLATFORM_FEATURE_FLAG_KEYS = {
    AI_USERS: 'feature.ai.users',
    AI_ADMIN_ALL: 'feature.ai.admin_all',
    AI_ADMIN_LIMITED: 'feature.ai.admin_limited',
    AI_EMERGENCY: 'feature.ai.emergency',
    ECONOMY_CREDIT_PURCHASE: 'feature.economy.credit_purchase',
    ECONOMY_SUBSCRIPTIONS: 'feature.economy.subscriptions',
    COMMS_ADMIN_PARTNER: 'feature.comms.admin_partner',
    COMMS_USER_SPONSOR: 'feature.comms.user_sponsor',
    COMMS_NOTIFICATIONS: 'feature.comms.notifications',
    SPONSOR_APPLICATIONS: 'feature.sponsor.applications',
    SPONSOR_SHOP_PUBLIC: 'feature.sponsor.shop_public',
    SPONSOR_RATING_THRESHOLD: 'threshold.sponsor_rating_alert_stars',
    MODERATION_REVIEWS: 'feature.moderation.reviews',
    MODERATION_PHOTOS: 'feature.moderation.photos',
    MODERATION_SUGGESTIONS: 'feature.moderation.suggestions',
    MODERATION_COMMUNITY_POSTS: 'feature.moderation.community_posts',
    PLATFORM_MAINTENANCE: 'feature.platform.maintenance',
    /** Global pause: schedules stay stored but are ignored by evaluateFeatureFlag. */
    PLATFORM_SCHEDULES_PAUSED: 'feature.platform.schedules_paused',
} as const;

export type PlatformFeatureFlagKey =
    (typeof PLATFORM_FEATURE_FLAG_KEYS)[keyof typeof PLATFORM_FEATURE_FLAG_KEYS];

export const PLATFORM_MESSAGE_TEMPLATE_KEYS = {
    AI_DISABLED_USER: 'ai_disabled_user',
    AI_DISABLED_ADMIN: 'ai_disabled_admin',
    AI_DISABLED_ADMIN_LIMITED: 'ai_disabled_admin_limited',
    AI_EMERGENCY_NOTICE: 'ai_emergency_notice',
    CREDITS_PURCHASE_PAUSED: 'credits_purchase_paused',
    COMMS_PARTNER_CHAT_DISABLED: 'comms_partner_chat_disabled',
    COMMS_USER_SPONSOR_DISABLED: 'comms_user_sponsor_disabled',
    SPONSOR_APPLICATIONS_PAUSED: 'sponsor_applications_paused',
    SPONSOR_CRM_DISCLOSURE: 'sponsor_crm_disclosure',
    MAINTENANCE_TICKER: 'maintenance_ticker_message',
    REGISTRATION_CLOSED: 'registration_closed',
} as const;

/**
 * Flag-grid delle TAB AI / Comunicazioni / Sponsor / Moderazione.
 * Manutenzione, Info Globali e Storico Audit sono TAB separate (non in questa mappa).
 */
export const PLATFORM_CONTROL_SECTION_KEYS = {
    ai: [
        PLATFORM_FEATURE_FLAG_KEYS.AI_USERS,
        PLATFORM_FEATURE_FLAG_KEYS.AI_ADMIN_ALL,
        PLATFORM_FEATURE_FLAG_KEYS.AI_ADMIN_LIMITED,
        PLATFORM_FEATURE_FLAG_KEYS.AI_EMERGENCY,
        PLATFORM_FEATURE_FLAG_KEYS.ECONOMY_CREDIT_PURCHASE,
    ],
    comms: [
        PLATFORM_FEATURE_FLAG_KEYS.COMMS_ADMIN_PARTNER,
        PLATFORM_FEATURE_FLAG_KEYS.COMMS_USER_SPONSOR,
        PLATFORM_FEATURE_FLAG_KEYS.COMMS_NOTIFICATIONS,
    ],
    sponsor: [
        PLATFORM_FEATURE_FLAG_KEYS.SPONSOR_APPLICATIONS,
        PLATFORM_FEATURE_FLAG_KEYS.SPONSOR_SHOP_PUBLIC,
        PLATFORM_FEATURE_FLAG_KEYS.SPONSOR_RATING_THRESHOLD,
    ],
    moderation: [
        PLATFORM_FEATURE_FLAG_KEYS.MODERATION_REVIEWS,
        PLATFORM_FEATURE_FLAG_KEYS.MODERATION_PHOTOS,
        PLATFORM_FEATURE_FLAG_KEYS.MODERATION_SUGGESTIONS,
        PLATFORM_FEATURE_FLAG_KEYS.MODERATION_COMMUNITY_POSTS,
    ],
} as const;

export type PlatformControlSectionId = keyof typeof PLATFORM_CONTROL_SECTION_KEYS;

/** Ordine TAB UI Centro di Controllo (allineato a PlatformControlCenter). */
export const PLATFORM_CONTROL_UI_TABS = [
    { id: 'ai', label: 'AI' },
    { id: 'comms', label: 'Comunicazioni' },
    { id: 'sponsor', label: 'Sponsor' },
    { id: 'moderation', label: 'Moderazione' },
    { id: 'maintenance', label: 'Manutenzione' },
    { id: 'globals', label: 'Info Globali' },
    { id: 'audit', label: 'Storico Audit' },
] as const;

export type PlatformMessageTemplateCatalogEntry = {
    key: string;
    label: string;
    description: string;
    defaultTitle: string;
    defaultBody: string;
};

/**
 * Messaggi legati a una card Feature Flag (editabili inline sulla card).
 * Non includere qui i messaggi globali (→ PLATFORM_GLOBAL_MESSAGE_CATALOG).
 */
export const PLATFORM_FLAG_MESSAGE_CATALOG: readonly PlatformMessageTemplateCatalogEntry[] = [
    {
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.AI_DISABLED_USER,
        label: 'AI disabilitata (utente)',
        description: 'Messaggio quando feature.ai.users è OFF.',
        defaultTitle: 'AI non disponibile',
        defaultBody: 'I servizi AI per gli utenti sono temporaneamente disattivati.',
    },
    {
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.AI_DISABLED_ADMIN,
        label: 'AI disabilitata (admin all)',
        description: 'Messaggio quando feature.ai.admin_all è OFF.',
        defaultTitle: 'AI admin sospesa',
        defaultBody: 'Gli strumenti AI per Admin All sono temporaneamente disattivati.',
    },
    {
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.AI_DISABLED_ADMIN_LIMITED,
        label: 'AI disabilitata (admin limited)',
        description: 'Messaggio quando feature.ai.admin_limited è OFF.',
        defaultTitle: 'AI admin limitata sospesa',
        defaultBody: 'Gli strumenti AI per Admin Limited sono temporaneamente disattivati.',
    },
    {
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.AI_EMERGENCY_NOTICE,
        label: 'Stop emergenza AI',
        description: 'Avviso per feature.ai.emergency ON.',
        defaultTitle: 'Emergenza AI',
        defaultBody: 'I servizi AI sono sospesi per emergenza operativa.',
    },
    {
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.CREDITS_PURCHASE_PAUSED,
        label: 'Acquisto crediti in pausa',
        description: 'Messaggio quando l’acquisto crediti è OFF.',
        defaultTitle: 'Acquisto crediti sospeso',
        defaultBody: 'L’acquisto di crediti AI è temporaneamente non disponibile.',
    },
    {
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.COMMS_PARTNER_CHAT_DISABLED,
        label: 'Chat Admin↔Partner disabilitata',
        description: 'Messaggio quando feature.comms.admin_partner è OFF.',
        defaultTitle: 'Chat non disponibile',
        defaultBody: 'La messaggistica Admin↔Partner è temporaneamente disabilitata.',
    },
    {
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.COMMS_USER_SPONSOR_DISABLED,
        label: 'Chat Utente↔Sponsor disabilitata',
        description: 'Messaggio quando feature.comms.user_sponsor è OFF.',
        defaultTitle: 'Chat non disponibile',
        defaultBody: 'La chat Utente↔Sponsor non è ancora attiva.',
    },
    {
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.SPONSOR_APPLICATIONS_PAUSED,
        label: 'Candidature Sponsor sospese',
        description: 'Messaggio quando feature.sponsor.applications è OFF.',
        defaultTitle: 'Candidature sospese',
        defaultBody: 'Le nuove candidature Sponsor sono temporaneamente sospese. Riprova più tardi.',
    },
];

/** Messaggio manutenzione — card TAB Manutenzione (non Info Globali). */
export const MAINTENANCE_MESSAGE_CATALOG_ENTRY: PlatformMessageTemplateCatalogEntry = {
    key: PLATFORM_MESSAGE_TEMPLATE_KEYS.MAINTENANCE_TICKER,
    label: 'Messaggio manutenzione (News Bar)',
    description: 'Testo fisso in News Bar quando la manutenzione è ON (DL-P06).',
    defaultTitle: 'Manutenzione',
    defaultBody: 'Piattaforma in manutenzione programmata. Alcune funzioni possono essere limitate.',
};

/**
 * TAB Info Globali — solo testi trasversali non legati a una card flag.
 */
export const PLATFORM_GLOBAL_MESSAGE_CATALOG: readonly PlatformMessageTemplateCatalogEntry[] = [
    {
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.SPONSOR_CRM_DISCLOSURE,
        label: 'Disclosure CRM Sponsor (D18)',
        description: 'Informativa operativa: gli admin possono consultare le conversazioni CRM.',
        defaultTitle: 'Privacy conversazioni CRM',
        defaultBody:
            'Le conversazioni CRM tra Admin e Partner possono essere consultate dagli amministratori della piattaforma per finalità di supporto e moderazione.',
    },
    {
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.REGISTRATION_CLOSED,
        label: 'Registrazione chiusa',
        description: 'Messaggio quando feature.platform.registration è OFF.',
        defaultTitle: 'Registrazioni chiuse',
        defaultBody: 'Le nuove registrazioni sono temporaneamente sospese.',
    },
];

/** Unione flag-card + globali (lookup). Manutenzione resta voce dedicata. */
export const PLATFORM_CONTROL_MESSAGE_CATALOG: readonly PlatformMessageTemplateCatalogEntry[] = [
    ...PLATFORM_FLAG_MESSAGE_CATALOG,
    ...PLATFORM_GLOBAL_MESSAGE_CATALOG,
];

export function findMessageCatalogByKey(
    messageKey: string | null | undefined
): PlatformMessageTemplateCatalogEntry | undefined {
    if (!messageKey) return undefined;
    if (messageKey === PLATFORM_MESSAGE_TEMPLATE_KEYS.MAINTENANCE_TICKER) {
        return MAINTENANCE_MESSAGE_CATALOG_ENTRY;
    }
    return PLATFORM_CONTROL_MESSAGE_CATALOG.find((entry) => entry.key === messageKey);
}
