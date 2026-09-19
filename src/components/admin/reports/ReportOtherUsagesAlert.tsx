import { AlertTriangle } from 'lucide-react';
import type { ReportOtherAssignment, ReportOtherPersonCity } from '@/types/models/contentReport';

type ReportOtherUsagesAlertProps = {
  otherAssignments: ReportOtherAssignment[];
  otherPersonCities: ReportOtherPersonCity[];
};

export const ReportOtherUsagesAlert = ({
  otherAssignments,
  otherPersonCities,
}: ReportOtherUsagesAlertProps) => {
  if (otherAssignments.length === 0 && otherPersonCities.length === 0) {
    return null;
  }

  return (
    <div
      className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3"
      role="note"
      aria-label="Altri utilizzi della stessa immagine o personaggio"
    >
      <div className="flex items-center gap-2 text-amber-200 text-sm font-semibold">
        <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
        Attenzione — altri utilizzi collegati
      </div>
      {otherAssignments.length > 0 ? (
        <ul className="text-xs text-amber-100/90 space-y-1 list-disc pl-4">
          {otherAssignments.map((item) => (
            <li key={item.assignmentId}>
              Stessa fotografia: {item.entityName} · {item.cityName} · {item.assignmentStatus}
              {item.isCurrent ? ' (corrente)' : ''}
            </li>
          ))}
        </ul>
      ) : null}
      {otherPersonCities.length > 0 ? (
        <ul className="text-xs text-amber-100/90 space-y-1 list-disc pl-4">
          {otherPersonCities.map((item) => (
            <li key={`${item.cityId}-${item.personId}`}>
              Stesso personaggio anche in {item.cityName} ({item.status})
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
