/**
 * Carica polyfill Node (Buffer / global) solo quando serve PDF/Word export.
 * Evita di trascinare `buffer` nel bundle di entry.
 */
let polyfillsReady: Promise<void> | null = null;

declare global {
  interface Window {
    Buffer?: typeof import('buffer').Buffer;
  }
}

export function ensureNodePdfPolyfills(): Promise<void> {
  if (polyfillsReady) return polyfillsReady;

  polyfillsReady = (async () => {
    const { Buffer } = await import('buffer');

    if (typeof window !== 'undefined' && !window.Buffer) {
      window.Buffer = Buffer;
    }

    if (!('global' in globalThis)) {
      Object.defineProperty(globalThis, 'global', {
        value: globalThis,
        configurable: true,
        writable: true,
      });
    }
  })();

  return polyfillsReady;
}
