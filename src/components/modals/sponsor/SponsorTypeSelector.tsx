
import React from 'react';
import { Store, ShoppingCart, Bus, User } from 'lucide-react';

interface SponsorTypeSelectorProps {
    activeType: 'activity' | 'shop' | 'tour_operator' | 'guide';
    onChange: (type: 'activity' | 'shop' | 'tour_operator' | 'guide') => void;
}

export const SponsorTypeSelector = ({ activeType, onChange }: SponsorTypeSelectorProps) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1.5 bg-slate-900 rounded-2xl border border-slate-800 mb-8 shadow-inner">
            {[
                { id: 'activity', label: 'Attività\nCommerciale', icon: Store, color: 'amber' },
                { id: 'shop', label: 'Bottega\n& Shop', icon: ShoppingCart, color: 'indigo' },
                { id: 'tour_operator', label: 'Tour\nOperator', icon: Bus, color: 'cyan' },
                { id: 'guide', label: 'Guida\nTuristica', icon: User, color: 'purple' }
            ].map(type => (
                <button 
                    key={type.id}
                    type="button"
                    onClick={() => onChange(type.id as any)} 
                    className={`
                        w-full px-2 py-4 rounded-xl transition-all 
                        flex flex-col items-center justify-center gap-2
                        text-center h-full
                        ${activeType === type.id 
                            ? `bg-${type.color}-600 text-white shadow-lg ring-1 ring-${type.color}-400/50` 
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
