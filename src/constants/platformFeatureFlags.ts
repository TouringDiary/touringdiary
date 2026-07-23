/**
 * Platform feature-flag keys and message templates (SSOT: DOC 30).
 * Runtime resolution via Centro di Controllo — WF-02 STEP-3.
 *
 * UI TAB (PO 2026-07-17): AI | Comunicazioni | Sponsor | Moderazione |
 * Manutenzione (include programmazione) | Info Globali | Storico Audit.
 * Le TAB flag-grid usano PLATFORM_CONTROL_SECTION_KEYS; le altre sono pannelli dedicati.
 */

export const PLATFORM_FEATURE_FLAG_KEYS = {
    AI_GUEST: 'feature.ai.guest',
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
    /**
     * Q&A Local (Community domande/risposte).
     * Key storica invariata — non usare per il dominio fotografico.
     */
    MODERATION_COMMUNITY_POSTS: 'feature.moderation.community_posts',
    /** Alias semantico = stessa key di MODERATION_COMMUNITY_POSTS. */
    MODERATION_QA_LOCAL: 'feature.moderation.community_posts',
    PLATFORM_MAINTENANCE: 'feature.platform.maintenance',
    PLATFORM_REGISTRATION: 'feature.platform.registration',
    PLATFORM_ONBOARDING: 'feature.platform.onboarding',
    /** Global pause: schedules stay stored but are ignored by evaluateFeatureFlag. */
    PLATFORM_SCHEDULES_PAUSED: 'feature.platform.schedules_paused',
    /**
     * Premi catalogo Gamification (claim / unlock UI).
     * OFF = freeze premi; XP e livelli restano attivi. Export PDF fuori scope.
     */
    GAMIFICATION_REWARDS: 'feature.gamification.rewards',
} as const;

export type PlatformFeatureFlagKey =
    (typeof PLATFORM_FEATURE_FLAG_KEYS)[keyof typeof PLATFORM_FEATURE_FLAG_KEYS];

/**
 * Testi informativi per le **card Feature Flag** del Centro di Controllo
 * (destinatari: Product Owner / amministratori).
 *
 * RESPONSABILITÀ: descrizione **funzionale del Feature Flag** — cosa governa
 * l’interruttore, quali aree dell’app sono interessate, effetto di ON/OFF.
 * È la Source of Truth delle descrizioni mostrate nelle card (non duplicare in UI).
 *
 * NON confondere con `PlatformMessageTemplateCatalogEntry.description`, che
 * descrive esclusivamente il **template messaggio** associato (titolo/corpo
 * utente finale), non il significato dell’interruttore.
 */
