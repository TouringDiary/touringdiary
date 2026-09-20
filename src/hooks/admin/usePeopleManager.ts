import { usePeopleAI } from './people/usePeopleAI';
import { usePeopleData } from './people/usePeopleData';

export const usePeopleManager = (cityId: string, cityName: string) => {
  const dataLogic = usePeopleData(cityId);

  const aiLogic = usePeopleAI({
    cityId,
    cityName,
    peopleList: dataLogic.peopleList,
    setPeopleList: dataLogic.setPeopleList,
    reloadList: async () => {
      await dataLogic.reloadList();
    },
    selectedIds: dataLogic.selectedIds,
    resetSelection: dataLogic.resetSelection,
  });

  return {
    peopleList: dataLogic.peopleList,
    isLoading: dataLogic.isLoading,
    selectedIds: dataLogic.selectedIds,
    isDeleting: dataLogic.isDeleting,

    processingId: aiLogic.processingId,
    isDiscovering: aiLogic.isDiscovering,
    isBulkProcessing: aiLogic.isBulkProcessing,
    discoveryResults: aiLogic.discoveryResults,
    fieldGenerating: aiLogic.fieldGenerating,
    aiImageStepChoice: aiLogic.aiImageStepChoice,
    setAiImageStepChoice: aiLogic.setAiImageStepChoice,
    aiImageStepModalCopy: aiLogic.aiImageStepModalCopy,

    toggleSelection: dataLogic.toggleSelection,
    toggleAll: dataLogic.toggleAll,
    resetSelection: dataLogic.resetSelection,

    addManualPerson: dataLogic.addManualPerson,
    deletePerson: dataLogic.deletePerson,
    updatePersonLocal: dataLogic.updatePersonLocal,
    savePersonChanges: dataLogic.savePersonChanges,
    toggleStatus: dataLogic.toggleStatus,
    reorderPerson: dataLogic.reorderPerson,

    bulkUpdateStatus: aiLogic.bulkUpdateStatus,
    wipeAndRewritePerson: aiLogic.wipeAndRewritePerson,
    regeneratePortrait: aiLogic.regeneratePortrait,
    completeMissingFieldWithAi: aiLogic.completeMissingFieldWithAi,
    recoverPersonDatesWithAi: aiLogic.recoverPersonDatesWithAi,
    fixPeopleBatch: aiLogic.fixPeopleBatch,
    runDiscovery: aiLogic.runDiscovery,
    importDiscoveryPerson: aiLogic.importDiscoveryPerson,
    removeDiscoveryResult: aiLogic.removeDiscoveryResult,
  };
};
