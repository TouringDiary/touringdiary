import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AiLimitsConfig } from '../../../types';

// Zod schema con coercizione a numero per una validazione robusta
const aiLimitsSchema = z.object({
    guest: z.coerce.number().min(0), 
    registered: z.coerce.number().min(0),
    premium: z.coerce.number().min(0),
    premium_plus: z.coerce.number().min(0).optional(),
    sponsor: z.coerce.number().min(0),
    pro: z.coerce.number().min(0),
    shop: z.coerce.number().min(0),
});

type AiLimitsFormData = z.infer<typeof aiLimitsSchema>;

interface AiLimitsTabProps {
    config?: AiLimitsConfig; // Resa opzionale per sicurezza
    onUpdate: (newConfig: AiLimitsConfig) => void;
}

const AiLimitsTab: React.FC<AiLimitsTabProps> = ({ config, onUpdate }) => {
    
    const { control, handleSubmit, formState: { errors, isDirty } } = useForm<AiLimitsFormData>({
        resolver: zodResolver(aiLimitsSchema),
        defaultValues: {
            guest: config?.guest ?? 0,
            registered: config?.registered ?? 0,
            premium: config?.premium ?? 0,
            premium_plus: config?.premium_plus ?? 0,
            sponsor: config?.sponsor ?? 0,
            pro: config?.pro ?? 0,
            shop: config?.shop ?? 0,
        }
    });

    // Guardia di sicurezza: se la configurazione non è ancora disponibile, mostra un messaggio di caricamento
    if (!config) {
        return (
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
                <p className="text-gray-400">Caricamento della configurazione...</p>
            </div>
        );
    }

    const onSubmit = (data: AiLimitsFormData) => {
        onUpdate(data as AiLimitsConfig);
    };

    // Estrae i campi in modo sicuro solo dopo aver verificato che 'config' esiste
    const fields = Object.keys(config) as (keyof AiLimitsConfig)[];

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg animate-in fade-in">
            <h2 className="text-2xl font-bold text-amber-400 mb-6">Configurazione Limiti AI</h2>
            <p className="text-gray-400 mb-6">
                Definisci il numero massimo di crediti AI disponibili per ciascun ruolo utente. 
                Questo impatta direttamente sulla frequenza con cui possono utilizzare le funzionalità basate su AI.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {fields.map(fieldName => (
                        <div key={fieldName} className="bg-gray-700 p-4 rounded-md">
                            <label htmlFor={fieldName} className="block text-sm font-medium text-gray-300 capitalize mb-2">
                                {fieldName.replace('_', ' ')}
                            </label>
                            <Controller
                                name={fieldName as any}
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        type="number"
                                        id={fieldName}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition duration-200"
                                        onChange={e => field.onChange(e.target.value === '' ? 0 : e.target.valueAsNumber)}
                                        value={field.value ?? 0}
                                    />
                                )}
                            />
                            {errors[fieldName] && <p className="text-red-500 text-xs mt-1">{errors[fieldName]?.message}</p>}
                        </div>
                    ))}
                </div>

                <div className="flex justify-end mt-8">
                    <button
                        type="submit"
                        disabled={!isDirty}
                        className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-500 text-white font-bold py-2 px-6 rounded-md transition duration-300 shadow-md disabled:cursor-not-allowed"
                    >
                        Salva Modifiche
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AiLimitsTab;
