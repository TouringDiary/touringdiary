import React, { useState } from 'react';
import Modal from 'react-modal';
import { useConfig } from '@/context/ConfigContext';
import SponsorPlanCard from '../marketing/SponsorPlanCard';
import { MarketingConfig } from '../../types';

interface UserUpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Definisci qui quali piani mostrare per l'upgrade dell'utente
const USER_UPGRADE_PLANS: (keyof MarketingConfig)[] = ['premiumUser', 'premiumUserPlus'];

const UserUpgradeModal: React.FC<UserUpgradeModalProps> = ({ isOpen, onClose }) => {
    const { configs, isLoading } = useConfig();
    const [selectedPlan, setSelectedPlan] = useState<keyof MarketingConfig | null>(null);

    const marketingConfig = configs.marketing_prices_v2 as MarketingConfig;

    const handleSelectPlan = (planKey: keyof MarketingConfig) => {
        setSelectedPlan(planKey);
        // Qui andrebbe la logica per iniziare il checkout con Stripe o un altro provider
        console.log(`Piano selezionato per l'upgrade: ${planKey}`);
        // Esempio: redirectToCheckout(planKey);
    };

    const customStyles: Modal.Styles = {
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            background: '#1a202c', // Grigio scuro
            border: '1px solid #4a5568', // Grigio più chiaro
            borderRadius: '0.5rem',
            padding: '2rem',
            maxWidth: '90vw',
            width: '600px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1000
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            style={customStyles}
            contentLabel="Upgrade Your Plan"
            ariaHideApp={false} // Necessario per ambienti di test
        >
            <div className="text-white">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-amber-400">Passa a Premium</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors duration-200">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <p className="text-gray-400 mb-8">
                    Sblocca funzionalità potenti e ottieni più crediti AI per pianificare i tuoi viaggi come mai prima d'ora.
                </p>

                {isLoading ? (
                    <div className="text-center">Caricamento piani...</div>
                ) : marketingConfig ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {USER_UPGRADE_PLANS.map(planKey => {
                             const planConfig = marketingConfig[planKey];
                             // Assicuriamoci che planConfig sia del tipo giusto e non un'altra proprietà
                             if (typeof planConfig !== 'object' || !('basePrice' in planConfig)) return null;

                            return (
                                <SponsorPlanCard
                                    key={planKey}
                                    planKey={planKey as string} // Passiamo la chiave come stringa
                                    config={planConfig}
                                    isRecommended={planKey === 'premiumUserPlus'} // Esempio: raccomanda il piano Plus
                                    onSelect={() => handleSelectPlan(planKey)}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center text-red-500">Errore nel caricamento delle configurazioni di marketing.</div>
                )}
            </div>
        </Modal>
    );
};

export default UserUpgradeModal;
