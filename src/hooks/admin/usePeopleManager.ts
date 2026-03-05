
import { usePeopleData } from './people/usePeopleData';
import { usePeopleAI } from './people/usePeopleAI';

export const usePeopleManager = (cityId: string, cityName: string) => {
    
    // 1. DATA MANAGEMENT (CRUD)
    const dataLogic = usePeopleData(cityId);

    // 2. INTELLIGENCE (AI)
    // Passiamo lo stato e le funzioni di aggiornamento dal Data Hook all'AI Hook
    const aiLogic = usePeopleAI({
        cityId,
        cityName,
        peopleList: dataLogic.peopleList,
        setPeopleList: dataLogic.setPeopleList,
        reloadList: dataLogic.reloadList,
        selectedIds: dataLogic.selectedIds,
        resetSelection: dataLogic.resetSelection,
        mapDbToApp: dataLogic.mapDbToApp
    });

    // 3. EXPOSE UNIFIED API
    // Restituiamo un oggetto che combina entrambi gli hook, mantenendo l'interfaccia usata da CulturePeople.tsx
    return {
        // Data & State
        peopleList: dataLogic.peopleList,
        isLoading: dataLogic.isLoading,
        selectedIds: dataLogic.selectedIds,
        isDeleting: dataLogic.isDeleting,
        
        // AI State
        processingId: aiLogic.processingId,
        isDiscovering: aiLogic.isDiscovering,
        isBulkProcessing: aiLogic.isBulkProcessing,
        discoveryResults: aiLogic.discoveryResults,

        // Selection Actions
        toggleSelection: dataLogic.toggleSelection,
        toggleAll: dataLogic.toggleAll,
        resetSelection: dataLogic.resetSelection,

        // CRUD Actions
        addManualPerson: dataLogic.addManualPerson,
        deletePerson: dataLogic.deletePerson,
        updatePersonLocal: dataLogic.updatePersonLocal,
        savePersonChanges: dataLogic.savePersonChanges,
        toggleStatus: dataLogic.toggleStatus,
        reorderPerson: dataLogic.reorderPerson,

        // AI Actions
        bulkUpdateStatus: aiLogic.bulkUpdateStatus,
        wipeAndRewritePerson: aiLogic.wipeAndRewritePerson,
        regeneratePortrait: aiLogic.regeneratePortrait,
        fixPeopleBatch: aiLogic.fixPeopleBatch,
        runDiscovery: aiLogic.runDiscovery,
        importDiscoveryPerson: aiLogic.importDiscoveryPerson,
        removeDiscoveryResult: aiLogic.removeDiscoveryResult
    };
};
