
/**
 * Funzioni stub e placeholder per funzionalità amministrative non ancora implementate
 * o che richiedono risposte sincrone immediate per evitare crash UI.
 */

export const getDismissedAlerts = (...args: any[]) => {
    // Stub sicuro per evitare crash UI
    return [];
};

export const getSponsorRating = (...args: any[]): number | null => {
    console.warn("getSponsorRating not implemented yet");
    return null;
};

export const dismissPartnerAlert = async (...args: any[]) => {
    console.warn("dismissPartnerAlert not implemented yet");
    return Promise.resolve();
};

export const markUserLogsAsRead = async (...args: any[]) => {
    console.warn("markUserLogsAsRead not implemented yet");
    return Promise.resolve();
};

export const deleteSponsorsBulk = async (...args: any[]) => {
    console.warn("deleteSponsorsBulk not implemented yet");
    return Promise.resolve(false);
};

export const extendAllActiveSponsors = async (
    days: number,
    excludeCritical: boolean = false
): Promise<{ count: number; skipped?: number }> => {
    console.warn("extendAllActiveSponsors not implemented yet");
    return Promise.resolve({ count: 0, skipped: 0 });
};

export const sendUserMessage = async (...args: any[]) => {
    console.warn("sendUserMessage not implemented yet");
    return Promise.resolve(false);
};

export const togglePartnerLogReadStatus = async (...args: any[]) => {
    console.warn("togglePartnerLogReadStatus not implemented yet");
    return Promise.resolve();
};

export const updateSponsorExpiration = async (...args: any[]) => {
    console.warn("updateSponsorExpiration not implemented yet");
    return Promise.resolve(false);
};
