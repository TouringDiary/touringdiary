import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';

interface CustomCalendarProps {
    isOpen: boolean;
    value: string | null; // Format: YYYY-MM-DD
    minDateStr?: string; // Format: YYYY-MM-DD
    maxDateStr?: string; // Format: YYYY-MM-DD
    align?: 'left' | 'right';
    onChange: (date: string) => void;
    onClose: () => void;
    onClearRequest?: () => void;
    anchorRef: React.RefObject<HTMLElement | null>;
}

const parseDateString = (dateStr: string | null): Date | null => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return null;
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
};

const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getTodayLocalDateString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


export const CustomCalendar: React.FC<CustomCalendarProps> = ({
    isOpen, value, minDateStr, maxDateStr, align = 'left',
    onChange, onClose, onClearRequest, anchorRef,
}) => {
    const [currentMonth, setCurrentMonth] = useState<Date>(() => {
        const initialDate = parseDateString(value) || new Date();
        return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
    });

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDayClick = (day: number) => {
        const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateStr = formatDateString(selectedDate);

        if (minDateStr) {
            const minDate = parseDateString(minDateStr);
            if (minDate && selectedDate < minDate) {
                return;
            }
        }

        onChange(dateStr);
        onClose();
    };

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);

    const monthNames = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    const dayNames = ['LU', 'MA', 'ME', 'GI', 'VE', 'SA', 'DO'];

    const todayStr = getTodayLocalDateString();
    const today = parseDateString(todayStr)!;

    const selectedDateObj = parseDateString(value);
    const minDateObj = parseDateString(minDateStr || null);

    const rangeStart = (maxDateStr && value && value <= maxDateStr) ? value : (minDateStr && value && minDateStr < value ? minDateStr : null);
    const rangeEnd = (maxDateStr && value && value <= maxDateStr) ? maxDateStr : (minDateStr && value && minDateStr < value ? value : null);

    const isRangeStart = (dateStr: string) => rangeStart && rangeEnd && dateStr === rangeStart;
    const isRangeEnd = (dateStr: string) => rangeStart && rangeEnd && dateStr === rangeEnd;
    const isBetween = (dateStr: string) => rangeStart && rangeEnd && dateStr > rangeStart && dateStr < rangeEnd;
    const isFullRange = rangeStart && rangeEnd;

    return (
        <AnchoredPopover
            isOpen={isOpen}
            onClose={onClose}
            anchorRef={anchorRef}
            align={align}
            role="dialog"
            className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 w-64"
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="font-bold text-white text-sm w-28 text-center">
                        {monthNames[month]} {year}
                    </div>
                    <button
                        onClick={handleNextMonth}
                        className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); if (value) onClearRequest?.(); }}
                    disabled={!value}
                    className={`p-1 transition-colors shrink-0 ${value ? 'text-slate-400 hover:text-red-500 cursor-pointer' : 'text-slate-500 opacity-40 cursor-not-allowed'}`}
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 mb-2 relative">
                {dayNames.map(day => (
                    <div key={day} className="w-8 h-8 flex items-center justify-center text-[10px] font-semibold tracking-wide text-slate-100 relative after:absolute after:right-0 after:top-1 after:bottom-1 after:w-px after:bg-slate-600/40 last:after:hidden">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 relative">
                {blanks.map(blank => (
                    <div key={`blank-${blank}`} className="w-8 h-8"></div>
                ))}

                {days.map(day => {
                    const currentLoopDate = new Date(year, month, day);
                    const dateStr = formatDateString(currentLoopDate);
                    const isToday = currentLoopDate.getTime() === today.getTime();
                    const isSelected = selectedDateObj && currentLoopDate.getTime() === selectedDateObj.getTime();

                    const isStart = isRangeStart(dateStr);
                    const isEnd = isRangeEnd(dateStr);
                    const isMid = isBetween(dateStr);
                    const isSame = isStart && isEnd;

                    let isDisabled = false;
                    if (minDateObj && currentLoopDate < minDateObj) {
                        if (!isSelected) {
                            isDisabled = true;
                        }
                    }

                    const hideSeparator = isFullRange && (isStart || isMid) && !isSame;

                    return (
                        <div key={day} className={`relative w-8 h-8 flex items-center justify-center ${hideSeparator ? '' : 'after:absolute after:right-0 after:top-1 after:bottom-1 after:w-px after:bg-slate-600/30 last:after:hidden'}`}>
                            <button
                                disabled={isDisabled}
                                onClick={() => handleDayClick(day)}
                                className={`
                                    w-8 h-8 flex items-center justify-center text-xs font-medium transition-colors border
                                    ${isDisabled ? 'text-slate-600 cursor-not-allowed border-slate-600/40 rounded-full' : 'cursor-pointer hover:bg-slate-700 text-slate-200 border-slate-600/40'}
                                    ${isToday && !isSelected && !isMid ? 'border-orange-400 text-orange-400 bg-orange-400/10 rounded-full' : ''}
                                    ${isMid ? 'bg-amber-500/20 text-amber-200 border-transparent rounded-none hover:bg-amber-500/30' : ''}
                                    ${isStart || isEnd ? 'bg-amber-500 text-white font-bold hover:bg-amber-600 border-amber-500 z-floating-panel' : ''}
                                    ${isSame ? 'rounded-full' : (isStart ? 'rounded-l-full' : (isEnd ? 'rounded-r-full' : (isMid ? '' : 'rounded-full')))}
                                    ${isSelected && !isStart && !isEnd && !isMid ? 'bg-amber-600 text-white font-bold border-amber-600 rounded-full' : ''}
                                `}
                            >
                                {day}
                            </button>
                        </div>
                    );
                })}
            </div>
        </AnchoredPopover>
    );
};
