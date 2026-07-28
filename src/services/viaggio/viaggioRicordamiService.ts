import { addNotification } from '@/services/notificationService';
import {
  listViaggiByUser,
  updateViaggio,
} from '@/services/viaggio/viaggioService';
import {
  computeRicordamiNextAt,
  computeRicordamiNextYearlyAt,
  getViaggioRicordamiConfig,
  withViaggioRicordamiConfig,
  RICORDAMI_DEFAULT_INTERVAL_MONTHS,
} from '@/types/models/Viaggio';

/**
 * Emissione Ricordami: una notifica indipendente per ciascun Viaggio due (DOC 12 / DOC 35).
 * Nessun raggruppamento. Deep link → cartella MySpace del viaggio.
 */
export async function emitDueRicordamiNotifications(userId: string): Promise<number> {
  if (!userId || userId === 'guest') return 0;

  const viaggi = await listViaggiByUser(userId);
  const now = Date.now();
  let emitted = 0;

  for (const v of viaggi) {
    if (!v.ricordamiEnabled || !v.ricordamiNextAt) continue;
    const due = new Date(v.ricordamiNextAt).getTime();
    if (Number.isNaN(due) || due > now) continue;

    try {
      const ricordamiConfig = getViaggioRicordamiConfig(v.metadata);
      const months = Number.isFinite(v.ricordamiIntervalMonths) && v.ricordamiIntervalMonths >= 1
        ? v.ricordamiIntervalMonths
        : RICORDAMI_DEFAULT_INTERVAL_MONTHS;

      await addNotification(
        userId,
        'info',
        `Ricorda: ${v.title || 'Viaggio'}`,
        `È tempo di rivivere «${v.title || 'il tuo viaggio'}». Apri la cartella per tornare nel tuo archivio.`,
        {
          section: 'trips',
          intent: 'myspace_viaggio',
          targetId: v.id,
          tab: 'diario',
        },
      );

      if (ricordamiConfig.mode === 'custom_date') {
        // One-shot: dopo l'emissione disattiva.
        await updateViaggio(v.id, {
          ricordamiEnabled: false,
          ricordamiNextAt: null,
          metadata: withViaggioRicordamiConfig(v.metadata, {
            mode: 'custom_date',
            customDateIso: ricordamiConfig.customDateIso,
          }),
        });
      } else if (ricordamiConfig.mode === 'yearly_date') {
        // Ricorrenza annuale: aggiorna next_at alla prossima occorrenza.
        const nextAt = computeRicordamiNextYearlyAt(
          new Date(),
          ricordamiConfig.yearlyDay,
          ricordamiConfig.yearlyMonth,
        );
        await updateViaggio(v.id, { ricordamiNextAt: nextAt });
      } else {
        // Ricorrenza intervallo mesi.
        const nextAt = computeRicordamiNextAt(new Date(), months);
        await updateViaggio(v.id, { ricordamiNextAt: nextAt });
      }
      emitted += 1;
    } catch (e) {
      console.error(
        `[viaggioRicordamiService] emissione fallita per viaggio ${v.id}`,
        e,
      );
    }
  }

  return emitted;
}
