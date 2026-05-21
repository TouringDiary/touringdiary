import React from 'react';
import { Pencil, X } from 'lucide-react';
import { CustomCalendar } from '@/components/common/CustomCalendar';
import { Itinerary } from '@/types';

interface DiaryHeaderDateRangeProps {
    itinerary: Itinerary;
    displayStartDate: string;
    setDisplayStartDate: (v: string) => void;
    handleDateBlur: (e: React.FocusEvent<HTMLInputElement>, type: 'startDate' | 'endDate') => void;
    isStartCalendarOpen: boolean;
    setIsStartCalendarOpen: (v: boolean) => void;
    setIsEndCalendarOpen: (v: boolean) => void;
    minDateStr: string;
    handleLocalDateChange: (type: 'startDate' | 'endDate', val: string) => void;
    setDateToClear: (v: 'startDate' | 'endDate' | null) => void;
    highlightDates: boolean;
    displayEndDate: string;
    setDisplayEndDate: (v: string) => void;
    isEndCalendarOpen: boolean;
    endMinDateStr: string;
}

export const DiaryHeaderDateRange: React.FC<DiaryHeaderDateRangeProps> = ({
    itinerary, displayStartDate, setDisplayStartDate, handleDateBlur, isStartCalendarOpen, setIsStartCalendarOpen, setIsEndCalendarOpen, minDateStr, handleLocalDateChange, setDateToClear, highlightDates, displayEndDate, setDisplayEndDate, isEndCalendarOpen, endMinDateStr
}) => {
    return (
        <div className="flex items-center gap-3">
            <div className="relative flex-1">
                <div className={`flex items-center bg-slate-800 rounded border h-9 overflow-hidden ${highlightDates ? 'border-red-500 ring-2 ring-red-500 animate-pulse' : 'border-slate-700'}`}>
                    <div className="h-full w-10 flex items-center justify-center border-r border-slate-600/50 bg-slate-900/30 shrink-0">
                         <span className="text-[10px] font-bold text-amber-500 uppercase leading-none">Dal</span>
                    </div>
                    <div className="relative flex-1 h-full">
                        <input 
                            type="text"
                            placeholder="GG/MM/AAAA"
                            className="w-full h-full bg-transparent text-sm font-bold text-center text-white focus:outline-none font-mono" 
                            value={displayStartDate} 
                            onChange={(e) => setDisplayStartDate(e.target.value)}
                            onBlur={(e) => handleDateBlur(e, 'startDate')}
                        />
                        <div
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-dropdown cursor-pointer select-none pointer-events-auto flex items-center justify-center w-6 h-6 group"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isStartCalendarOpen) {
                                    setIsStartCalendarOpen(false);
                                } else {
                                    setIsStartCalendarOpen(true);
                                    setIsEndCalendarOpen(false);
                                }
                            }}
                        >
                            {isStartCalendarOpen ? (
                                <X className="w-4 h-4 text-red-500" />
                            ) : (
                                <>
                                    <span className="text-base group-hover:hidden">📅</span>
                                    <Pencil className="w-4 h-4 text-amber-500 hidden group-hover:block" />
                                </>
                            )}
                        </div>
                    </div>
                </div>
                {isStartCalendarOpen && (
                    <CustomCalendar
                        value={itinerary.startDate}
                        minDateStr={minDateStr}
                        maxDateStr={itinerary.endDate || undefined}
                        onChange={(val) => handleLocalDateChange('startDate', val)}
                        onClose={() => setIsStartCalendarOpen(false)}
                        onClearRequest={() => setDateToClear('startDate')}
                    />
                )}
            </div>
            <div className="relative flex-1">
                <div className={`flex items-center bg-slate-800 rounded border h-9 overflow-hidden ${highlightDates ? 'border-red-500 ring-2 ring-red-500 animate-pulse' : 'border-slate-700'}`}>
                    <div className="h-full w-10 flex items-center justify-center border-r border-slate-600/50 bg-slate-900/30 shrink-0">
                        <span className="text-[10px] font-bold text-amber-500 uppercase leading-none">Al</span>
                    </div>
                    <div className="relative flex-1 h-full">
                        <input 
                            type="text"
                            placeholder="GG/MM/AAAA"
                            className="w-full h-full bg-transparent text-sm font-bold text-center text-white focus:outline-none font-mono" 
                            value={displayEndDate} 
                            onChange={(e) => setDisplayEndDate(e.target.value)}
                            onBlur={(e) => handleDateBlur(e, 'endDate')}
                        />
                        <div
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-dropdown cursor-pointer select-none pointer-events-auto flex items-center justify-center w-6 h-6 group"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isEndCalendarOpen) {
                                    setIsEndCalendarOpen(false);
                                } else {
                                    setIsEndCalendarOpen(true);
                                    setIsStartCalendarOpen(false);
                                }
                            }}
                        >
                            {isEndCalendarOpen ? (
                                <X className="w-4 h-4 text-red-500" />
                            ) : (
                                <>
                                    <span className="text-base group-hover:hidden">📅</span>
                                    <Pencil className="w-4 h-4 text-amber-500 hidden group-hover:block" />
                                </>
                            )}
                        </div>
                    </div>
                </div>
                {isEndCalendarOpen && (
                    <CustomCalendar
                        value={itinerary.endDate}
                        minDateStr={itinerary.startDate || undefined}
                        align="right"
                        onChange={(val) => handleLocalDateChange('endDate', val)}
                        onClose={() => setIsEndCalendarOpen(false)}
                        onClearRequest={() => setDateToClear('endDate')}
                    />
                )}
            </div>
        </div>
    );
};
