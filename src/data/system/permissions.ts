import type { PermissionCode } from '../../types/users';

export const PERMISSIONS_DESCRIPTION: Record<PermissionCode, string> = {
    'ADM-USR-FULL': "Gestione utenti completa (crea/modifica/elimina)",
    'ADM-USR-VIEW': "Visualizzazione lista utenti",
    'ADM-CNT-FULL': "Gestione contenuti completa",
    'ADM-CNT-MOD': "Moderazione contenuti",
    'ADM-SET-FULL': "Accesso a tutte le impostazioni di sistema",
    'ADM-LYT-EDIT': "Modifica layout e design",
    'ADM-STS-VIEW': "Visualizzazione statistiche",
    'BIZ-REG-SELF': "Registrazione account Business",
    'BIZ-REQ-FEAT': "Richiesta funzionalità business avanzate",
    'BIZ-STS-VIEW': "Visualizzazione statistiche business",
    'ITN-PLAN-SELF': "Pianificazione itinerari personali",
    'CNT-SGT-EDIT': "Suggerimento e modifica contenuti",
    'CMT-VOT': "Voto e partecipazione community",
};
