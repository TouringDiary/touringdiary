export interface DailyLogistics {
    dayIndex: number;
    start: string;
    end: string;
    startTime: string;
    endTime: string;
}

export interface AiItineraryItem {
    dayIndex: number;
    time: string;
    activityName: string;
    category: string;
    description: string;
    lat: number;
    lng: number;
    matchedPoiId?: string;
    address?: string;
    visitDuration?: string;
}