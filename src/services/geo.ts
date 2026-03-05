
/**
 * Utility Geografiche Matematiche (Safe)
 * Nota: La logica di richiesta permessi (navigator.geolocation) è stata spostata
 * direttamente in src/hooks/core/useGpsManager.ts per rispettare le policy dei browser.
 */

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  
  const R = 6371; // Raggio della terra in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; 
  
  return Math.round(d * 10) / 10;
};

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}
