import React, { useEffect, useRef, useState } from 'react';
import { SuitcaseItem } from '@/types/suitcase';
import { SUITCASE_MODIFIED_TOAST } from '@/types/toast';
import { SuitcaseHeader } from '../suitcase/SuitcaseHeader';
import { SuitcaseDashboard } from '../suitcase/SuitcaseDashboard';
import { SuitcaseEditorView } from '../suitcase/SuitcaseEditorView';
import { SuitcaseModals } from './components/SuitcaseModals';
import { RecommendedSuitcaseModal } from '../suitcase/RecommendedSuitcaseModal';
import { CategorySetupConfigurationModal } from '../suitcase/CategorySetupConfigurationModal';
import { isAssociableSuitcase, isTdTemplate } from '@/utils/suitcaseDomain';
import { isDraftWorkspaceId } from '@/utils/guestSuitcaseHelper';
import type { SuitcasePanelComposition } from './hooks/useSuitcasePanelComposition';
import { SaveAsModal } from '@/components/modals/SaveAsModal';
import { UnsavedChangesModal } from '@/components/modals/UnsavedChangesModal';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { useResourcePermission } from '@/hooks/useResourcePermission';
import { useOpenCollaborationShare } from '@/hooks/useOpenCollaborationShare';
import { resolveSuitcaseSharedResourceKind } from '@/collaboration/suitcaseResourceKind';
import { CollaborationLiveProvider } from '@/context/CollaborationLiveContext';
import { useCollaborationLive, useCollaborationReadOnly } from '@/context/CollaborationLiveContext';
import { CollaborationLiveBar } from '@/components/collaboration/live/CollaborationLiveBar';
import { CollaborationLockBanner } from '@/components/collaboration/live/CollaborationLockBanner';
import { CollaborationLastEditorLine } from '@/components/collaboration/CollaborationLastEditorLine';
import { useUser } from '@/context/UserContext';
import { phaseHasUnsavedChanges } from '@/domain/save/documentSaveTypes';

interface Props {
  composition: SuitcasePanelComposition;
}

interface SuitcaseFloatingPanelBodyContentProps extends Props {
  canModifyActiveSuitcase: boolean;
}

export const SuitcaseFloatingPanelBody: React.FC<Props> = ({ composition }) => {
  const {
    data,
    actions,
    itemActions,
    editorLogic,
    hiddenCategories,
    showLoadingShell,
    handleConfirmAssociation,
    handleSaveOnly,
    handleLogin,
    associationFlow,
    handleLinkBuild,
    handleLinkBuildSearch,
    performUndo,
    performRedo,
    canUndo,
    canRedo,
    handleBackToSelector,
    handleDiscardAndExit,
    handleCancelUnsavedChanges,
    forceClose,
    handleConfirmAssociateSaved,
    handleActivateOptionalCategory,
    handleAcceptAiSuggestion,
    handleRejectAiSuggestion,
    suitcaseDocumentSave,
  } = composition;

  const { user: appUser } = useUser();
  const isGuest = appUser.role === 'guest';
  const activeResourceKind = data.activeSuitcase
    ? resolveSuitcaseSharedResourceKind(data.activeSuitcase)
    : null;
  const activeSuitcaseIsTdTemplate = data.activeSuitcase ? isTdTemplate(data.activeSuitcase) : false;
  const { permission: activeResourcePermission } = useResourcePermission(
    activeResourceKind,
    data.activeSuitcase?.id ?? null,
    isGuest ? null : appUser.id
  );

  const canModifyActiveSuitcase =
    !data.activeSuitcase ||
    activeSuitcaseIsTdTemplate ||
    activeResourcePermission?.capabilities.canModifyContent !== false;

  const isDirtyRef = useRef(false);
  const suitcaseHasUnsavedChanges = phaseHasUnsavedChanges(suitcaseDocumentSave.phase);
  useEffect(() => {
    isDirtyRef.current = suitcaseHasUnsavedChanges;
  }, [suitcaseHasUnsavedChanges]);

  if (showLoadingShell) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center min-h-0">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <div className="text-slate-500 font-black tracking-[0.2em] text-[10px] uppercase">
            Caricamento Dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <CollaborationLiveProvider
      kind={activeResourceKind}
      resourceId={data.activeSuitcase?.id ?? null}
      resourceTitle={data.activeSuitcase?.title}
      userId={isGuest ? null : appUser.id}
      userDisplayName={appUser.name ?? 'Utente'}
      canModifyContent={canModifyActiveSuitcase && !!data.activeSuitcase && !activeSuitcaseIsTdTemplate}
      isEditSessionActive={
        data.panelState.viewMode === 'editor' &&
        canModifyActiveSuitcase &&
        !!data.activeSuitcase &&
        !activeSuitcaseIsTdTemplate
      }
      onAutoSaveBeforeLockRelease={async () => {
        // Ignoriamo il valore restituito: serve solo persistere il contenuto prima del rilascio lock.
        await suitcaseDocumentSave.save();
      }}
      onExitEditMode={() => data.panelState.setViewMode('viewer')}
      onRemoteContentRefresh={async () => {
        if (isDirtyRef.current) return;
        await data.fetchUserSuitcases();
      }}
    >
      <SuitcaseFloatingPanelBodyContent
        composition={composition}
        canModifyActiveSuitcase={canModifyActiveSuitcase}
      />
    </CollaborationLiveProvider>
  );
};

