
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AiItineraryItem, DailyLogistics } from '../services/ai';

export interface AiSessionState {
    destination: string;
    preferences: string;
    startDate: string;
    endDate: string;
    daysCount: number;
    startTime: string;
    endTime: string;
    startLocation: string; 
    endLocation: string;   
    dailyLogistics: DailyLogistics[];
    generatedPlan: AiItineraryItem[] | null;
    style: 'balanced' | 'leisure' | 'culture' | 'taste' | 'romantic' | 'adventure';
    globalMaxDistance: number; 
    bufferMinutes: number;
}

interface AiPlannerContextType {
    aiSession: AiSessionState;
    updateAiSession: (updates: Partial<AiSessionState>) => void;
    resetAiSession: () => void;
}

const AiPlannerContext = createContext<AiPlannerContextType | undefined>(undefined);

export const AiPlannerProvider = ({ children }: { children?: ReactNode }) => {
    const [aiSession, setAiSession] = useState<AiSessionState>({
        destination: '',
        preferences: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        daysCount: 2,
        startTime: '09:30',
        endTime: '19:30',
        startLocation: '', // DEFAULT VUOTO
        endLocation: '',   // DEFAULT VUOTO
        dailyLogistics: [],
        generatedPlan: null,
        style: 'balanced',
        globalMaxDistance: 5, 
        bufferMinutes: 15
    });

    const updateAiSession = useCallback((updates: Partial<AiSessionState>) => {
        setAiSession(prev => ({ ...prev, ...updates }));
    }, []);

    const resetAiSession = useCallback(() => {
        setAiSession({
            destination: '',
            preferences: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            daysCount: 2,
            startTime: '09:30',
            endTime: '19:30',
            startLocation: '', // DEFAULT VUOTO
            endLocation: '',   // DEFAULT VUOTO
            dailyLogistics: [],
            generatedPlan: null,
            style: 'balanced',
            globalMaxDistance: 5,
            bufferMinutes: 15
        });
    }, []);

    return (
        <AiPlannerContext.Provider value={{ aiSession, updateAiSession, resetAiSession }}>
            {children}
        </AiPlannerContext.Provider>
    );
};

export const useAiPlanner = () => {
    const context = useContext(AiPlannerContext);
    if (!context) throw new Error("useAiPlanner must be used within AiPlannerProvider");
    return context;
};
