import type { User } from '../types/users';

/**
 * Factory function per creare un oggetto User ospite.
 * È una funzione pura, senza dipendenze esterne, sicura da usare durante l'inizializzazione.
 */
export const getGuestUser = (): User => ({
    id: 'guest',
    name: 'Visitatore',
    email: '',
    role: 'guest',
    status: 'active',
    isTestAccount: false,
    nation: '',
    city: '',
    registrationDate: new Date().toISOString(),
    lastAccess: new Date().toISOString(),
    xp: 0
});