export const PLATFORM_FEATURE_FLAG_ADMIN_HELP: Record<PlatformFeatureFlagKey, string> = {
    [PLATFORM_FEATURE_FLAG_KEYS.AI_GUEST]:
        'Abilita o disabilita le funzionalità AI per gli utenti guest (non autenticati).\n' +
        'Quando disattivato vengono bloccati Magic Planner, Roadbook AI, l’assistente AI in Home/Hero e ogni generazione AI avviata da un utente guest.',

    [PLATFORM_FEATURE_FLAG_KEYS.AI_USERS]:
        'Abilita o disabilita le funzionalità AI per gli utenti registrati (non amministratori).\n' +
        'Quando disattivato vengono bloccati Magic Planner, Roadbook AI, l’assistente AI in Home/Hero e la generazione AI avviata da un utente registrato.',

    [PLATFORM_FEATURE_FLAG_KEYS.AI_ADMIN_ALL]:
        'Abilita o disabilita le funzionalità AI usate con profilo Admin All.\n' +
        'Quando disattivato, le generazioni AI avviate da un Admin All (ad es. flusso generazione itinerario autenticato) vengono bloccate.',

    [PLATFORM_FEATURE_FLAG_KEYS.AI_ADMIN_LIMITED]:
        'Abilita o disabilita le funzionalità AI usate con profilo Admin Limited.\n' +
        'Quando disattivato, le generazioni AI avviate da un Admin Limited vengono bloccate.',

    [PLATFORM_FEATURE_FLAG_KEYS.AI_EMERGENCY]:
        'Stop di emergenza di tutte le funzionalità AI controllate da questo Centro.\n' +
        'Quando attivo, i servizi AI risultano sospesi per ogni profilo (guest, utenti registrati e amministratori), indipendentemente dagli altri interruttori AI.',

    [PLATFORM_FEATURE_FLAG_KEYS.ECONOMY_CREDIT_PURCHASE]:
        'Consente o sospende l’acquisto di crediti AI (modale Ricarica crediti, header crediti, flusso quota esaurita).\n' +
        'Quando disattivato gli utenti non possono avviare un nuovo acquisto di pacchetti crediti.',

    [PLATFORM_FEATURE_FLAG_KEYS.ECONOMY_SUBSCRIPTIONS]:
        'Consente o sospende l’upgrade agli abbonamenti premium utente (modale Passa a Premium e relative chiamate all’upgrade).\n' +
        'Quando disattivato non è possibile avviare un nuovo abbonamento premium; gli abbonamenti già attivi non vengono cancellati da questo interruttore.',

    [PLATFORM_FEATURE_FLAG_KEYS.COMMS_ADMIN_PARTNER]:
        'Consente o sospende la chat operativa Admin ↔ Partner nel CRM Sponsor (PartnerDetailModal).\n' +
        'Quando disattivato lo storico messaggi resta consultabile, ma gli amministratori non possono inviare nuovi messaggi al Partner.',

    [PLATFORM_FEATURE_FLAG_KEYS.COMMS_USER_SPONSOR]:
        'Consente agli utenti (Partner) di inviare messaggi allo staff dalle Conversazioni del proprio spazio.\n' +
        'Quando disattivato le conversazioni restano consultabili, ma non è possibile inviare nuovi messaggi.',

    [PLATFORM_FEATURE_FLAG_KEYS.COMMS_NOTIFICATIONS]:
        'Consente o sospende il Centro Notifiche in-app (dashboard utente) e i badge unread nell’header.\n' +
        'Quando disattivato l’utente non vede né aggiorna le notifiche; i produttori lato servizio possono ancora scrivere record (gate UI, non kill-switch write).',

    [PLATFORM_FEATURE_FLAG_KEYS.SPONSOR_APPLICATIONS]:
        'Consente l’invio di nuove candidature Sponsor dal percorso «Diventa Partner».\n' +
        'Quando disattivato gli utenti non possono aprire o completare nuove richieste di adesione.',

    [PLATFORM_FEATURE_FLAG_KEYS.SPONSOR_SHOP_PUBLIC]:
        'Mostra o nasconde le vetrine shop dei Partner nelle aree pubbliche (header città, bottega da POI, ShopPage).\n' +
        'Quando disattivato non è possibile aprire lo shopping pubblico; la gestione Bottega del Partner in dashboard resta disponibile.',

    [PLATFORM_FEATURE_FLAG_KEYS.SPONSOR_RATING_THRESHOLD]:
        'Soglia (in stelle) usata nella gestione Sponsor per evidenziare e filtrare i Partner sotto soglia di qualità.\n' +
        'Influisce sul filtro «sotto soglia» e sugli indicatori di alert nella tabella Sponsor dell’area Admin.',

    [PLATFORM_FEATURE_FLAG_KEYS.MODERATION_REVIEWS]:
        'Consente agli utenti autenticati di inviare nuove recensioni sui luoghi.\n' +
        'Quando disattivato l’invio delle recensioni viene bloccato e l’utente vede un messaggio di sospensione.',

    [PLATFORM_FEATURE_FLAG_KEYS.MODERATION_PHOTOS]:
        'Consente il caricamento di foto nella galleria città / community.\n' +
        'Quando disattivato gli utenti non possono caricare nuove foto e vedono un avviso di disabilitazione temporanea.',

    [PLATFORM_FEATURE_FLAG_KEYS.MODERATION_SUGGESTIONS]:
        'Consente l’invio di segnalazioni e suggerimenti sui luoghi (modulo Segnala).\n' +
        'Quando disattivato il modulo non accetta nuovi invii e mostra un avviso.',

    [PLATFORM_FEATURE_FLAG_KEYS.MODERATION_COMMUNITY_POSTS]:
        'Consente domande e risposte nella sezione Community → Q&A Local.\n' +
        'Quando disattivato gli utenti possono ancora leggere le discussioni, ma non possono pubblicare nuove domande, rispondere o mettere like.',

    [PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_MAINTENANCE]:
        'Attiva la modalità manutenzione sulla News Bar in cima all’app.\n' +
        'Quando attivo compare un messaggio fisso di manutenzione; le altre news continuano a scorrere accanto.',

    [PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_REGISTRATION]:
        'Consente o sospende la registrazione di nuovi account utente (tab Registrati e signup guest da candidatura Sponsor).\n' +
        'Quando disattivato non è possibile creare nuovi account pubblici; la creazione utenti da Admin non è governata da questo interruttore.',

    [PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_ONBOARDING]:
        'Consente o sospende il tour guidato iniziale (auto-start e voce «Guida all’uso» nel menu).\n' +
        'Quando disattivato il tour non parte automaticamente e non può essere riavviato dal menu.',

    [PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_SCHEDULES_PAUSED]:
        'Mette in pausa tutte le programmazioni automatiche degli interruttori.\n' +
        'Quando attivo le finestre orarie restano salvate ma non vengono applicate: vale l’override manuale oppure il valore predefinito.',

    [PLATFORM_FEATURE_FLAG_KEYS.GAMIFICATION_REWARDS]:
        'Abilita o congela lo sblocco e il riscatto dei premi del catalogo Gamification.\n' +
        'Quando disattivato gli utenti continuano a guadagnare XP e a salire di livello, ma non possono sbloccare né riscattare premi. ' +
        'Alla riattivazione i punti già accumulati restano validi. L’Export PDF (benefit sottoscrizione) non è governato da questo interruttore.',
};

