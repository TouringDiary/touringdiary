
export interface RouteSeo {
  continent_slug: string;
  nation_slug: string;
  region_slug: string;
  zone_slug: string;
  city_slug: string;
}

/**
 * Gestione centralizzata metadati SEO con Strict Canonical Policy
 */
export const updateCityMetadata = (city: any, route: RouteSeo | null) => {
  if (!city) return null;

  // 1. Title - Sempre aggiornato per UX e indicizzazione base
  const newTitle = city.details?.seo_title || `${city.name} cosa vedere | Touring Diary`;
  if (document.title !== newTitle) {
      document.title = newTitle;
  }

  // 2. Meta Description - Sempre aggiornata
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', city.details?.seo_description || `Scopri cosa vedere a ${city.name}, esperienze autentiche e consigli locali.`);

  // 3. Canonical Tag - RIGOROSAMENTE SOLO SE LA ROTTA È COMPLETA
  // Evita l'indicizzazione di URL piatti (es. /sorrento) a favore di quelli gerarchici
  if (!route) return null;

  // Costruzione path pulita (senza slash multipli se mancano zone o regioni)
  const segments = [
      route.continent_slug,
      route.nation_slug,
      route.region_slug,
      route.zone_slug,
      route.city_slug
  ].filter(Boolean);

  const path = `/${segments.join('/')}`;
  const canonicalUrl = `https://www.touringdiary.com${path}`;

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', canonicalUrl);

  return canonicalUrl;
};

/**
 * Iniezione Structured Data JSON-LD (TouristDestination)
 * Utilizza esclusivamente i dati certificati del registro.
 */
export const injectJsonLd = (city: any, canonicalUrl: string) => {
  const id = 'json-ld-city';
  let script = document.getElementById(id) as HTMLScriptElement;
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  const schema: any = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    "name": city.name,
    "description": city.details?.seo_description || city.description,
    "url": canonicalUrl,
    "image": city.details?.main_image || city.imageUrl // Priorità immagine registro
  };

  // Validazione geospaziale
  if (city.coords?.lat && city.coords?.lng) {
    schema.geo = {
      "@type": "GeoCoordinates",
      "latitude": city.coords.lat,
      "longitude": city.coords.lng
    };
  }

  script.text = JSON.stringify(schema);
  return () => script.remove();
};
