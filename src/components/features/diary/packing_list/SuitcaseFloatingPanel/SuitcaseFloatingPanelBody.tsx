import React from 'react';
import { SuitcaseItem } from '@/types/suitcase';
import { SUITCASE_MODIFIED_TOAST } from '@/types/toast';
import { SuitcaseHeader } from '../suitcase/SuitcaseHeader';
import { SuitcaseDashboard } from '../suitcase/SuitcaseDashboard';
import { SuitcaseEditorView } from '../suitcase/SuitcaseEditorView';
import { SuitcaseModals } from './components/SuitcaseModals';
import { RecommendedSuitcaseModal } from '../suitcase/RecommendedSuitcaseModal';
import { CategorySetupConfigurationModal } from '../suitcase/CategorySetupConfigurationModal';
import { isAssociableSuitcase, isTdTemplate } from '@/utils/suitcaseDomain';
import type { SuitcasePanelComposition } from './hooks/useSuitcasePanelComposition';

interface Props {
  composition: SuitcasePanelComposition;
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
    totalCount,
    checkedCount,
    progressPerc,
    performUndo,
    performRedo,
    canUndo,
    canRedo,
    handleBackToSelector,
    handleConfirmWorkspacePause,
    handleCancelWorkspacePause,
    handleConfirmAssociateSaved,
  } = composition;

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
        onConfirmWorkspacePause={handleConfirmWorkspacePause}
        onCancelWorkspacePause={handleCancelWorkspacePause}
        onConfirmAssociateSaved={handleConfirmAssociateSaved}
        isTemplateDraftSession={actions.isTemplateDraftSession}
      />

      <RecommendedSuitcaseModal
        isOpen={data.modalState.showRecommendedSuitcaseModal}
        onClose={() => data.modalState.setShowRecommendedSuitcaseModal(false)}
        onConfirm={actions.handleConfirmRecommendedSuitcase}
        isSubmitting={data.isMerging}
        suggestedTemplateIds={data.suggestedTemplateIds ?? []}
        globalTemplates={data.globalTemplates}
        userOwnedTemplates={data.userOwnedTemplates}
      />

      {actions.pendingWorkspaceCreate && (
        <CategorySetupConfigurationModal
          isOpen={actions.showCategorySetupModal}
          title={actions.pendingWorkspaceCreate.title}
          isSubmitting={data.modalState.isCreatingFromConfiguration}
          onConfirm={actions.handleConfirmCategorySetup}
          onClose={actions.handleCancelCategorySetup}
        />
      )}

      <SuitcaseHeader
        viewMode={data.panelState.viewMode}
        activeSuitcase={data.activeSuitcase || null}
        isEditingTitle={data.isEditingTitle}
        tempTitle={data.tempTitle}
        titleInputRef={data.titleInputRef}
        checkedCount={checkedCount}
        totalCount={totalCount}
        progressPerc={progressPerc}
        saveStatus={data.saveStatus}
        isCreatingSuitcase={data.isCreatingSuitcase}
        isLinkedToItinerary={data.linkedSuitcaseIds?.includes(data.panelState.activeTabId || '') || false}
        onEditTitle={actions.startEditingTitle}
        onSaveTitle={actions.handleSaveSuitcaseTitle}
        onTitleChange={data.setTempTitle}
        onCreateSuitcase={actions.handleCreateNew}
        onClose={actions.handleClose}
        onDelete={() => data.modalState.setSuitcaseToDelete(data.panelState.activeTabId)}
        onUnlink={() => data.panelState.activeTabId && data.modalState.setSuitcaseToUnlink(data.panelState.activeTabId)}
        isDiaryAssociable={data.isDiaryAssociable}
        isAssociable={
          data.activeSuitcase ? isAssociableSuitcase(data.activeSuitcase) : false
        }
        onLink={() => data.panelState.activeTabId && actions.handleLinkExisting(data.panelState.activeTabId)}
        onBackToSelector={handleBackToSelector}
        onCreateTemplate={actions.handleCreateTemplate}
        performUndo={performUndo}
        performRedo={performRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        sourceTab={data.panelState.sourceTab}
        setSourceTab={data.panelState.setSourceTab}
      />
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
        <div className={`flex flex-1 flex-col min-h-0 ${data.panelState.viewMode === 'selector' ? 'lg:overflow-hidden overflow-y-auto p-0' : 'overflow-hidden p-0'}`}>
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
                data.panelState.clearNewSuitcaseSession();
                data.panelState.setActiveTabId(id);
                data.panelState.setHoveredItemId(id);
                data.panelState.setViewMode('viewer');
              }}
              onOpenSuitcase={(id) => {
                const entity =
                  data.userSuitcases.find((s) => s.id === id) ??
                  data.globalTemplates.find((s) => s.id === id);
                if (entity && isTdTemplate(entity)) {
                  data.panelState.clearNewSuitcaseSession();
                  data.panelState.setActiveTabId(id);
                  data.panelState.setHoveredItemId(id);
                  data.panelState.setViewMode('viewer');
                  return;
                }
                data.panelState.clearNewSuitcaseSession();
                data.panelState.setActiveTabId(id);
                data.panelState.setViewMode('editor');
              }}
              onUnlinkSuitcase={(id) => data.modalState.setSuitcaseToUnlink(id)}
              onDeleteSuitcase={(id) => data.modalState.setSuitcaseToDelete(id)}
              onHover={data.panelState.setHoveredItemId}
              onTogglePreference={data.togglePreference}
              onUseTemplate={actions.handleUseTemplate}
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
              showHiddenCategories={hiddenCategories.showHiddenCategories}
              guestSuitcase={data.guestSuitcase}
              onContinueGuestSuitcase={actions.handleContinueGuestWorkspace}
            />
          )}
          {(data.panelState.viewMode === 'editor' || data.panelState.viewMode === 'viewer') &&
            data.activeSuitcase && (
            <SuitcaseEditorView
              suitcase={data.activeSuitcase}
              readOnly={
                data.panelState.viewMode === 'viewer' ||
                isTdTemplate(data.activeSuitcase)
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
              onAcceptAiSuggestion={async (name, category) => {
                if (data.activeSuitcase) {
                  await itemActions.handleAddItemConfirmed(data.activeSuitcase.id, name, category);
                  data.setAiSuggestions(prev => prev.map(s => s.name === name ? { ...s, status: 'accepted' } : s));
                }
              }}
              onRejectAiSuggestion={async (name, category) => {
                if (data.activeSuitcase) {
                  // Passiamo solo i dati necessari al dominio, senza mockItem fittizi
                  await data.mutations.rejectItem(data.activeSuitcase.id, { name, category });
                  await data.fetchBlacklist();
                  data.setAiSuggestions(prev => prev.map(s => s.name === name ? { ...s, status: 'rejected' } : s));
                }
              }}
              onShowMoreAi={data.handleShowMoreAi}
              hasMoreAi={data.hasMoreAi}
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
              showToast={data.showToast}
              toast={data.toast}
              blacklistCount={data.blacklistCount}
              isBlacklistFlashing={data.isBlacklistFlashing}
              isAddingNewCategory={data.panelState.isAddingNewCategory}
              setIsAddingNewCategory={data.panelState.setIsAddingNewCategory}
              showGuestWarning={
                !data.currentUser &&
                !!data.activeSuitcase?.id.startsWith('guest-suitcase-')
              }
            />
          )}
        </div>
      </div>
    </>
  );
};
