import type React from 'react';
import { PlaceholderGrid } from '../design/PlaceholderGrid';
import { SUITCASE_PLACEHOLDER_CATS } from './constants';
import type { AssetUploadTarget } from './types';

type PlaceholderSectionProps = {
  placeholders: Record<string, string>;
  suitcasePlaceholders: Record<string, string>;
  editPlaceholderCat: string;
  placeholderInputRef: React.RefObject<HTMLInputElement | null>;
  suitcasePlaceholderInputRef: React.RefObject<HTMLInputElement | null>;
  triggerPlaceholderUpload: (cat: string) => void;
  triggerSuitcasePlaceholderUpload: (cat: string) => void;
  openEditor: (url: string, target: AssetUploadTarget, cat?: string) => void;
  requestDeletePlaceholder: (kind: 'category' | 'suitcase', catId: string) => void;
  handleFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    target: AssetUploadTarget,
    phCat?: string,
  ) => void;
};

export const PlaceholderSection = ({
  placeholders,
  suitcasePlaceholders,
  editPlaceholderCat,
  placeholderInputRef,
  suitcasePlaceholderInputRef,
  triggerPlaceholderUpload,
  triggerSuitcasePlaceholderUpload,
  openEditor,
  requestDeletePlaceholder,
  handleFileUpload,
}: PlaceholderSectionProps) => (
  <>
    <PlaceholderGrid
      placeholders={placeholders}
      onUploadClick={triggerPlaceholderUpload}
      onEditClick={(url, catId) => openEditor(url, 'placeholder', catId)}
      onDeleteClick={(catId) => requestDeletePlaceholder('category', catId)}
    />
    <input
      ref={placeholderInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => handleFileUpload(e, 'placeholder', editPlaceholderCat)}
    />

    <PlaceholderGrid
      title="Suitcase Suggestion Placeholders"
      description="Usati se manca l'immagine prodotto nei suggerimenti valigia"
      categories={SUITCASE_PLACEHOLDER_CATS}
      placeholders={suitcasePlaceholders}
      onUploadClick={triggerSuitcasePlaceholderUpload}
      onEditClick={(url, catId) => openEditor(url, 'suitcase_placeholder', catId)}
      onDeleteClick={(catId) => requestDeletePlaceholder('suitcase', catId)}
    />
    <input
      ref={suitcasePlaceholderInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => handleFileUpload(e, 'suitcase_placeholder', editPlaceholderCat)}
    />
  </>
);
