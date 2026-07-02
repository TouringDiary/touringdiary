/**
 * Logging diagnostico temporaneo per la pipeline immagini PDF.
 * Filtrare in console con: [PDFImagePipeline]
 */
const LOG_PREFIX = '[PDFImagePipeline]';

export type PdfImagePipelineStage =
  | 'prepare:input'
  | 'prepare:poi-start'
  | 'prepare:poi-done'
  | 'prepare:hero-start'
  | 'prepare:hero-done'
  | 'prepare:output'
  | 'processImage:start'
  | 'processImage:skip-empty'
  | 'processImage:skip-data-url'
  | 'processImage:loaded'
  | 'processImage:success'
  | 'processImage:no-canvas-context'
  | 'processImage:img-onerror'
  | 'processImage:canvas-security-error'
  | 'processImage:timeout'
  | 'travelDocument:item-render'
  | 'exportModal:prepared'
  | 'exportModal:pdf-handoff'
  | 'exportModal:pdf-generate-start'
  | 'exportModal:pdf-generate-done'
  | 'exportModal:react-pdf-warn';

export interface PdfImagePipelineEntry {
  stage: PdfImagePipelineStage;
  poiName?: string;
  itemId?: string;
  imageUrl?: string;
  imageUrlHost?: string;
  includePhotos?: boolean;
  hasImageUrl?: boolean;
  processStarted?: boolean;
  processCompleted?: boolean;
  processedImageLength?: number;
  processedImagePrefix?: string;
  errorName?: string;
  errorMessage?: string;
  errorStack?: string;
  naturalWidth?: number;
  naturalHeight?: number;
  outputWidth?: number;
  outputHeight?: number;
  durationMs?: number;
  willRender?: boolean;
  renderBlockedReason?: string;
  optionsPhotos?: boolean;
  isResource?: boolean;
  heroCityName?: string;
  extra?: Record<string, unknown>;
}

function hostFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).host;
  } catch {
    return undefined;
  }
}

export function logPdfImagePipeline(entry: PdfImagePipelineEntry): void {
  const payload = {
    ...entry,
    imageUrlHost: entry.imageUrlHost ?? hostFromUrl(entry.imageUrl),
    timestamp: new Date().toISOString(),
  };
  console.info(LOG_PREFIX, payload.stage, payload);
}

export function summarizeProcessedImage(dataUrl: string | undefined): {
  processedImageLength?: number;
  processedImagePrefix?: string;
} {
  if (!dataUrl) return {};
  return {
    processedImageLength: dataUrl.length,
    processedImagePrefix: dataUrl.slice(0, 40),
  };
}

const REACT_PDF_IMAGE_WARN = /Image with src|invalid dimensions|skipped due to|Invalid base64/i;

/**
 * Intercetta temporaneamente console.warn di @react-pdf durante toBlob().
 * Solo diagnostica — non altera il rendering.
 */
export async function runWithPdfPipelineWarningCapture<T>(
  fn: () => Promise<T>,
): Promise<T> {
  const captured: string[] = [];
  const originalWarn = console.warn;

  console.warn = (...args: unknown[]) => {
    const message = args.map((arg) => {
      if (typeof arg === 'string') return arg;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }).join(' ');

    if (REACT_PDF_IMAGE_WARN.test(message)) {
      captured.push(message);
      logPdfImagePipeline({
        stage: 'exportModal:react-pdf-warn',
        extra: { message: message.slice(0, 600) },
      });
    }

    originalWarn.apply(console, args);
  };

  try {
    return await fn();
  } finally {
    console.warn = originalWarn;
    logPdfImagePipeline({
      stage: 'exportModal:pdf-generate-done',
      extra: {
        reactPdfImageWarningCount: captured.length,
        reactPdfImageWarnings: captured.slice(0, 25),
      },
    });
  }
}
