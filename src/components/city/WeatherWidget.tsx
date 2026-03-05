
import React from 'react';
import { CloudSun, Sun, CloudRain, CloudLightning, Wind, Droplets } from 'lucide-react';
import { CityDetails, CitySummary } from '../../types/index';

interface Props {
    city: CityDetails | CitySummary;
    startDate: string | null;
    endDate: string | null;
}

export const WeatherWidget = ({ city, startDate, endDate }: Props) => {
    // Determine the start date for the forecast
    const getForecastStartDate = () => {
        if (startDate) {
            return new Date(startDate);
        }
        return new Date();
    };

    const forecastStart = getForecastStartDate();
    
    // Generate 5 days of forecast starting from forecastStart
    const days = Array.from({ length: 5 }, (_, i) => {
        const d = new Date(forecastStart);
        d.setDate(d.getDate() + i);
        return d;
    });

    // Mock data generator
    const getWeather = (date: Date) => {
        const seed = date.getDate() + city.name.length;
        const r = (Math.sin(seed) + 1) / 2; // 0 to 1

        if (r > 0.7) return { icon: Sun, label: 'Sole', temp: '24°', color: 'text-amber-400', bg: 'from-amber-500/20 to-orange-600/20' };
        if (r > 0.4) return { icon: CloudSun, label: 'Nuvoloso', temp: '21°', color: 'text-sky-400', bg: 'from-sky-500/20 to-blue-600/20' };
        if (r > 0.2) return { icon: CloudRain, label: 'Pioggia', temp: '18°', color: 'text-blue-400', bg: 'from-blue-600/20 to-slate-700/20' };
        return { icon: CloudLightning, label: 'Temp.', temp: '16°', color: 'text-purple-400', bg: 'from-purple-600/20 to-slate-800/20' };
    };

    const currentWeather = getWeather(days[0]);

    return (
        // CHANGED: Increased fixed height to h-[13rem] to match sidebar relaxing
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg flex flex-col no-print flex-shrink-0 h-[13rem] relative group w-full">
             {/* Background Gradient */}
             <div className={`absolute inset-0 bg-gradient-to-b ${currentWeather.bg} opacity-30`}></div>
             
             {/* TOP SECTION: City & Main Stats (Compact) */}
             <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 pt-1 pb-1 min-h-0">
                 
                 <div className="bg-slate-950/60 px-2 py-0.5 rounded-full border border-white/5 backdrop-blur-sm shadow-sm mb-1">
                     <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{city.name}</span>
                 </div>

                 <div className="flex items-center gap-3 transform hover:scale-105 transition-transform duration-500">
                    <currentWeather.icon className={`w-8 h-8 lg:w-10 lg:h-10 ${currentWeather.color} drop-shadow-lg`}/>
                    <div className="flex flex-col leading-none">
                        <span className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tighter shadow-black drop-shadow-md">
                            {currentWeather.temp}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                            {currentWeather.label}
                        </span>
                    </div>
                 </div>
                 
                 {/* Micro Stats Row */}
                 <div className="flex gap-4 mt-2">
                     <div className="flex items-center gap-1 text-slate-500">
                         <Wind className="w-3.5 h-3.5"/>
                         <span className="text-[10px] font-mono">12km/h</span>
                     </div>
                     <div className="flex items-center gap-1 text-slate-500">
                         <Droplets className="w-3.5 h-3.5 text-blue-400"/>
                         <span className="text-[10px] font-mono">45%</span>
                     </div>
                 </div>
             </div>

             {/* BOTTOM: Horizontal Forecast List (Fixed Height) */}
             <div className="bg-slate-950/60 backdrop-blur-md border-t border-slate-800 h-14 lg:h-16 flex-shrink-0 relative z-20">
                 <div className="flex overflow-x-auto scrollbar-hide w-full h-full items-center px-1">
                    {days.slice(1).map((d, i) => {
                        const w = getWeather(d);
                        return (
                            <div key={i} className="flex-1 min-w-[3rem] h-full hover:bg-white/5 transition-colors flex flex-col items-center justify-center gap-0.5 border-r border-slate-800/30 last:border-0">
                                <span className="text-[8px] font-bold text-slate-500 uppercase">
                                    {d.toLocaleDateString('it-IT', {weekday: 'short'}).substring(0,3)}
                                </span>
                                <w.icon className={`w-4 h-4 ${w.color}`}/>
                                <span className="text-[10px] font-mono font-bold text-white">
                                    {w.temp}
                                </span>
                            </div>
                        )
                    })}
                 </div>
             </div>
        </div>
    );
};
