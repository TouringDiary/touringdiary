import { mf3Rpc } from '@/services/media/mf3DbClient';
import { supabase } from '@/services/supabaseClient';

export type StorageObjectRef = {
  bucket: string;
  path: string;
};

export type HardDeletePhotoOutcome = {
  assetDeleted: boolean;
  storagePathAbsent: boolean;
  failedObjects: StorageObjectRef[];
  releaseError: string | null;
};

export type AuthorizedMediaRemoval = {
  failed: StorageObjectRef[];
  releaseError: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readObjectRef(value: unknown): StorageObjectRef | null {
  if (!isRecord(value)) return null;
  const bucket = typeof value.bucket === 'string' ? value.bucket : '';
  const path = typeof value.path === 'string' ? value.path : '';
  if (!bucket.trim() || !path.trim()) return null;
  return { bucket, path };
}

function readObjectList(value: unknown): StorageObjectRef[] {
  if (!Array.isArray(value)) return [];
  const objects: StorageObjectRef[] = [];
  for (const item of value) {
    const objectRef = readObjectRef(item);
    if (objectRef) objects.push(objectRef);
  }
  return objects;
}

function sameObject(left: StorageObjectRef, right: StorageObjectRef): boolean {
  return left.bucket === right.bucket && left.path === right.path;
}

async function releaseObjects(objects: StorageObjectRef[]): Promise<string | null> {
  if (objects.length === 0) return null;
  const { error } = await mf3Rpc<void>('release_media_hard_delete_objects', {
    p_objects: objects.map((objectRef) => ({ bucket: objectRef.bucket, path: objectRef.path })),
  });
  return error ? error.message : null;
}

export async function removeAuthorizedMediaObjects(
  objects: StorageObjectRef[],
): Promise<AuthorizedMediaRemoval> {
  const failed: StorageObjectRef[] = [];
  const removed: StorageObjectRef[] = [];
  const byBucket = new Map<string, string[]>();

  for (const objectRef of objects) {
    const paths = byBucket.get(objectRef.bucket) ?? [];
    paths.push(objectRef.path);
    byBucket.set(objectRef.bucket, paths);
  }

  for (const [bucket, paths] of byBucket) {
    const { data, error } = await supabase.storage.from(bucket).remove(paths);
    const bucketObjects = objects.filter((objectRef) => objectRef.bucket === bucket);
    if (error || !data) {
      failed.push(...bucketObjects);
      continue;
    }
    const removedNames = new Set(data.map((file) => file.name));
    for (const objectRef of bucketObjects) {
      if (removedNames.has(objectRef.path)) removed.push(objectRef);
      else failed.push(objectRef);
    }
  }

  const releaseError = await releaseObjects(removed);
  return { failed, releaseError };
}

async function hardDelete(
  mediaAssetId: string,
  assignmentId: string | null,
): Promise<HardDeletePhotoOutcome> {
  const { data, error } = await mf3Rpc<unknown>('hard_delete_media_photo', {
    p_media_asset_id: mediaAssetId,
    p_assignment_id: assignmentId,
  });
  if (error) throw new Error(error.message);
  if (!isRecord(data)) throw new Error('Risposta di cancellazione foto non valida.');

  const storage = readObjectRef(data.storage);
  const evidence = readObjectList(data.evidence);
  const targets = storage
    ? [storage, ...evidence.filter((item) => !sameObject(item, storage))]
    : evidence;
  const removal = await removeAuthorizedMediaObjects(targets);

  return {
    assetDeleted: data.asset_deleted === true,
    storagePathAbsent: data.storage_path_absent === true,
    failedObjects: removal.failed,
    releaseError: removal.releaseError,
  };
}

export function hardDeletePhotoAssignment(
  mediaAssetId: string,
  assignmentId: string,
): Promise<HardDeletePhotoOutcome> {
  return hardDelete(mediaAssetId, assignmentId);
}

export function hardDeletePhotoAsset(mediaAssetId: string): Promise<HardDeletePhotoOutcome> {
  return hardDelete(mediaAssetId, null);
}
