
import React from 'react';
import { PhotoSubmission, CitySummary } from '../../../types/index';
import { PhotoRow } from './PhotoRow';

interface PhotoTableProps {
    photos: PhotoSubmission[];
    manifest: CitySummary[];
    isSuperAdmin: boolean;
    actions: {
        onStatusUpdate: (id: string, status: 'approved' | 'rejected' | 'pending') => void;
        onDeleteRequest: (photo: PhotoSubmission) => void;
        onOpenInspector: (photo: PhotoSubmission) => void;
        onOpenMetadata: (photo: PhotoSubmission) => void;
    };
}

export const PhotoTable = ({ photos, manifest, isSuperAdmin, actions }: PhotoTableProps) => {
    return (
        <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-950 text-slate-400 text-[9px] uppercase tracking-wider font-bold border-b border-slate-800 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 text-center w-20">Anteprima</th>
                            <th className="px-4 py-3">Dettagli & Città</th>
                            <th className="px-4 py-3 w-32 text-center">Ricevuta</th>
                            <th className="px-4 py-3 w-32 text-center">Pubblicata</th>
                            <th className="px-4 py-3 w-40 text-center">Stato</th>
                            <th className="px-4 py-3 text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {photos.map(photo => (
                            <PhotoRow 
                                key={photo.id}
                                photo={photo}
                                manifest={manifest}
                                isSuperAdmin={isSuperAdmin}
                                actions={actions}
                            />
                        ))}
                    </tbody>
                </table>
                {photos.length === 0 && <div className="py-20 text-center text-slate-600 italic">Nessuna foto trovata in questa sezione.</div>}
            </div>
        </div>
    );
};
