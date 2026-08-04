import { Router, type Request, type Response } from 'express';
import { supabaseAdmin, supabaseClient } from '../supabaseAdmin';

const FAVICON_SETTING_KEY = 'favicon_image';
const UPSTREAM_FETCH_TIMEOUT_MS = 2500;
const UPSTREAM_CACHE_HEADERS = ['etag', 'last-modified'] as const;

/** Minimal brand-colored SVG served when Asset Globali has no favicon URL. */
const DEFAULT_FAVICON_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#020617"/>
  <circle cx="16" cy="14" r="7" fill="#f59e0b"/>
  <rect x="10" y="22" width="12" height="3" rx="1.5" fill="#e2e8f0"/>
</svg>`;

const router = Router();

async function resolveFaviconUrl(): Promise<string | null> {
  const client = supabaseAdmin ?? supabaseClient;
  const { data, error } = await client
    .from('global_settings')
    .select('value')
    .eq('key', FAVICON_SETTING_KEY)
    .maybeSingle();

  if (error) {
    console.warn('[favicon] global_settings read failed:', error.message);
    return null;
  }

  const raw = data?.value;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (raw && typeof raw === 'object' && typeof (raw as { url?: string }).url === 'string') {
    return (raw as { url: string }).url.trim() || null;
  }
  return null;
}

function sendDefaultFavicon(res: Response): void {
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).send(DEFAULT_FAVICON_SVG);
}

/**
 * GET /favicon.ico — always HTTP 200.
 * Proxies Admin → Asset Globali `favicon_image` when set; otherwise default SVG.
 */
router.get('/favicon.ico', async (_req: Request, res: Response) => {
  try {
    const url = await resolveFaviconUrl();
    if (!url) {
      sendDefaultFavicon(res);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_FETCH_TIMEOUT_MS);

    let upstream: globalThis.Response;
    try {
      upstream = await fetch(url, { redirect: 'follow', signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!upstream.ok) {
      console.warn('[favicon] upstream failed:', upstream.status, url);
      sendDefaultFavicon(res);
      return;
    }

    const contentType = upstream.headers.get('content-type') || 'image/png';
    const buffer = Buffer.from(await upstream.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=300');
    for (const header of UPSTREAM_CACHE_HEADERS) {
      const value = upstream.headers.get(header);
      if (value) res.setHeader(header, value);
    }
    res.status(200).send(buffer);
  } catch (err) {
    console.warn('[favicon] proxy error:', err);
    sendDefaultFavicon(res);
  }
});

export default router;