const SuitcaseFloatingPanelBodyContent: React.FC<SuitcaseFloatingPanelBodyContentProps> = ({
  composition,
  canModifyActiveSuitcase,
}) => {
  const {
    data,
    actions,
    itemActions,
    editorLogic,
    hiddenCategories,
    handleConfirmAssociation,
    handleSaveOnly,
    handleLogin,
    associationFlow,
    handleLinkBuild,
    handleLinkBuildSearch,
    performUndo,
    performRedo,
    canUndo,
    canRedo,
    handleBackToSelector,
    handleDiscardAndExit,
    handleCancelUnsavedChanges,
    forceClose,
    handleConfirmAssociateSaved,
    handleActivateOptionalCategory,
    handleAcceptAiSuggestion,
    handleRejectAiSuggestion,
    suitcaseDocumentSave,
  } = composition;

  const [suitcaseSaveAsOpen, setSuitcaseSaveAsOpen] = useState(false);
  const [pendingExitAfterSave, setPendingExitAfterSave] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const isGuest = !data.currentUser || data.currentUser.role === 'guest';
  const openCollaborationShare = useOpenCollaborationShare();
  const collaborationLive = useCollaborationLive();
  const collaborationReadOnly = useCollaborationReadOnly();

  const activeResourceKind = data.activeSuitcase
    ? resolveSuitcaseSharedResourceKind(data.activeSuitcase)
    : null;
  const activeSuitcaseIsTdTemplate = data.activeSuitcase ? isTdTemplate(data.activeSuitcase) : false;
  const { permission: activeResourcePermission } = useResourcePermission(
    activeResourceKind,
    data.activeSuitcase?.id ?? null,
    data.currentUser?.id
  );

  const openSuitcaseWithPermission = (id: string, preferredMode: 'viewer' | 'editor') => {
    data.panelState.clearNewSuitcaseSession();
    data.panelState.setActiveTabId(id);
    data.panelState.setViewMode(preferredMode);
  };

  useEffect(() => {
    if (!data.activeSuitcase || !activeResourcePermission) return;
    if (
      !activeResourcePermission.capabilities.canModifyContent &&
      data.panelState.viewMode === 'editor' &&
      !activeSuitcaseIsTdTemplate
    ) {
      data.panelState.setViewMode('viewer');
    }
  }, [
    data.activeSuitcase,
    activeResourcePermission,
    data.panelState.viewMode,
    data.panelState,
  ]);

  // ESC chiude (annulla) il dialogo unico "Modifiche non salvate" senza uscire dal pannello.
  useGlobalModalEscape(
    data.modalState.showUnsavedChangesModal === true,
    handleCancelUnsavedChanges
  );

  // "Salva" dal dialogo di chiusura: per ospiti rimanda al login, per documenti mai salvati apre
  // SaveAs (richiede un nome), altrimenti salva e poi chiude il pannello.
  const handleUnsavedSaveAndExit = async () => {
    if (isGuest) {
      data.modalState.setShowUnsavedChangesModal(false);
      handleLogin();
      return;
    }
    if (suitcaseDocumentSave.isSuitcaseNeverSaved()) {
      setPendingExitAfterSave(true);
      data.modalState.setShowUnsavedChangesModal(false);
      setSuitcaseSaveAsOpen(true);
      return;
    }
    const savedId = await suitcaseDocumentSave.save();
    data.modalState.setShowUnsavedChangesModal(false);
    if (savedId) forceClose();
  };

  useEffect(() => {
    if (data.panelState.viewMode !== 'editor' && aiModalOpen) {
      setAiModalOpen(false);
    }
  }, [data.panelState.viewMode, aiModalOpen]);

  // Chiude il modale AI anche quando cambia la valigia attiva (evita che resti aperto su un altro documento).
  useEffect(() => {
    setAiModalOpen(false);
  }, [data.activeSuitcase?.id]);

  return (
    <>
      <SuitcaseModals
        modalState={data.modalState}
        itineraryId={data.itineraryId}
        actions={actions}
        itemActions={itemActions}
        handleConfirmAssociation={handleConfirmAssociation}
        handleSaveOnly={handleSaveOnly}
        handleCancelAssociation={() => data.modalState.setShowAssociationModal(false)}
        isGuest={!data.currentUser || data.currentUser.role === 'guest'}
        isDiaryAssociable={data.isDiaryAssociable}
        onLogin={handleLogin}
        blacklistItems={data.blacklistItems}
        isFetchingBlacklist={data.isFetchingBlacklist}
        linkModalOpen={associationFlow.linkModalOpen}
        linkModalVariant={associationFlow.linkModalVariant}
        isAssociating={associationFlow.isAssociating}
        defaultDiaryName={associationFlow.defaultDiaryName}
        defaultSuitcaseName={associationFlow.defaultSuitcaseName}
        onLinkModalConfirm={associationFlow.handleLinkModalConfirm}
        onLinkModalCancel={associationFlow.handleLinkModalCancel}
        onConfirmAssociateSaved={handleConfirmAssociateSaved}
        isTemplateDraftSession={actions.isTemplateDraftSession}
        pausedDraftKind={data.guestSuitcase ? data.guestSuitcase.workspace_kind ?? 'suitcase' : undefined}
      />

      <UnsavedChangesModal
        isOpen={data.modalState.showUnsavedChangesModal}
        message="Hai modifiche non salvate. Cosa vuoi fare?"
        confirmLabel="Salva"
        discardLabel="Annulla le modifiche"
        cancelLabel="Continua a modificare"
        isProcessing={suitcaseDocumentSave.phase === 'saving'}
        onSaveAndExit={handleUnsavedSaveAndExit}
        onDiscard={handleDiscardAndExit}
        onCancel={handleCancelUnsavedChanges}
      />

      <RecommendedSuitcaseModal
        isOpen={data.modalState.showRecommendedSuitcaseModal}
        onClose={() => data.modalState.setShowRecommendedSuitcaseModal(false)}
        onConfirm={actions.handleConfirmRecommendedSuitcase}
        isSubmitting={data.isMerging}
        suggestedTemplateIds={data.suggestedTemplateIds ?? []}
        globalTemplates={data.globalTemplates}
        userOwnedTemplates={data.userOwnedTemplates}
        savedSuitcases={data.savedSuitcases}
      />

      <CategorySetupConfigurationModal
        isOpen={actions.showCategorySetupModal && !!actions.pendingWorkspaceCreate}
        title={actions.pendingWorkspaceCreate?.title ?? 'Nuova Valigia'}
        isSubmitting={data.modalState.isCreatingFromConfiguration}
        onConfirm={actions.handleConfirmCategorySetup}
        onClose={actions.handleCancelCategorySetup}
      />

      {(collaborationLive.isEnabled || collaborationLive.lockBlockedMessage) && (
        <div className="px-4 md:px-6 py-2 space-y-2 border-b border-white/5 shrink-0">
          {collaborationLive.isEnabled && (
            <>
              <CollaborationLiveBar
                peers={collaborationLive.presencePeers}
                editingStatusMessage={collaborationLive.editingStatusMessage}
              />
              <CollaborationLastEditorLine editorName={data.activeSuitcase?.last_modified_by_name} />
            </>
          )}
          {collaborationLive.lockBlockedMessage && (
            <CollaborationLockBanner
              message={collaborationLive.lockBlockedMessage}
              onRetry={() => {
                data.panelState.setViewMode('editor');
                void collaborationLive.retryAcquireLock();
              }}
            />
          )}
        </div>
      )}

      <SuitcaseHeader
        viewMode={data.panelState.viewMode}
        activeSuitcase={data.activeSuitcase || null}
        isEditingTitle={data.isEditingTitle}
        tempTitle={data.tempTitle}
        titleInputRef={data.titleInputRef}
        saveStatus={data.saveStatus}
        isLinkedToItinerary={data.linkedSuitcaseIds?.includes(data.panelState.activeTabId || '') || false}
        onEditTitle={actions.startEditingTitle}
        onSaveTitle={actions.handleSaveSuitcaseTitle}
        onTitleChange={data.setTempTitle}
        onClose={actions.handleClose}
        onDelete={() => data.modalState.setSuitcaseToDelete(data.panelState.activeTabId)}
        onUnlink={() => data.panelState.activeTabId && data.modalState.setSuitcaseToUnlink(data.panelState.activeTabId)}
        onCreateSuitcase={actions.handleCreateNew}
        onCreateTemplate={actions.handleCreateTemplate}
        onOpenRecommendedSuitcase={actions.handleOpenRecommendedSuitcase}
        showRecommendedSuitcase={
          !!data.currentUser &&
          !!data.itineraryId &&
          (data.itineraryCityTypes?.length ?? 0) > 0
        }
        isDiaryAssociable={data.isDiaryAssociable}
        isAssociable={
          data.activeSuitcase ? isAssociableSuitcase(data.activeSuitcase) : false
        }
        onLink={() => data.panelState.activeTabId && actions.handleLinkExisting(data.panelState.activeTabId)}
        onBackToSelector={handleBackToSelector}
        performUndo={performUndo}
        performRedo={performRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        isGuest={isGuest}
        onGuestSaveAction={handleLogin}
        onSave={() => {
          if (suitcaseDocumentSave.isSuitcaseNeverSaved()) {
            setSuitcaseSaveAsOpen(true);
          } else {
            void suitcaseDocumentSave.save();
          }
        }}
        onSaveAs={() => setSuitcaseSaveAsOpen(true)}
        onAutosaveToggle={suitcaseDocumentSave.setAutosaveEnabled}
        savePhase={suitcaseDocumentSave.phase}
        lastSavedAt={suitcaseDocumentSave.lastSavedAt}
        lastSaveError={suitcaseDocumentSave.lastError}
        autosaveEnabled={suitcaseDocumentSave.autosaveEnabled}
        canUseAutosave={suitcaseDocumentSave.canUseAutosave}
        onOpenAiModal={() => setAiModalOpen(true)}
        onOpenBlacklist={editorLogic.onOpenBlacklist}
        blacklistCount={data.blacklistCount}
        isSeedingAi={data.isSeedingAi}
        isBlacklistFlashing={data.isBlacklistFlashing}
        checkedCount={composition.checkedCount}
        totalCount={composition.totalCount}
        progressPerc={composition.progressPerc}
        panelViewMode={data.panelState.viewMode === 'viewer' ? 'viewer' : 'editor'}
        canToggleViewMode={
          !!data.activeSuitcase &&
          !activeSuitcaseIsTdTemplate &&
          (activeResourcePermission?.capabilities.canModifyContent ?? true)
        }
        onSetViewMode={(mode) => data.panelState.setViewMode(mode)}
        showShareButton={
          !!activeResourceKind &&
          (activeResourcePermission?.capabilities.canManageCollaboration ?? false)
        }
        onShare={
          data.activeSuitcase && activeResourceKind
            ? () => {
                const suitcase = data.activeSuitcase;
                if (!suitcase) return;
                openCollaborationShare({
                  kind: activeResourceKind,
                  resourceId: suitcase.id,
                  resourceTitle: suitcase.title,
                });
              }
            : undefined
        }
        canDeleteResource={activeResourcePermission?.capabilities.canDeleteResource ?? true}
        canUseTemplateAction={
          !!data.activeSuitcase &&
          activeSuitcaseIsTdTemplate &&
          data.panelState.viewMode === 'viewer'
        }
        onUseTemplate={
          data.activeSuitcase && activeSuitcaseIsTdTemplate
            ? () => actions.handleUseTemplate(data.activeSuitcase!.id)
            : undefined
        }
      />
      {suitcaseSaveAsOpen && data.activeSuitcase && (
        <SaveAsModal
          isOpen={suitcaseSaveAsOpen}
          onClose={() => {
            setSuitcaseSaveAsOpen(false);
            setPendingExitAfterSave(false);
          }}
          onConfirm={async (name) => {
            const isFirst = suitcaseDocumentSave.isSuitcaseNeverSaved();
            const savedId = isFirst
              ? await suitcaseDocumentSave.save({ name })
              : await suitcaseDocumentSave.saveAs(name);
            // Chiudi il modal solo dopo un salvataggio realmente completato (id valorizzato);
            // in caso di fallimento (null) il modal resta aperto.
            if (savedId) {
              setSuitcaseSaveAsOpen(false);
              // Se il salvataggio nasce dal dialogo di chiusura, esci dal pannello.
              if (pendingExitAfterSave) {
                setPendingExitAfterSave(false);
                forceClose();
              }
            }
          }}
          currentName={data.activeSuitcase.title}
        />
      )}
      <div className="flex flex-1 flex-col min-h-0 overflow-x-visible overflow-y-hidden bg-slate-900">
        <div className="flex flex-1 flex-col min-h-0 overflow-x-visible overflow-y-hidden p-0">
          {data.isLoadingUser && data.panelState.viewMode === 'selector' && (
            <div className="text-center text-slate-400 py-12">Caricamento valigie...</div>
          )}
          {data.panelState.viewMode === 'selector' && !data.isLoadingUser && (
            <SuitcaseDashboard
              {...data}
              tripSuitcases={data.tripSuitcases}
              savedSuitcases={data.savedSuitcases}
              allSuitcases={[...data.globalTemplates, ...data.userSuitcases]}
              linkedSuitcaseIds={data.linkedSuitcaseIds || []}
              activeTabId={data.panelState.activeTabId}
              hoveredItemId={data.panelState.hoveredItemId}
              onLinkSuitcase={actions.handleLinkExisting}
              onViewSuitcase={(id) => {
                data.panelState.setHoveredItemId(id);
                openSuitcaseWithPermission(id, 'viewer');
              }}
              onOpenSuitcase={(id) => {
                const entity =
                  data.userSuitcases.find((s) => s.id === id) ??
                  data.globalTemplates.find((s) => s.id === id);
                data.panelState.setHoveredItemId(id);
                if (entity && isTdTemplate(entity)) {
                  openSuitcaseWithPermission(id, 'viewer');
                  return;
                }
                openSuitcaseWithPermission(id, 'editor');
              }}
              onUnlinkSuitcase={(id) => data.modalState.setSuitcaseToUnlink(id)}
              onDeleteSuitcase={(id) => data.modalState.setSuitcaseToDelete(id)}
              onHover={data.panelState.setHoveredItemId}
              onTogglePreference={data.togglePreference}
              onUseTemplate={(id) => actions.handleUseTemplate(id)}
              templatePreviewOverlays={data.templatePreviewOverlays}
              onTemplatePreviewOverlayChange={data.updateTemplatePreviewOverlay}
              onDuplicateEntity={actions.handleDuplicateEntity}
              onRequestAssociate={(id) => data.modalState.setSuitcaseToAssociate(id)}
              onCreateSuitcase={actions.handleCreateNew}
              onCreateTemplate={actions.handleCreateTemplate}
              onOpenRecommendedSuitcase={actions.handleOpenRecommendedSuitcase}
              showRecommendedSuitcase={
                !!data.currentUser &&
                !!data.itineraryId &&
                (data.itineraryCityTypes?.length ?? 0) > 0
              }
              onSaveAsTemplate={actions.handleSaveAsTemplate}
              onAddCategory={actions.handleAddCategoryFromPreview}
              onDeleteCategory={(suitcaseId, category) => {
                const suitcase =
                  data.userSuitcases.find((s) => s.id === suitcaseId) ??
                  data.savedSuitcases.find((s) => s.id === suitcaseId) ??
                  data.tripSuitcases.find((s) => s.id === suitcaseId);
                if (!suitcase) return;
                const itemCount =
                  suitcase.suitcase_items?.filter((item) => item.category === category.name).length ?? 0;
                data.modalState.setCategoryToDelete({
                  id: category.id,
                  name: category.name,
                  source: category.source === 'user' ? 'user' : 'system',
                  itemCount,
                  suitcaseId,
                });
              }}
              onSaveTitle={async (id, title) => {
                await data.mutations.updateSuitcase(id, { title: title.trim() });
                await data.fetchUserSuitcases();
                data.showToast(
                  SUITCASE_MODIFIED_TOAST.message,
                  SUITCASE_MODIFIED_TOAST.description,
                  'success'
                );
              }}
              onUpdateSuitcaseLocal={data.handleUpdateSuitcaseLocal}
              sourceTab={data.panelState.sourceTab}
              setSourceTab={data.panelState.setSourceTab}
              itemMap={data.affiliateMaps.items}
              categoryMap={data.affiliateMaps.categories}
              globalMap={data.affiliateMaps.global}
              placeholders={data.affiliateMaps.placeholders}
              overrides={data.affiliateMaps.overrides}
              hasActiveDiary={!!data.itineraryId}
              isDiaryAssociable={data.isDiaryAssociable}
              onLinkBuild={handleLinkBuild}
              onLinkBuildSearch={handleLinkBuildSearch}
              toast={data.toast}
              guestSuitcase={data.guestSuitcase}
              onContinueGuestSuitcase={actions.handleContinueGuestWorkspace}
              isLoadingGlobalTemplates={data.isLoadingGlobalTemplates}
              globalTemplatesFetchError={data.globalTemplatesFetchError}
              isGuest={!data.currentUser}
              onLogin={handleLogin}
            />
          )}
          {(data.panelState.viewMode === 'editor' || data.panelState.viewMode === 'viewer') &&
            data.activeSuitcase && (
            <SuitcaseEditorView
              suitcase={data.activeSuitcase}
              readOnly={
                data.panelState.viewMode === 'viewer' ||
                activeSuitcaseIsTdTemplate ||
                !canModifyActiveSuitcase ||
                collaborationReadOnly
              }
              categorySetupOverlay={
                activeSuitcaseIsTdTemplate
                  ? data.templatePreviewOverlays[data.activeSuitcase.id]
                  : undefined
              }
              onCategorySetupOverlayChange={
                activeSuitcaseIsTdTemplate
                  ? (updater) =>
                      data.updateTemplatePreviewOverlay(data.activeSuitcase!.id, updater)
                  : undefined
              }
              {...editorLogic}
              onUpdateSuitcase={async (updates) => {
                await data.mutations.updateSuitcase(data.activeSuitcase!.id, updates);
                await data.fetchUserSuitcases();
              }}
              onUpdateSuitcaseLocal={data.handleUpdateSuitcaseLocal}
              onSeedAi={data.handleSeedAi}
              isSeedingAi={data.isSeedingAi}
              aiSuggestions={data.aiSuggestions}
              onAcceptAiSuggestion={handleAcceptAiSuggestion}
              onRejectAiSuggestion={handleRejectAiSuggestion}
              onShowMoreAi={data.handleShowMoreAi}
              hasMoreAi={data.hasMoreAi}
              aiQuotaFeedback={data.aiQuotaFeedback}
              exhaustedCategories={data.exhaustedCategories}
              itemMap={data.affiliateMaps.items}
              categoryMap={data.affiliateMaps.categories}
              globalMap={data.affiliateMaps.global}
              placeholders={data.affiliateMaps.placeholders}
              overrides={data.affiliateMaps.overrides}
              onLinkBuild={handleLinkBuild}
              onLinkBuildSearch={handleLinkBuildSearch}
              highlightItemId={data.panelState.highlightItemId}
              selectedItemName={data.panelState.selectedItemName}
              autoOpenNewCategory={data.panelState.autoOpenNewCategory}
              hiddenCategories={hiddenCategories}
              onActivateOptionalCategory={handleActivateOptionalCategory}
              showToast={data.showToast}
              toast={data.toast}
              blacklistCount={data.blacklistCount}
              isBlacklistFlashing={data.isBlacklistFlashing}
              isAddingNewCategory={data.panelState.isAddingNewCategory}
              setIsAddingNewCategory={data.panelState.setIsAddingNewCategory}
              showGuestWarning={
                !data.currentUser &&
                !!data.activeSuitcase?.id &&
                isDraftWorkspaceId(data.activeSuitcase.id)
              }
              panelViewMode={
                data.panelState.viewMode === 'viewer' ? 'viewer' : 'editor'
              }
              onSetViewMode={(mode) => data.panelState.setViewMode(mode)}
              onUseTemplate={
                activeSuitcaseIsTdTemplate
                  ? () => actions.handleUseTemplate(data.activeSuitcase!.id)
                  : undefined
              }
              aiModalOpen={aiModalOpen}
              onAiModalOpenChange={setAiModalOpen}
            />
          )}
        </div>
      </div>
    </>
  );
};
