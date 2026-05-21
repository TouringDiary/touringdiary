
/**
 * Definizione centralizzata degli stati del ciclo di vita Sponsor.
 * 
 * STATI PERSISTENTI (Database):
 * - pending: Nuova richiesta da valutare (Tabella: sponsor_requests)
 * - waiting_payment: Approvata inizialmente, in attesa di bonifico (Tabella: sponsor_requests)
 * - converted: Stato TECNICO di sola lettura. Indica una richiesta che è stata trasformata 
 *              in uno sponsor attivo. Rimane in 'sponsor_requests' come storico. (Tabella: sponsor_requests)
 * - approved: Contratto valido nel database (può risultare runtime "expired" se end_date < today)
 * - rejected: Richiesta rifiutata (Tabella: sponsor_requests)
 * - cancelled: Sponsor che ha terminato il rapporto o annullato (Tabella: sponsors)
 * 
 * STATI DERIVATI (Runtime):
 * - expired: Uno sponsor è considerato 'expired' solo se lo stato nel DB è 'approved' 
 *            MA la data di fine contratto (end_date) è inferiore alla data odierna.
 */
import { SPONSOR_STATUS_VALUES } from '../../constants/governance';
type PersistentSponsorStatus = typeof SPONSOR_STATUS_VALUES[number];

export type SponsorLifecycleStatus =
    | PersistentSponsorStatus
    /**
     * expired:
     * stato runtime derivato.
     * NON viene salvato nel database.
     * È calcolato come:
     * status === 'approved' AND end_date < today
     */
    | 'expired';