/** Fallback se un flag non ha ancora voce in PLATFORM_FEATURE_FLAG_ADMIN_HELP. */
export const PLATFORM_FEATURE_FLAG_ADMIN_HELP_FALLBACK =
    'Controllo operativo piattaforma. Descrizione funzionale non ancora definita per questo interruttore.';

/**
 * Descrizione funzionale da mostrare sulla card Feature Flag.
 * Solo PLATFORM_FEATURE_FLAG_ADMIN_HELP (+ fallback generico) — mai il description del template messaggio.
 *
 * Parametro `string` (non solo `PlatformFeatureFlagKey`): le card ricevono `PlatformFeatureFlagRecord.key`
 * tipizzato come stringa runtime (DB / cache). Il narrowing al catalogo avviene al lookup.
 */
export function getFeatureFlagAdminHelp(key: string): string {
    return (
        PLATFORM_FEATURE_FLAG_ADMIN_HELP[key as PlatformFeatureFlagKey] ??
        PLATFORM_FEATURE_FLAG_ADMIN_HELP_FALLBACK
    );
}

export const PLATFORM_MESSAGE_TEMPLATE_KEYS = {
    AI_DISABLED_GUEST: 'ai_disabled_guest',
    AI_DISABLED_USER: 'ai_disabled_user',
    AI_DISABLED_ADMIN: 'ai_disabled_admin',
    AI_DISABLED_ADMIN_LIMITED: 'ai_disabled_admin_limited',
    AI_EMERGENCY_NOTICE: 'ai_emergency_notice',
    AI_MAINTENANCE_NOTICE: 'ai_maintenance_notice',
    CREDITS_PURCHASE_PAUSED: 'credits_purchase_paused',
    SUBSCRIPTIONS_PAUSED: 'subscriptions_paused',
    COMMS_PARTNER_CHAT_DISABLED: 'comms_partner_chat_disabled',
    COMMS_USER_SPONSOR_DISABLED: 'comms_user_sponsor_disabled',
    COMMS_NOTIFICATIONS_PAUSED: 'comms_notifications_paused',
    SPONSOR_APPLICATIONS_PAUSED: 'sponsor_applications_paused',
    MODERATION_REVIEWS_PAUSED: 'moderation_reviews_paused',
    MODERATION_PHOTOS_PAUSED: 'moderation_photos_paused',
    MODERATION_SUGGESTIONS_PAUSED: 'moderation_suggestions_paused',
    MODERATION_COMMUNITY_POSTS_PAUSED: 'moderation_community_posts_paused',
    SPONSOR_CRM_DISCLOSURE: 'sponsor_crm_disclosure',
    MAINTENANCE_TICKER: 'maintenance_ticker_message',
    REGISTRATION_CLOSED: 'registration_closed',
    GAMIFICATION_REWARDS_FROZEN: 'gamification_rewards_frozen',
} as const;

