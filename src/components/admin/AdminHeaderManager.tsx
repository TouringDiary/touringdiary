import { MessageSquare, Monitor, RefreshCw, Trash2 } from 'lucide-react';
import { useAdminHeaderManager } from '@/hooks/admin/useAdminHeaderManager';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { AdminPhotoInspector } from './AdminPhotoInspector';
import { AdminToast } from './adminHeaderManager/AdminToast';
import { FaviconSection } from './adminHeaderManager/FaviconSection';
import { FunctionalAssetsSection } from './adminHeaderManager/FunctionalAssetsSection';
import { HeroSection } from './adminHeaderManager/HeroSection';
import { PatronSection } from './adminHeaderManager/PatronSection';
import { PlaceholderSection } from './adminHeaderManager/PlaceholderSection';
import { AdminPageHeader } from './common/AdminPageHeader';

export const AdminHeaderManager = () => {
  const {
    previewImage,
    mode,
    setMode,
    isSavingHero,
    patronImage,
    isSavingPatron,
    placeholders,
    suitcasePlaceholders,
    authBg,
    socialBg,
    aiBg,
    faviconImage,
    isSavingExtra,
    isSavingFavicon,
    toast,
    setToast,
    inspectorOpen,
    setInspectorOpen,
    imageToEdit,
    editTarget,
    editPlaceholderCat,
    heroNote,
    showDeleteHeroConfirm,
    setShowDeleteHeroConfirm,
    showResetConfirm,
    setShowResetConfirm,
    deleteAssetTarget,
    setDeleteAssetTarget,
    deletePlaceholderTarget,
    setDeletePlaceholderTarget,
    fileInputRef,
    patronInputRef,
    placeholderInputRef,
    suitcasePlaceholderInputRef,
    authInputRef,
    socialInputRef,
    aiBgInputRef,
    faviconInputRef,
    showToast,
    handleFileUpload,
    handleSaveHero,
    handleRemoveHeroRequest,
    confirmRemoveHero,
    handleRemoveAssetRequest,
    confirmRemoveAsset,
    handleSaveFavicon,
    handleSavePatron,
    handleSaveExtraAssets,
    handleReset,
    executeReset,
    handleResetPatronGlobal,
    requestDeletePlaceholder,
    confirmDeletePlaceholder,
    openEditor,
    handleEditorSave,
    triggerPlaceholderUpload,
    triggerSuitcasePlaceholderUpload,
    handleSafeArtSuccess,
  } = useAdminHeaderManager();

  return (
    <div className="space-y-8 animate-in fade-in relative min-h-screen overflow-hidden pb-20">
      {toast && (
        <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <DeleteConfirmationModal
        isOpen={showDeleteHeroConfirm}
        onClose={() => setShowDeleteHeroConfirm(false)}
        onConfirm={confirmRemoveHero}
        title="Rimuovere Hero Image?"
        message="L'immagine verrà rimossa da Asset Globali (settings + storage se caricata in admin_assets). Il sito userà il default."
        confirmLabel="Elimina"
        variant="danger"
        icon={<Trash2 className="w-8 h-8 text-red-500 animate-pulse" />}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteAssetTarget}
        onClose={() => setDeleteAssetTarget(null)}
        onConfirm={confirmRemoveAsset}
        title="Eliminare Asset Globale?"
        message="L'asset verrà rimosso dalle impostazioni e dal storage (se presente in admin_assets). Nessun impatto sul dominio Photo."
        confirmLabel="Elimina"
        variant="danger"
        icon={<Trash2 className="w-8 h-8 text-red-500" />}
      />

      <DeleteConfirmationModal
        isOpen={!!deletePlaceholderTarget}
        onClose={() => setDeletePlaceholderTarget(null)}
        onConfirm={confirmDeletePlaceholder}
        title="Eliminare Placeholder?"
        message={`Il placeholder "${deletePlaceholderTarget?.catId ?? ''}" verrà rimosso da Asset Globali. Il registry runtime si aggiorna subito.`}
        confirmLabel="Elimina"
        variant="danger"
        icon={<Trash2 className="w-8 h-8 text-red-500" />}
      />

      <DeleteConfirmationModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={executeReset}
        title="Ripristina Default"
        message="Ripristinare l'immagine di default?"
        confirmLabel="Ripristina"
        variant="info"
      />

      <AdminPageHeader
        icon={Monitor}
        title="Design & Asset Globali"
        subtitle="Personalizza l'aspetto e i fallback"
        accent="indigo"
        className="!mb-6"
      />

      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden relative z-floating-panel">
        <div className="flex justify-end items-center p-4 border-b border-slate-800 bg-slate-950/50">
          <button
            type="button"
            onClick={handleReset}
            className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Ripristina Default
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <HeroSection
            mode={mode}
            setMode={setMode}
            previewImage={previewImage}
            isSavingHero={isSavingHero}
            fileInputRef={fileInputRef}
            openEditor={openEditor}
            handleRemoveHeroRequest={handleRemoveHeroRequest}
            handleFileUpload={handleFileUpload}
            handleSafeArtSuccess={handleSafeArtSuccess}
            showToast={showToast}
            handleSaveHero={handleSaveHero}
          />

          <div className="flex flex-col gap-6">
            <PatronSection
              patronImage={patronImage}
              isSavingPatron={isSavingPatron}
              patronInputRef={patronInputRef}
              openEditor={openEditor}
              handleResetPatronGlobal={handleResetPatronGlobal}
              handleFileUpload={handleFileUpload}
              handleSavePatron={handleSavePatron}
            />

            <PlaceholderSection
              placeholders={placeholders}
              suitcasePlaceholders={suitcasePlaceholders}
              editPlaceholderCat={editPlaceholderCat}
              placeholderInputRef={placeholderInputRef}
              suitcasePlaceholderInputRef={suitcasePlaceholderInputRef}
              triggerPlaceholderUpload={triggerPlaceholderUpload}
              triggerSuitcasePlaceholderUpload={triggerSuitcasePlaceholderUpload}
              openEditor={openEditor}
              requestDeletePlaceholder={requestDeletePlaceholder}
              handleFileUpload={handleFileUpload}
            />
          </div>
        </div>
      </div>

      <FunctionalAssetsSection
        authBg={authBg}
        socialBg={socialBg}
        aiBg={aiBg}
        isSavingExtra={isSavingExtra}
        authInputRef={authInputRef}
        socialInputRef={socialInputRef}
        aiBgInputRef={aiBgInputRef}
        handleRemoveAssetRequest={handleRemoveAssetRequest}
        handleFileUpload={handleFileUpload}
        openEditor={openEditor}
        handleSaveExtraAssets={handleSaveExtraAssets}
      />

      <FaviconSection
        faviconImage={faviconImage}
        isSavingFavicon={isSavingFavicon}
        faviconInputRef={faviconInputRef}
        handleSaveFavicon={handleSaveFavicon}
        handleRemoveAssetRequest={handleRemoveAssetRequest}
        handleFileUpload={handleFileUpload}
        openEditor={openEditor}
      />

      {heroNote && (
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 animate-in fade-in">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-500" /> Nota
          </h4>
          <p className="text-sm text-slate-300 italic">"{heroNote}"</p>
        </div>
      )}

      {inspectorOpen && (
        <AdminPhotoInspector
          isOpen={true}
          imageUrl={imageToEdit}
          mode={editTarget === 'patron' || editTarget === 'favicon' ? 'card' : 'hero'}
          initialData={{
            locationName: 'Design Asset',
            user: 'Admin',
            description: `Ottimizzazione ${editTarget}`,
          }}
          onClose={() => setInspectorOpen(false)}
          onSave={handleEditorSave}
        />
      )}
    </div>
  );
};
