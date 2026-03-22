import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MarketingConfig, MarketingTierConfig } from '../../../types';

// Zod Schema per la validazione di un singolo tier
const tierSchema = z.object({
    basePrice: z.number().min(0, "Il prezzo base non può essere negativo"),
    promoPrice: z.number().min(0, "Il prezzo promo non può essere negativo").nullable(),
    promoLabel: z.string().max(100, "L'etichetta promo è troppo lunga").nullable(),
    promoActive: z.boolean(),
});

// Zod Schema per l'intero form di configurazione marketing
const marketingConfigSchema = z.object({
    // Qui replichiamo le chiavi principali che ci aspettiamo
    silver: tierSchema,
    gold: tierSchema,
    guide: tierSchema,
    shop: tierSchema,
    tourOperator: tierSchema,
    premiumUser: tierSchema,
    premiumUserPlus: tierSchema,
});

type MarketingFormData = z.infer<typeof marketingConfigSchema>;

interface PriceConfiguratorProps {
    config: MarketingConfig;
    onUpdate: (newConfig: Partial<MarketingConfig>) => void;
}

const PriceConfigurator: React.FC<PriceConfiguratorProps> = ({ config, onUpdate }) => {

    const { control, register, handleSubmit, formState: { errors, isDirty } } = useForm<MarketingFormData>({
        resolver: zodResolver(marketingConfigSchema),
        defaultValues: {
            silver: config.silver,
            gold: config.gold,
            guide: config.guide,
            shop: config.shop,
            tourOperator: config.tourOperator,
            premiumUser: config.premiumUser,
            premiumUserPlus: config.premiumUserPlus,
        }
    });

    const onSubmit = (data: MarketingFormData) => {
        onUpdate(data);
    };
    
    const tierKeys = Object.keys(config).filter(k => typeof config[k as keyof MarketingConfig] === 'object' && 'basePrice' in config[k as keyof MarketingConfig]) as (keyof MarketingFormData)[];

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold text-amber-400 mb-6">Configurazione Prezzi Piani</h2>
            <p className="text-gray-400 mb-8">
                Modifica i prezzi e le promozioni per ciascun piano di abbonamento. Le modifiche avranno effetto immediato per i nuovi utenti.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {tierKeys.map(tierName => (
                        <div key={tierName} className="bg-gray-700 p-5 rounded-lg">
                            <h3 className="text-lg font-bold text-white capitalize mb-4 border-b border-gray-600 pb-2">{tierName.replace('User', ' User')}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor={`${tierName}.basePrice`} className="block text-sm font-medium text-gray-300 mb-1">Prezzo Base (€)</label>
                                    <Controller
                                        name={`${tierName}.basePrice`}
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} type="number" step="0.01" className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white" onChange={e => field.onChange(parseFloat(e.target.value))} />
                                        )}
                                    />
                                    {errors[tierName]?.basePrice && <p className="text-red-500 text-xs mt-1">{errors[tierName]?.basePrice?.message}</p>}
                                </div>

                                <div>
                                    <label htmlFor={`${tierName}.promoPrice`} className="block text-sm font-medium text-gray-300 mb-1">Prezzo Promo (€)</label>
                                     <Controller
                                        name={`${tierName}.promoPrice`}
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} value={field.value ?? ''} type="number" step="0.01" className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white" onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} />
                                        )}
                                    />
                                    {errors[tierName]?.promoPrice && <p className="text-red-500 text-xs mt-1">{errors[tierName]?.promoPrice?.message}</p>}
                                </div>

                                <div>
                                    <label htmlFor={`${tierName}.promoLabel`} className="block text-sm font-medium text-gray-300 mb-1">Etichetta Promo</label>
                                    <input {...register(`${tierName}.promoLabel`)} className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white" />
                                    {errors[tierName]?.promoLabel && <p className="text-red-500 text-xs mt-1">{errors[tierName]?.promoLabel?.message}</p>}
                                </div>
                                
                                <div className="flex items-center pt-2">
                                    <Controller
                                        name={`${tierName}.promoActive`}
                                        control={control}
                                        render={({ field }) => (
                                            <input {...field} type="checkbox" checked={field.value} className="h-4 w-4 rounded bg-gray-800 border-gray-600 text-amber-600 focus:ring-amber-500" />
                                        )}
                                    />
                                    <label htmlFor={`${tierName}.promoActive`} className="ml-2 block text-sm text-gray-300">Promozione Attiva</label>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={!isDirty}
                        className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-500 text-white font-bold py-2 px-6 rounded-md transition duration-300 shadow-md disabled:cursor-not-allowed"
                    >
                        Salva Prezzi
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PriceConfigurator;