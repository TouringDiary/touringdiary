
/**
 * Funzioni stub e placeholder per funzionalità amministrative non ancora implementate
 * o che richiedono risposte sincrone immediate per evitare crash UI.
 */

export const getDismissedAlerts = (): string[] => {
    return [];
};

export const dismissPartnerAlert = async (_vatNumber: string): Promise<void> => {
    console.warn("dismissPartnerAlert not implemented yet");
};

export const sendUserMessage = async (_requestId: string, _message: string): Promise<boolean> => {
    console.warn("sendUserMessage not implemented yet");
    return false;
};
