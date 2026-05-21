
import React from 'react';
import { AdminImageInput } from '../AdminImageInput';
import { PointOfInterest } from '../../../types/index';
import { PoiFormData } from '../../../types/write/poiForm';

interface PoiMediaTabProps {
    formData: PoiFormData;
    updateField: <K extends keyof PoiFormData>(field: K, value: PoiFormData[K]) => void;
    setIsImageValid: (isValid: boolean) => void;
}

export const PoiMediaTab = ({ formData, updateField, setIsImageValid }: PoiMediaTabProps) => {
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <AdminImageInput 
                imageUrl={formData.imageUrl} 
                imageCredit={formData.imageCredit} 
                imageLicense={formData.imageLicense} 
                onChange={(data) => { 
                    updateField('imageUrl', data.imageUrl); 
                    updateField('image_status', data.image_status);
                    updateField('imageCredit', data.imageCredit); 
                    updateField('imageLicense', data.imageLicense); 
                }} 
                onValidityChange={setIsImageValid}
                category={formData.category} // NEW: Passiamo la categoria per il fallback visivo
            />
        </div>
    );
};
