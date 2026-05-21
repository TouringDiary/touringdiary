import React from 'react';
import { Store, ShoppingCart, Bus, User } from 'lucide-react';
import { PLAN_TYPES, PlanType } from '@/constants/planTypes';

interface SponsorTypeSelectorProps {
    activeType: PlanType;
    onChange: (type: PlanType) => void;
}

const TYPE_CONFIG = [
    { id: PLAN_TYPES.LOCAL_ACTIVITY, label: 'Attività\nCommerciale', icon: Store, activeClass: 'bg-amber-600 text-white shadow-lg ring-1 ring-amber-400/50' },
    { id: PLAN_TYPES.DIGITAL_SHOWCASE, label: 'Bottega\n& Shop', icon: ShoppingCart, activeClass: 'bg-indigo-600 text-white shadow-lg ring-1 ring-indigo-400/50' },
    { id: PLAN_TYPES.TOUR_OPERATOR, label: 'Tour\nOperator', icon: Bus, activeClass: 'bg-cyan-600 text-white shadow-lg ring-1 ring-cyan-400/50' },
    { id: PLAN_TYPES.TOUR_GUIDE, label: 'Guida\nTuristica', icon: User, activeClass: 'bg-purple-600 text-white shadow-lg ring-1 ring-purple-400/50' }
] as const;

export const SponsorTypeSelector = ({ activeType, onChange }: SponsorTypeSelectorProps) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1.5 bg-slate-900 rounded-2xl border border-slate-800 mb-8 shadow-inner">
            {TYPE_CONFIG.map(type => (
                <button 
                    key={type.id}
                    type="button"
                    onClick={() => onChange(type.id)} 
                    className={`
                        w-full px-2 py-4 rounded-xl transition-all 
                        flex flex-col items-center justify-center gap-2
                        text-center h-full
                        ${activeType === type.id 
                            ? type.activeClass
                            : 'text-slate-500 hover:text-white hover:bg-slate-800'
                        }
                    `}
                >
                    <type.icon className="w-6 h-6 md:w-7 md:h-7 mb-0.5"/> 
                    <span className="text-[10px] font-black uppercase tracking-wider leading-tight whitespace-pre-line">{type.label}</span>
                </button>
            ))}
        </div>
    );
};
