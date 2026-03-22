
import React from 'react';

interface Props {
    label: string;
    value: number | string; // <-- CORREZIONE: Accetta anche string per l'editing
    path: (string | number)[];
    onUpdate: (path: (string | number)[], value: any) => void;
}

export const NumberInput: React.FC<Props> = ({ label, value, path, onUpdate }) => {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const strValue = e.target.value;

        // Se l'input è vuoto o contiene solo un segno meno, lo si accetta come stringa temporanea
        if (strValue === '' || strValue === '-') {
            onUpdate(path, strValue);
        } else {
            const num = parseFloat(strValue);
            // Aggiorna solo se la stringa è un numero valido per evitare NaN
            if (!isNaN(num)) {
                onUpdate(path, num);
            }
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
            <input
                type="number"
                value={value}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
            />
        </div>
    );
};
