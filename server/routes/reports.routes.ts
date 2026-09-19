import { createHash } from 'node:crypto';
import { Router } from 'express';
import { supabaseAdmin } from '../supabaseAdmin';

const router = Router();
const EVIDENCE_BUCKET = 'report-evidence';
const ALLOWED_SOURCE_BUCKETS = ['public-media', 'community-photos'] as const;
const MAX_EVIDENCE_BYTES = 15 * 1024 * 1024;
const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

type ContentReportEvidenceRow = {
  id: string;
  reporter_user_id: string | null;
  report_kind: string;
  entity_type: string;
  entity_id: string;
  evidence_storage_path: string | null;
  evidence_content_hash: string | null;
  snapshot_storage_bucket: string | null;
  snapshot_storage_path: string | null;
  snapshot_image_url: string | null;
};

function parseStoragePathFromPublicUrl(url: string, bucket: string): string | null {
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const path = decodeURIComponent(url.slice(idx + marker.length).split('?')[0] ?? '');
  return path.length > 0 ? path : null;
}

function parsePublicMediaPathFromUrl(url: string): string | null {
  return parseStoragePathFromPublicUrl(url, 'public-media');
}

function parseCommunityPhotosPathFromUrl(url: string): string | null {
  return parseStoragePathFromPublicUrl(url, 'community-photos');
}

function resolveSnapshotSource(report: ContentReportEvidenceRow): {
  bucket: string;
  path: string;
} | null {
  const bucket = report.snapshot_storage_bucket?.trim();
  const storagePath = report.snapshot_storage_path?.trim();

  if (bucket && storagePath && (ALLOWED_SOURCE_BUCKETS as readonly string[]).includes(bucket)) {
    return { bucket, path: storagePath };
  }

  const imageUrl = report.snapshot_image_url?.trim();
  if (imageUrl) {
    const publicMediaPath = parsePublicMediaPathFromUrl(imageUrl);
    if (publicMediaPath) {
      return { bucket: 'public-media', path: publicMediaPath };
    }
    const communityPath = parseCommunityPhotosPathFromUrl(imageUrl);
    if (communityPath) {
      return { bucket: 'community-photos', path: communityPath };
    }
  }

  return null;
}

function isImageContentType(contentType: string): boolean {
  const normalized = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
  return ALLOWED_IMAGE_MIME.has(normalized);
}

type AllowedImageFormat = 'jpeg' | 'png' | 'webp' | 'gif';

function detectImageFormat(buffer: Buffer): AllowedImageFormat | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp';
  }
  if (
    buffer.length >= 6 &&
    (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' ||
      buffer.subarray(0, 6).toString('ascii') === 'GIF89a')
  ) {
    return 'gif';
  }
  return null;
}

function contentTypeForFormat(format: AllowedImageFormat): string {
  switch (format) {
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
  }
}

function extensionForFormat(format: AllowedImageFormat): string {
  return format === 'jpeg' ? 'jpg' : format;
}

function isStorageObjectAlreadyExistsError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('already exists') ||
    normalized.includes('resource already exists') ||
    normalized.includes('duplicate')
  );
}

router.post('/capture-evidence', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: 'Supabase Admin non configurato.' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Autenticazione richiesta.' });
    }
    const token = authHeader.slice('Bearer '.length);
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Sessione non valida.' });
    }

    const { reportId } = req.body as { reportId?: string };
    if (!reportId) {
      return res.status(400).json({ success: false, error: 'reportId obbligatorio.' });
    }

    const { data: report, error: reportError } = await supabaseAdmin
      .from('content_reports')
      .select(
        'id, reporter_user_id, report_kind, entity_type, entity_id, evidence_storage_path, evidence_content_hash, snapshot_storage_bucket, snapshot_storage_path, snapshot_image_url',
      )
      .eq('id', reportId)
      .maybeSingle();

    if (reportError) {
      return res.status(500).json({ success: false, error: reportError.message });
    }
    if (!report) {
      return res.status(404).json({ success: false, error: 'Segnalazione non trovata.' });
    }

    const typedReport = report as ContentReportEvidenceRow;

    if (typedReport.reporter_user_id !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato a catturare evidenza per questa segnalazione.',
      });
    }

    if (typedReport.report_kind !== 'image_abuse') {
      return res.status(400).json({
        success: false,
        error: 'Evidenza fotografica applicabile solo a segnalazioni image_abuse.',
      });
    }

    if (typedReport.evidence_storage_path) {
      return res.json({
        success: true,
        data: { ok: true, report_id: reportId, idempotent: true },
      });
    }

    const source = resolveSnapshotSource(typedReport);
    if (!source) {
      return res.status(422).json({
        success: false,
        error:
          'Sorgente immagine non risolvibile in modo sicuro dallo snapshot della segnalazione.',
      });
    }

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(source.bucket)
      .download(source.path);

    if (downloadError || !fileData) {
      return res.status(502).json({
        success: false,
        error: downloadError?.message ?? 'Download immagine sorgente fallito.',
      });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    if (buffer.length === 0) {
      return res.status(422).json({ success: false, error: 'File immagine vuoto.' });
    }
    if (buffer.length > MAX_EVIDENCE_BYTES) {
      return res
        .status(413)
        .json({ success: false, error: 'Immagine troppo grande per evidenza.' });
    }

    const detectedFormat = detectImageFormat(buffer);
    if (!detectedFormat) {
      return res.status(422).json({
        success: false,
        error: 'I byte acquisiti non corrispondono a un formato immagine ammesso.',
      });
    }

    const contentType = contentTypeForFormat(detectedFormat);
    const metadataType = fileData.type?.split(';')[0]?.trim().toLowerCase() ?? '';
    if (metadataType && !isImageContentType(metadataType)) {
      return res.status(422).json({ success: false, error: 'Contenuto non valido come immagine.' });
    }

    const hash = createHash('sha256').update(buffer).digest('hex');
    const evidencePath = `${typedReport.entity_type}/${typedReport.entity_id}/${reportId}.${extensionForFormat(detectedFormat)}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(EVIDENCE_BUCKET)
      .upload(evidencePath, buffer, { contentType, upsert: false });

    if (uploadError) {
      if (!isStorageObjectAlreadyExistsError(uploadError.message)) {
        return res.status(500).json({ success: false, error: uploadError.message });
      }

      const { data: existingData, error: existingDownloadError } = await supabaseAdmin.storage
        .from(EVIDENCE_BUCKET)
        .download(evidencePath);

      if (existingDownloadError || !existingData) {
        return res.status(500).json({
          success: false,
          error: 'Evidenza già presente ma non verificabile.',
        });
      }

      const existingBuffer = Buffer.from(await existingData.arrayBuffer());
      const existingHash = createHash('sha256').update(existingBuffer).digest('hex');
      if (existingHash !== hash) {
        return res.status(409).json({
          success: false,
          error: 'Evidenza già registrata con contenuto diverso — immutabile.',
        });
      }
    }

    const { data, error: rpcError } = await supabaseAdmin.rpc('capture_report_evidence', {
      p_report_id: reportId,
      p_storage_bucket: EVIDENCE_BUCKET,
      p_storage_path: evidencePath,
      p_content_hash: hash,
    });
    if (rpcError) {
      return res.status(500).json({ success: false, error: rpcError.message });
    }

    return res.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Reports] capture-evidence error:', message);
    return res.status(500).json({ success: false, error: message });
  }
});

export default router;
