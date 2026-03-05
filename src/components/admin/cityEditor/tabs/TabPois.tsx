
import React from 'react';
import { AdminPoiManager } from '../../AdminPoiManager';
import { useCityEditor } from '../../../../context/CityEditorContext';
import { User } from '../../../../types/users';

// Wrapper pulito per mantenere la struttura a tab
export const TabPois = ({ currentUser }: { currentUser?: User }) => {
    const { city } = useCityEditor();

    if (!city) return null;

    return (
        <AdminPoiManager 
            cityId={city.id} 
            cityName={city.name} 
            currentUser={currentUser} 
        />
    );
};
