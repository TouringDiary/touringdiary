import React from 'react';
import { SuitcaseHeader } from '../suitcase/SuitcaseHeader';
import { SuitcaseDashboard } from '../suitcase/SuitcaseDashboard';
import { SuitcaseEditorView } from '../suitcase/SuitcaseEditorView';
import { SuitcaseModals } from './components/SuitcaseModals';
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
    handleLinkBuild,
    handleLinkBuildSearch,
    totalCount,
    checkedCount,
    progressPerc,
    performUndo,
    performRedo,
    canUndo,
    canRedo,
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
        isDiaryFull={!!data.itineraryId && (data.itinerary?.items?.length || 0) > 0}
        onLogin={handleLogin}
      />
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
        onUnlink={() => data.panelState.activeTabId && actions.handleUnlink(data.panelState.activeTabId)}
        onBackToSelector={actions.handleBackToSelector}
        onCreateTemplate={actions.handleCreateTemplate}
        performUndo={performUndo}
        performRedo={performRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        sourceTab={data.panelState.sourceTab}
        setSourceTab={data.panelState.setSourceTab}
        showHiddenCategories={hiddenCategories.showHiddenCategories}
        onToggleHiddenCategories={() => hiddenCategories.setShowHiddenCategories(!hiddenCategories.showHiddenCategories)}
        hiddenCategoriesCount={hiddenCategories.enhancedHiddenCategoriesLogic.hiddenIds.length}
        isEyeFlashing={hiddenCategories.isEyeFlashing}
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
              onOpenSuitcase={(id) => {
                data.panelState.setIsNewSuitcaseSession(false);
                data.panelState.setActiveTabId(id);
                data.panelState.setViewMode('editor');
              }}
              onUnlinkSuitcase={(id) => data.modalState.setSuitcaseToUnlink(id)}
              onDeleteSuitcase={(id) => data.modalState.setSuitcaseToDelete(id)}
              onHover={data.panelState.setHoveredItemId}
              onTogglePreference={data.togglePreference}
              onUseTemplate={actions.handleUseTemplate}
              onCreateSuitcase={actions.handleCreateNew}
              onCreateTemplate={actions.handleCreateTemplate}
              onAddCategory={actions.handleAddCategoryFromPreview}
              onUpdateSuitcaseLocal={data.handleUpdateSuitcaseLocal}
              sourceTab={data.panelState.sourceTab}
              setSourceTab={data.panelState.setSourceTab}
              itemMap={data.affiliateMaps.items}
              categoryMap={data.affiliateMaps.categories}
              globalMap={data.affiliateMaps.global}
              placeholders={data.affiliateMaps.placeholders}
              overrides={data.affiliateMaps.overrides}
              hasActiveDiary={!!data.itineraryId}
              onLinkBuild={handleLinkBuild}
              onLinkBuildSearch={handleLinkBuildSearch}
              toast={data.toast}
              showHiddenCategories={hiddenCategories.showHiddenCategories}
            />
          )}
          {data.panelState.viewMode === 'editor' && data.activeSuitcase && (
            <SuitcaseEditorView
              suitcase={data.activeSuitcase}
              {...editorLogic}
              onUpdateSuitcase={async (updates) => {
                await data.mutations.updateSuitcase(data.activeSuitcase!.id, updates);
                await data.fetchUserSuitcases();
              }}
              onUpdateSuitcaseLocal={data.handleUpdateSuitcaseLocal}
              onSeedAi={data.handleSeedAi}
              isSeedingAi={data.isSeedingAi}
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
              showHiddenCategories={hiddenCategories.showHiddenCategories}
              hiddenCategoriesLogic={hiddenCategories.enhancedHiddenCategoriesLogic}
              toast={data.toast}
            />
          )}
        </div>
      </div>
    </>
  );
};
