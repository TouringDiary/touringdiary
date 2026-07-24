import React from 'react';
import { PhotoAcquireDialog } from '@/components/photos/PhotoAcquireDialog';
import { InAppCameraCapture } from '@/components/photos/InAppCameraCapture';
import { CommunityPhotoPublishModal } from '@/components/photos/CommunityPhotoPublishModal';
import { UserPhotoEditor } from '@/components/community/UserPhotoEditor';
import { useCanCapturePhoto } from '@/hooks/photos/useCanCapturePhoto';
import type { useCommunityPhotoPublish } from '@/hooks/photos/useCommunityPhotoPublish';

type WorkflowApi = ReturnType<typeof useCommunityPhotoPublish>;

interface Props {
    workflow: WorkflowApi;
}

/**
 * Shared Community photo UX shell:
 * acquire → (in-app capture | gallery) → editor (+ filters) → compose/publish.
 *
 * Camera uses getUserMedia in-page so the SPA tab stays foreground (avoids
 * system camera backgrounding the tab / Vite HMR full-reload on mobile tunnel).
 */
export const CommunityPhotoWorkflow: React.FC<Props> = ({ workflow }) => {
    const canCapture = useCanCapturePhoto();

    return (
        <>
            <PhotoAcquireDialog
                isOpen={workflow.isAcquireOpen}
                canCapture={canCapture}
                onClose={workflow.closeAcquire}
                onCapture={workflow.triggerCamera}
                onGallery={workflow.triggerGallery}
            />

            <InAppCameraCapture
                isOpen={workflow.isCaptureOpen}
                onCapture={workflow.handleCameraCaptured}
                onCancel={workflow.closeCapture}
            />

            {workflow.isEditOpen && workflow.originalFile && (
                <UserPhotoEditor
                    file={workflow.originalFile}
                    onSave={workflow.handleEditorSave}
                    onCancel={workflow.handleEditorCancel}
                />
            )}

            <CommunityPhotoPublishModal
                isOpen={workflow.isComposeOpen}
                mode={workflow.mode}
                isAdmin={workflow.isAdmin}
                isUploading={workflow.isUploading}
                uploadStep={workflow.uploadStep}
                previewUrl={workflow.previewUrl}
                selectedCityId={workflow.selectedCityId}
                onCityChange={workflow.setSelectedCityId}
                snapCaption={workflow.snapCaption}
                onCaptionChange={workflow.setSnapCaption}
                streetName={workflow.streetName}
                onStreetChange={workflow.setStreetName}
                isOfficialUpload={workflow.isOfficialUpload}
                onOfficialChange={workflow.setIsOfficialUpload}
                showEmojiPicker={workflow.showEmojiPicker}
                onToggleEmojiPicker={() =>
                    workflow.setShowEmojiPicker(!workflow.showEmojiPicker)
                }
                onCloseEmojiPicker={() => workflow.setShowEmojiPicker(false)}
                onEmojiClick={workflow.handleEmojiClick}
                canReedit={Boolean(workflow.originalFile)}
                onClose={workflow.closeWorkflow}
                onChangePhoto={workflow.changePhoto}
                onReedit={workflow.reeditFromOriginal}
                onPublish={workflow.handleConfirmUpload}
                canPublish={workflow.canPublish}
            />

            <input
                ref={workflow.galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={workflow.handleFileSelected}
            />

        </>
    );
};
