import React from 'react';
import { Globe, MapPin, Sun, Camera, Users, AlertTriangle, Info, Calendar, Gift, Clock, Car, Megaphone } from 'lucide-react';
import { NewsTickerItem } from '../../types/index';
import { useDynamicStyles } from '../../hooks/useDynamicStyles';
import { useNewsTicker } from '@/hooks/useNewsTicker';
import { useFeatureFlag } from '@/context/PlatformControlContext';
import { useSystemMessage } from '@/hooks/useSystemMessage';
import {
    PLATFORM_FEATURE_FLAG_KEYS,
    PLATFORM_MESSAGE_TEMPLATE_KEYS,
} from '@/constants/platformFeatureFlags';

export const ICON_MAP: Record<string, React.ElementType> = {
    'globe': Globe, 'map': MapPin, 'sun': Sun, 'camera': Camera,
    'users': Users, 'alert': AlertTriangle, 'info': Info, 'calendar': Calendar,
    'gift': Gift, 'clock': Clock, 'car': Car, 'megaphone': Megaphone
};

interface NewsTickerProps {
    overrideSpeed?: number;
    overrideItems?: NewsTickerItem[];
    isVisible?: boolean;
}

export const NewsTicker = ({ overrideSpeed, overrideItems, isVisible = true }: NewsTickerProps) => {
    const { newsItems, speed } = useNewsTicker({ overrideSpeed, overrideItems });

    const labelStyle = useDynamicStyles('ticker_label', false);
    const textStyle = useDynamicStyles('ticker_text', false);

    const maintenanceFlag = useFeatureFlag(PLATFORM_FEATURE_FLAG_KEYS.PLATFORM_MAINTENANCE);
    const maintenanceOn = maintenanceFlag?.enabled ?? false;
    const { getText: getMaintenanceText } = useSystemMessage(
        PLATFORM_MESSAGE_TEMPLATE_KEYS.MAINTENANCE_TICKER
    );
    const maintenanceCopy = getMaintenanceText({});
    const maintenanceLabel = maintenanceCopy.title || 'Manutenzione';
    const maintenanceBody =
        maintenanceCopy.body ||
        'Piattaforma in manutenzione programmata. Alcune funzioni possono essere limitate.';

    const hasScrollingNews = newsItems.length > 0;
    if (!maintenanceOn && !hasScrollingNews) return null;

    return (
        <div
            className={`
                relative w-full h-8 bg-slate-900 border-b border-slate-800 z-floating-panel flex items-center overflow-hidden shadow-md
                transition-all duration-500 ease-in-out
                ${isVisible ? 'mt-0 opacity-100' : '-mt-8 opacity-0 pointer-events-none'}
                md:mt-0 md:opacity-100 md:pointer-events-auto
            `}
        >
            <div className={`${labelStyle} bg-amber-600 px-3 h-full flex items-center justify-center z-dropdown shadow-lg flex-shrink-0 relative border-r border-amber-700 max-md:!text-[10px]`}>
                NEWS
            </div>

            {/* DL-P06: messaggio manutenzione fisso — altre news scorrono */}
            {maintenanceOn ? (
                <div className="flex-shrink-0 h-full flex items-center gap-2 px-3 border-r border-orange-500/40 bg-orange-950/50 max-w-[55%] sm:max-w-[40%]">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                    <span className={`${textStyle} text-orange-100 truncate max-md:!text-[10px]`} title={maintenanceBody}>
                        <span className="font-bold md:mr-1">
                            {maintenanceLabel}
                            <span className="hidden md:inline">:</span>
                        </span>
                        <span className="hidden md:inline">{maintenanceBody}</span>
                    </span>
                </div>
            ) : null}

            <div className="flex-1 overflow-hidden h-full flex items-center relative bg-slate-950 min-w-0">
                {hasScrollingNews ? (
                    <div
                        className="inline-block whitespace-nowrap pl-[100%] animate-marquee will-change-transform"
                        style={{ animationDuration: `${speed}s` }}
                    >
                        <div className="flex items-center h-full">
                            {newsItems.map((item, i) => {
                                const Icon = ICON_MAP[item.icon] || Globe;
                                const uniqueKey = item.id || `ticker-item-${i}`;
                                return (
                                    <span key={uniqueKey} className={`mx-10 ${textStyle} flex items-center gap-2.5 max-md:!text-[10px]`}>
                                        <Icon className="w-3.5 h-3.5 text-amber-500 flex-shrink-0"/>
                                        <span dangerouslySetInnerHTML={{ __html: item.text || '' }} />
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                ) : null}
            </div>

            <style>{`
                @keyframes marquee {
                    0% { transform: translate3d(0, 0, 0); }
                    100% { transform: translate3d(-100%, 0, 0); }
                }
                .animate-marquee {
                    animation-name: marquee;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
};