/**
 * Flag-grid delle TAB AI / Comunicazioni / Sponsor / Moderazione.
 * Manutenzione, Info Globali e Storico Audit sono TAB separate (non in questa mappa).
 */
export const PLATFORM_CONTROL_SECTION_KEYS = {
    ai: [
        PLATFORM_FEATURE_FLAG_KEYS.AI_GUEST,
        PLATFORM_FEATURE_FLAG_KEYS.AI_USERS,
        PLATFORM_FEATURE_FLAG_KEYS.AI_ADMIN_ALL,
        PLATFORM_FEATURE_FLAG_KEYS.AI_ADMIN_LIMITED,
        PLATFORM_FEATURE_FLAG_KEYS.AI_EMERGENCY,
        PLATFORM_FEATURE_FLAG_KEYS.ECONOMY_CREDIT_PURCHASE,
        PLATFORM_FEATURE_FLAG_KEYS.ECONOMY_SUBSCRIPTIONS,
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

export type PlatformControlUiTabId = (typeof PLATFORM_CONTROL_UI_TABS)[number]['id'];

/**
 * Copy del banner introduttivo di ogni TAB (titolo + descrizione funzionale di sezione).
 * Source of Truth dei testi di dominio; la UI (PlatformControlCenter) li consuma
 * e associa solo l’icona di presentazione.
 */
export const PLATFORM_CONTROL_TAB_COPY: Record<
    PlatformControlUiTabId,
    { title: string; description: string }
> = {
    ai: {
        title: 'AI',
        description:
            'Gestisce tutte le funzionalità di Intelligenza Artificiale della piattaforma, consentendo di abilitarle o sospenderle per guest, utenti registrati e amministratori, oltre alle funzioni di emergenza e ai servizi collegati come l’acquisto crediti. L’accensione rapida di emergenza resta disponibile anche nell’AI Control Center, strumento separato.',
    },
    comms: {
        title: 'Comunicazioni',
        description:
            'Gestisce i canali di comunicazione della piattaforma, incluse chat, notifiche e servizi di messaggistica disponibili per utenti, sponsor e amministratori.',
    },
    sponsor: {
        title: 'Sponsor',
        description:
            'Gestisce le funzionalità dedicate al dominio Sponsor, incluse candidature, visibilità degli shop, soglie operative e impostazioni di pubblicazione.',
    },
    moderation: {
        title: 'Moderazione',
        description:
            'Raccoglie gli strumenti di controllo dei contenuti della piattaforma, consentendo di gestire recensioni, fotografie, suggerimenti e funzionalità della community.',
    },
    maintenance: {
        title: 'Manutenzione',
        description:
            'Contiene gli strumenti operativi utilizzati durante attività di manutenzione o emergenza, inclusa la sospensione temporanea di servizi e schedulazioni.',
    },
    globals: {
        title: 'Info Globali',
        description:
            'Gestisce i testi e le informazioni condivise dalla piattaforma, utilizzati come riferimento globale per utenti e amministratori.',
    },
    audit: {
        title: 'Storico Audit',
        description:
            'Mostra la cronologia delle modifiche del Centro di Controllo. Gli amministratori completi possono esportare, eliminare singole voci o svuotare lo storico.',
    },
};

/**
 * Voce del catalogo Message Template (seed / editor / bootstrap).
 * **Non** è Source of Truth runtime (DL-P13) — SoT = DB `system_messages`.
 * - `label` / `defaultTitle` / `defaultBody`: seed bootstrap se riga DB assente.
 * - `description`: scopo del template per l’admin editor.
 */
export type PlatformMessageTemplateCatalogEntry = {
    key: string;
    label: string;
    /** Descrizione del template messaggio — non riusare come help del Feature Flag. */
    description: string;
    defaultTitle: string;
    defaultBody: string;
};

/**
 * Messaggi legati a una card Feature Flag (editabili inline sulla card).
 * Seed/bootstrap only — runtime legge DB.
 */
export const PLATFORM_FLAG_MESSAGE_CATALOG: readonly PlatformMessageTemplateCatalogEntry[] = [
    {
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.AI_DISABLED_GUEST,
        label: 'AI disabilitata (Guest)',
        description: 'Messaggio quando feature.ai.guest è OFF.',
        defaultTitle: 'AI non disponibile',
        defaultBody: 'I servizi AI per gli utenti guest sono temporaneamente disattivati.',
    },
    {
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.AI_DISABLED_USER,
        label: 'AI disabilitata (utente registrato)',
        description: 'Messaggio quando feature.ai.users è OFF.',
        defaultTitle: 'AI non disponibile',
        defaultBody: 'I servizi AI per gli utenti registrati sono temporaneamente disattivati.',
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
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.AI_MAINTENANCE_NOTICE,
        label: 'AI in manutenzione (ACC)',
        description: 'Messaggio quando ai_enabled (AI Control Center) è OFF.',
        defaultTitle: 'Manutenzione AI',
        defaultBody: 'I servizi AI sono temporaneamente disattivati per manutenzione.',
    },
    {
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.CREDITS_PURCHASE_PAUSED,
        label: 'Acquisto crediti in pausa',
        description: 'Messaggio quando l’acquisto crediti è OFF.',
        defaultTitle: 'Acquisto crediti sospeso',
        defaultBody: 'L’acquisto di crediti AI è temporaneamente non disponibile.',
    },
    {
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.SUBSCRIPTIONS_PAUSED,
        label: 'Abbonamenti premium in pausa',
        description: 'Messaggio quando feature.economy.subscriptions è OFF.',
        defaultTitle: 'Abbonamenti sospesi',
        defaultBody: 'L’upgrade agli abbonamenti premium non è temporaneamente disponibile.',
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
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.COMMS_NOTIFICATIONS_PAUSED,
        label: 'Notifiche in-app sospese',
        description: 'Messaggio quando feature.comms.notifications è OFF.',
        defaultTitle: 'Notifiche sospese',
        defaultBody: 'Il centro notifiche in-app è temporaneamente non disponibile.',
    },
    {
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.SPONSOR_APPLICATIONS_PAUSED,
        label: 'Candidature Sponsor sospese',
        description: 'Messaggio quando feature.sponsor.applications è OFF.',
        defaultTitle: 'Candidature sospese',
        defaultBody: 'Le nuove candidature Sponsor sono temporaneamente sospese. Riprova più tardi.',
    },
    {
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.MODERATION_REVIEWS_PAUSED,
        label: 'Recensioni sospese',
        description: 'Messaggio quando feature.moderation.reviews è OFF.',
        defaultTitle: 'Recensioni sospese',
        defaultBody: 'L’invio di nuove recensioni è temporaneamente disabilitato.',
    },
    {
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.MODERATION_PHOTOS_PAUSED,
        label: 'Upload foto sospeso',
        description: 'Messaggio quando feature.moderation.photos è OFF.',
        defaultTitle: 'Caricamento foto sospeso',
        defaultBody: 'Il caricamento foto è temporaneamente disabilitato.',
    },
    {
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.MODERATION_SUGGESTIONS_PAUSED,
        label: 'Segnalazioni sospese',
        description: 'Messaggio quando feature.moderation.suggestions è OFF.',
        defaultTitle: 'Segnalazioni sospese',
        defaultBody: 'Le segnalazioni sono temporaneamente disabilitate.',
    },
    {
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.MODERATION_COMMUNITY_POSTS_PAUSED,
        label: 'Q&A Local sospeso',
        description: 'Messaggio quando feature.moderation.community_posts (Q&A Local) è OFF.',
        defaultTitle: 'Q&A Local sospeso',
        defaultBody: 'Le domande e risposte locali sono temporaneamente disabilitate.',
    },
    {
        key: PLATFORM_MESSAGE_TEMPLATE_KEYS.GAMIFICATION_REWARDS_FROZEN,
        label: 'Premi Gamification congelati',
        description: 'Messaggio informativo quando feature.gamification.rewards è OFF (freeze premi; XP resta attivo).',
        defaultTitle: 'Premio disponibile prossimamente',
        defaultBody:
            'Continua ad accumulare XP: quando la Gamification sarà attivata, potrai utilizzare automaticamente tutti i punti già guadagnati.',
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
