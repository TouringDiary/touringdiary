import { useEffect, useMemo, useState } from 'react';
import {
  GeoCascadingFilters,
  type GeoSelection,
} from '@/components/admin/cities/GeoCascadingFilters';
import { getFullManifestAsync } from '@/services/cityService';
import type { CitySummary } from '@/types/models/City';

export type GeoReportFilterValue = GeoSelection & {
  cityId: string;
};

const EMPTY: GeoReportFilterValue = {
  continent: '',
  nation: '',
  region: '',
  zone: '',
  city: '',
  cityId: '',
};

type GeoReportFiltersProps = {
  value: GeoReportFilterValue;
  onChange: (next: GeoReportFilterValue) => void;
  density?: 'comfortable' | 'compact';
};

function matchesGeoFilters(city: CitySummary, selection: GeoSelection): boolean {
  if (selection.continent && city.continent !== selection.continent) return false;
  if (selection.nation && city.nation !== selection.nation) return false;
  if (selection.region && city.adminRegion !== selection.region) return false;
  if (selection.zone && city.zone !== selection.zone) return false;
  if (selection.city && city.name !== selection.city) return false;
  return true;
}

function resolveCityId(cities: CitySummary[], selection: GeoSelection): string {
  const candidates = cities.filter((city) => matchesGeoFilters(city, selection));
  if (selection.city.trim()) {
    const named = candidates.filter((city) => city.name === selection.city);
    return named.length === 1 ? named[0].id : '';
  }
  return candidates.length === 1 ? candidates[0].id : '';
}

/** Filtri continente → città per code Admin MF3 (mobile-first, riuso GeoCascadingFilters). */
export const GeoReportFilters = ({
  value,
  onChange,
  density = 'compact',
}: GeoReportFiltersProps) => {
  const [cities, setCities] = useState<CitySummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const manifest = await getFullManifestAsync();
        if (!cancelled) {
          setCities(manifest);
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const geoSelection: GeoSelection = useMemo(
    () => ({
      continent: value.continent,
      nation: value.nation,
      region: value.region,
      zone: value.zone,
      city: value.city,
    }),
    [value.continent, value.nation, value.region, value.zone, value.city],
  );

  const handleGeoChange = (next: GeoSelection) => {
    onChange({
      ...next,
      cityId: resolveCityId(cities, next),
    });
  };

  return (
    <div className="space-y-2">
      {loadError ? (
        <p className="text-xs text-amber-400" role="status">
          Filtri geografici non disponibili: {loadError}
        </p>
      ) : null}
      <GeoCascadingFilters
        cities={cities}
        value={geoSelection}
        onChange={handleGeoChange}
        orientation="vertical"
        density={density}
        headerSubtitle="Filtra coda: continente e nazione; la città applica il filtro solo se selezionata in modo univoco"
      />
    </div>
  );
};

export const EMPTY_GEO_REPORT_FILTER = EMPTY;
