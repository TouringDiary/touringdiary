import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  APIProvider,
  Map,
  Marker,
  useMap,
  ColorScheme,
  useApiIsLoaded,
} from '@vis.gl/react-google-maps';
import { MarkerClusterer, type Marker as ClustererMarker } from '@googlemaps/markerclusterer';
import type { ViaggioMapPin } from '@/types/models/ViaggioMappa';

export function getGoogleMapsApiKey(): string {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return typeof key === 'string' ? key.trim() : '';
}

function boundsLiteralFromPins(pins: ViaggioMapPin[]): {
  north: number;
  south: number;
  east: number;
  west: number;
} | null {
  if (pins.length === 0) return null;
  let north = pins[0].lat;
  let south = pins[0].lat;
  let east = pins[0].lng;
  let west = pins[0].lng;
  for (const pin of pins) {
    north = Math.max(north, pin.lat);
    south = Math.min(south, pin.lat);
    east = Math.max(east, pin.lng);
    west = Math.min(west, pin.lng);
  }
  return { north, south, east, west };
}

interface ClusterLayerProps {
  pins: ViaggioMapPin[];
  selectedId: string | null;
  onSelect: (pin: ViaggioMapPin) => void;
}

/**
 * Clustering ufficiale (vis.gl + @googlemaps/markerclusterer).
 * Marker dichiarativi: montati solo quando Map/API sono pronti (no race su `google.maps`).
 */
const ClusterLayer: React.FC<ClusterLayerProps> = ({ pins, selectedId, onSelect }) => {
  const map = useMap();
  const apiLoaded = useApiIsLoaded();
  const [markers, setMarkers] = useState<Record<string, ClustererMarker>>({});

  const clusterer = useMemo(() => {
    if (!map || !apiLoaded) return null;
    return new MarkerClusterer({ map });
  }, [map, apiLoaded]);

  // Sync markers → clusterer
  useEffect(() => {
    if (!clusterer) return;
    clusterer.clearMarkers();
    clusterer.addMarkers(Object.values(markers));
  }, [clusterer, markers]);

  // Cleanup esplicito allo unmount / cambio clusterer (no riferimenti residui)
  useEffect(() => {
    if (!clusterer) return;
    return () => {
      clusterer.clearMarkers();
    };
  }, [clusterer]);

  useEffect(() => {
    if (!map || !apiLoaded || pins.length === 0) return;
    const bounds = boundsLiteralFromPins(pins);
    if (!bounds) return;
    map.fitBounds(bounds, 48);
  }, [map, apiLoaded, pins]);

  const setMarkerRef = useCallback((marker: ClustererMarker | null, key: string) => {
    setMarkers((prev) => {
      if ((marker && prev[key]) || (!marker && !prev[key])) return prev;
      if (marker) return { ...prev, [key]: marker };
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  if (!apiLoaded || !map) return null;

  return (
    <>
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={{ lat: pin.lat, lng: pin.lng }}
          title={pin.label}
          opacity={selectedId && selectedId !== pin.id ? 0.55 : 1}
          onClick={() => onSelect(pin)}
          ref={(marker) => setMarkerRef(marker, pin.id)}
        />
      ))}
    </>
  );
};

interface Props {
  pins: ViaggioMapPin[];
  selectedId: string | null;
  onSelect: (pin: ViaggioMapPin) => void;
}

/**
 * Google Maps embedded + MarkerClusterer client-side (DOC 37 §9 / VD-019).
 * Loader unico: APIProvider di @vis.gl/react-google-maps (nessun secondo script loader).
 * gestureHandling="auto": cooperative su touch (non ruba lo scroll del panel), greedy su desktop.
 */
export const ViaggioMappaGoogleEmbed: React.FC<Props> = ({ pins, selectedId, onSelect }) => {
  const apiKey = getGoogleMapsApiKey();
  // Solo seed iniziale di <Map defaultCenter>; il riallineamento reale è fitBounds.
  const center =
    pins.length === 0
      ? { lat: 41.9, lng: 12.5 }
      : {
          lat: pins.reduce((s, p) => s + p.lat, 0) / pins.length,
          lng: pins.reduce((s, p) => s + p.lng, 0) / pins.length,
        };

  if (!apiKey) {
    return (
      <div
        className="rounded-xl border border-dashed border-slate-700 bg-slate-950/80 p-4 min-h-[16rem] flex flex-col justify-center"
        data-testid="mappa-maps-key-missing"
      >
        <p className="text-sm text-slate-300 font-semibold">Mappa embedded non disponibile</p>
        <p className="text-xs text-slate-500 mt-2">
          Configura <code className="text-amber-300/90">VITE_GOOGLE_MAPS_API_KEY</code> (Maps JavaScript
          API) per visualizzare Google Maps con clustering. L’elenco pin resta utilizzabile.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden border border-slate-800 min-h-[16rem] h-[min(50vh,22rem)]"
      data-testid="mappa-google-embed"
    >
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={6}
          gestureHandling="auto"
          disableDefaultUI={false}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl
          style={{ width: '100%', height: '100%' }}
          colorScheme={ColorScheme.DARK}
        >
          <ClusterLayer pins={pins} selectedId={selectedId} onSelect={onSelect} />
        </Map>
      </APIProvider>
    </div>
  );
};
