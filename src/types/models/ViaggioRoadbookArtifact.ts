import type { RoadbookDay } from './Itinerary';

/** Artifact Roadbook immutabile nella library del Viaggio (DOC 37 §5). */
export interface ViaggioRoadbookArtifact {
  id: string;
  viaggioId: string;
  sourceDiaryId: string;
  userId: string;
  name: string;
  snapshot: RoadbookDay[];
  createdAt: string;
}
