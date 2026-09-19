export type FamousPersonOfficialPhotoTarget = {
  /** entity_image_assignments.id — preferito; assente → fallback RPC §42.15. */
  assignmentId?: string | null;
  personId: string;
  imageUrl: string;
  storagePath?: string | null;
  personName: string;
};
