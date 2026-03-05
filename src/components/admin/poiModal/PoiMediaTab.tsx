
import React from 'react';
import { AdminImageInput } from '../AdminImageInput';
import { PointOfInterest } from '../../../types/index';

interface PoiMediaTabProps {
    formData: PointOfInterest;
    updateField: (field: keyof PointOfInterest, value: any) => void;
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
                    updateField('imageCredit', data.imageCredit); 
                    updateField('imageLicense', data.imageLicense); 
                }} 
                onValidityChange={setIsImageValid}
                category={formData.category} // NEW: Passiamo la categoria per il fallback visivo
            />
        </div>
    );
};
