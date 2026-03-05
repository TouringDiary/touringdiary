
import { SponsorRequest, PartnerLog, SponsorDuration, PointOfInterest, PoiCategory } from '../types/index';
import { DatabaseSponsor } from '../types/database';
import { supabase } from './supabaseClient';
import { GEO_CONFIG } from '../constants/geoConfig';

// --- SERVER SIDE PAGINATION ---

interface SponsorFilterParams {
    page: number;
    pageSize: number;
    status: string; // 'dashboard' | 'pending' | 'active' ...
    search?: string;
    cityId?: string;
    tier?: string; // NEW FILTER
    onlyUnread?: boolean;
    sortBy: 'date' | 'lastModified' | 'endDate';
    sortDir: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    data: T[];
    count: number;
    error?: string;
}

export interface SponsorStats {
    pending: number;
    waiting: number;
    approved: number;
    rejected: number;
    cancelled: number;
    unreadMessages: number; // NEW
}

// NEW: Aggregate counts for tabs + Global Unread Messages
export const getSponsorStats = async (): Promise<SponsorStats> => {
    try {
        // Recuperiamo tutte le richieste per calcolare i messaggi non letti
        // (In produzione con migliaia di record, questo andrebbe fatto con una vista materializzata)
        const { data: allRequests, error } = await supabase.from('sponsors').select('status, partner_logs');

        if (error) {
            // Logghiamo solo se non è un errore di rete transitorio
            if (error.message === 'TypeError: Failed to fetch' || error.message?.includes('fetch')) {
                console.warn("Sponsor Stats offline: Database non raggiungibile.");
            } else {
                console.error("Sponsor Stats DB Error:", error);
            }
            throw error;
        }

        let pending = 0;
        let waiting = 0;
        let approved = 0;
        let rejected = 0;
        let cancelled = 0;
        let unreadMessages = 0;

        (allRequests || []).forEach((r: any) => {
            if (r.status === 'pending') pending++;
            else if (r.status === 'waiting_payment') waiting++;
            else if (r.status === 'approved' || r.status === 'expired') approved++;
            else if (r.status === 'rejected') rejected++;
            else if (r.status === 'cancelled') cancelled++;

            // Conta messaggi non letti (Inbound = dall'utente verso admin)
            if (r.partner_logs && Array.isArray(r.partner_logs)) {
                const unreadInChat = r.partner_logs.filter((l: any) => l.direction === 'inbound' && l.isUnread).length;
                unreadMessages += unreadInChat;
            }
        });

        return {
            pending,
            waiting,
            approved,
            rejected,
            cancelled,
            unreadMessages
        };
    } catch (e: any) {
        // Silenzia l'errore in console se è solo di rete, ritorna zeri per non rompere la UI
        return { pending: 0, waiting: 0, approved: 0, rejected: 0, cancelled: 0, unreadMessages: 0 };
    }
};

// NEW: Fetch ALL sponsors for Dashboard Matrix (Bypassing 1000 row limit via recursive fetching)
export const getAllSponsorsForDashboard = async (): Promise<SponsorRequest[]> => {
    try {
        let allData: DatabaseSponsor[] = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        // Loop finché ci sono dati (per superare il limite di 1000 righe di Supabase)
        while (hasMore) {
            const { data, error } = await supabase
                .from('sponsors')
                .select('*')
                .range(page * pageSize, (page + 1) * pageSize - 1)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                allData = [...allData, ...(data as DatabaseSponsor[])];
                // Se abbiamo ricevuto meno righe del limite, significa che sono finite
                if (data.length < pageSize) {
                    hasMore = false;
                } else {
                    page++;
                }
            } else {
                hasMore = false;
            }
        }
        
        return allData.map(mapDbSponsorToApp);
    } catch (e) {
        console.warn("Dashboard data fetch warning (Network might be busy).");
        return [];
    }
};

// NEW: Lightweight count for Admin Dashboard Badges (Legacy support if needed)
export const getPendingSponsorsCount = async (): Promise<number> => {
    try {
        const { count, error } = await supabase
            .from('sponsors')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
        
        if (error) throw error;
        return count || 0;
    } catch (e: any) {
        // Silenzia completamente gli errori di rete per i contatori background
        return 0;
    }
};

export const getSponsorsPaginated = async (params: SponsorFilterParams): Promise<PaginatedResponse<SponsorRequest>> => {
    let query = supabase
        .from('sponsors')
        .select('*', { count: 'exact' });

    // 1. Filter by Status (Strict logic)
    if (params.status !== 'dashboard') {
        if (params.status === 'approved') {
            query = query.in('status', ['approved', 'expired']);
        } else if (params.status === 'waiting') {
            query = query.eq('status', 'waiting_payment');
        } else {
            // Pending, Rejected, Cancelled match directly
            query = query.eq('status', params.status);
        }
    }

    // 2. Filter by City
    if (params.cityId) {
        query = query.eq('city_id', params.cityId);
    }

    // 3. Filter by Tier (NEW)
    if (params.tier) {
        query = query.eq('tier', params.tier);
    }

    // 4. Filter by Search
    if (params.search) {
        const term = `%${params.search}%`;
        query = query.or(`company_name.ilike.${term},vat_number.ilike.${term},email.ilike.${term}`);
    }

    // 5. Sorting
    const dbSortKey = params.sortBy === 'date' ? 'created_at' : params.sortBy === 'endDate' ? 'end_date' : 'updated_at';
    
    // SAFEGUARD: Se chiediamo updated_at ma non esiste, fallback su created_at per evitare crash in lettura
    // Nota: questo non risolve il problema di scrittura, ma aiuta in lettura se la colonna manca.
    const safeSortKey = dbSortKey === 'updated_at' ? 'created_at' : dbSortKey; 

    // Se stiamo ordinando per una colonna che potrebbe non esistere, catturiamo l'errore a livello di query
    try {
        query = query.order(safeSortKey, { ascending: params.sortDir === 'asc' });
    } catch (e) {
        // Fallback estremo se order fallisce
        query = query.order('created_at', { ascending: false });
    }

    // 6. Pagination
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
        // Se l'errore è sulla colonna updated_at mancante, ritenta senza ordinamento o con ordinamento safe
        if (error.code === '42703') { // Undefined column
             console.warn("Colonna mancante rilevata, ritento query base.");
             // Rilancio query base senza order problematico
             return { data: [], count: 0, error: "Database schema update required. Run SQL script." };
        }
        console.warn("DB Error getSponsorsPaginated (Network?):", error.message);
        throw error;
    }

    const mappedData = (data as DatabaseSponsor[]).map(mapDbSponsorToApp);

    let finalData = mappedData;
    if (params.onlyUnread) {
            finalData = mappedData.filter(r => r.partnerLogs?.some(l => l.isUnread && l.direction === 'inbound'));
    }

    return {
        data: finalData,
        count: count || 0
    };
};

// --- HELPER MAPPING ---
const mapDbSponsorToApp = (db: DatabaseSponsor): SponsorRequest => ({
    id: db.id,
    cityId: db.city_id || '',
    contactName: db.contact_name,
    companyName: db.company_name,
    vatNumber: db.vat_number,
    email: db.email,
    phone: db.phone,
    address: db.address || undefined,
    status: db.status as any,
    date: db.created_at,
    tier: db.tier as any,
    amount: db.amount || 0,
    endDate: db.end_date || undefined,
    startDate: db.start_date || undefined,
    plan: db.plan as any,
    invoiceNumber: db.invoice_number || undefined,
    adminNotes: db.admin_notes || undefined,
    rejectionReason: db.rejection_reason || undefined,
    partnerLogs: (db.partner_logs as unknown as PartnerLog[]) || [],
    type: (db.type as any) || 'activity',
    poiCategory: extractCategoryFromNotes(db.admin_notes || undefined),
    message: extractDescriptionFromNotes(db.admin_notes || undefined)
});

// --- CLOUD ONLY FETCH ---
export const getSponsorsAsync = async (): Promise<SponsorRequest[]> => {
    // Recupera TUTTI gli sponsor (usato per Dashboard stats e map)
    const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        // Silenzioso per evitare spam in console
        return [];
    }
    return (data as DatabaseSponsor[]).map(mapDbSponsorToApp);
};

// --- USER SIDE MESSAGING ---

export const getSponsorRequestsByEmail = async (email: string): Promise<SponsorRequest[]> => {
    if (!email) return [];
    try {
        const { data, error } = await supabase
            .from('sponsors')
            .select('*')
            .eq('email', email)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data as DatabaseSponsor[]).map(mapDbSponsorToApp);
    } catch (e) {
        console.warn("Error fetching user sponsor requests (Network?):", e);
        return [];
    }
};

export const sendUserMessage = async (requestId: string, message: string): Promise<void> => {
    try {
        // 1. Recupera logs esistenti
        const { data: record, error: fetchError } = await supabase
            .from('sponsors')
            .select('partner_logs')
            .eq('id', requestId)
            .maybeSingle();

        if (fetchError || !record) throw new Error("Request not found");

        const currentLogs = (record.partner_logs as any) || [];
        
        // 2. Aggiungi nuovo messaggio
        const newLog: PartnerLog = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            type: 'message',
            direction: 'inbound', // Da Utente a Admin
            message: message,
            isUnread: true // Per l'admin
        };

        const newLogs = [...currentLogs, newLog];

        // 3. Salva - SENZA toccare updated_at per evitare il crash se la colonna manca
        const { error: updateError } = await supabase
            .from('sponsors')
            .update({ partner_logs: newLogs }) 
            .eq('id', requestId);

        if (updateError) throw updateError;

    } catch (e) {
        console.error("Error sending user message:", e);
        throw e;
    }
};

export const markUserLogsAsRead = async (requestId: string): Promise<void> => {
    try {
         const { data: record } = await supabase
            .from('sponsors')
            .select('partner_logs')
            .eq('id', requestId)
            .maybeSingle();

        if (!record) return;

        const currentLogs = (record.partner_logs as PartnerLog[]) || [];
        
        // Segna come letti solo quelli outbound (dall'admin all'utente)
        const hasUnread = currentLogs.some(l => l.direction === 'outbound' && l.isUnread);
        
        if (!hasUnread) return;

        const updatedLogs = currentLogs.map(l => {
            if (l.direction === 'outbound' && l.isUnread) {
                return { ...l, isUnread: false };
            }
            return l;
        });

        await supabase
            .from('sponsors')
            .update({ partner_logs: updatedLogs })
            .eq('id', requestId);

    } catch (e) {
        // Silent fail
    }
};

const extractCategoryFromNotes = (notes?: string): PoiCategory | undefined => {
    if (!notes) return undefined;
    const match = notes.match(/Categoria: (\w+)/);
    if (match && match[1]) {
        const val = match[1].toLowerCase();
        if (val.includes('ristorazione') || val === 'food') return 'food';
        if (val.includes('shop') || val === 'shopping' || val === 'artigianato' || val === 'moda' || val === 'cantina' || val === 'gusto') return 'shop';
        if (val.includes('hotel') || val === 'alloggi') return 'hotel';
        if (val.includes('svago') || val === 'leisure') return 'leisure';
        if (val.includes('natura')) return 'nature';
        return 'shop'; 
    }
    return undefined;
};

const extractDescriptionFromNotes = (notes?: string): string | undefined => {
    if (!notes) return undefined;
    const match = notes.match(/Descrizione: ([\s\S]*?)(?=\nOrari:|$)/);
    return match ? match[1].trim() : undefined;
};

// --- SYNC / LOCAL FALLBACKS ---

export const getActiveSponsorsPoi = (cityId: string): PointOfInterest[] => {
    // This function must now be async in the component using it, or use a cached state.
    // For immediate fix, we return empty here and components should use fetchSponsorsByCityAsync
    return []; 
};

export const fetchSponsorsByCityAsync = async (cityId: string): Promise<PointOfInterest[]> => {
    const reqs = await getSponsorsAsync();
    const today = new Date().toISOString().split('T')[0];
    return reqs
        .filter(s => {
            const validStatus = s.status === 'approved' || s.status === 'expired';
            const cityMatch = s.cityId === cityId;
            const activeDate = s.startDate && (!s.endDate || s.endDate >= today);
            return validStatus && cityMatch && activeDate;
        })
        .map(s => convertSponsorToPoi(s));
};

// --- ACTIONS (PURE DB WRITE) ---

export const submitSponsorRequest = async (formData: any, type: 'activity'|'shop'|'guide'|'tour_operator', plan: string): Promise<boolean> => {
    const newId = crypto.randomUUID();
    let savedCategory = formData.category || 'shop';
    
    const adminNotes = `[RICHIESTA ORIGINALE]\nRagione Sociale: ${formData.companyName}\nSDI: ${formData.sdiCode}\nCategoria: ${savedCategory}\nDescrizione: ${formData.description}\nOrari: ${formData.openingHours}`;

    try {
        const { error } = await supabase.from('sponsors').insert({
            id: newId,
            city_id: 'napoli', 
            contact_name: formData.contactName,
            company_name: formData.publicName, 
            vat_number: formData.vatNumber,
            email: formData.adminEmail,
            phone: formData.adminPhone,
            address: formData.address,
            status: 'pending',
            tier: plan === 'gold' ? 'gold' : plan === 'silver' ? 'silver' : 'standard',
            type: type,
            created_at: new Date().toISOString(),
            admin_notes: adminNotes,
            partner_logs: [] // Init empty logs
        });

        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Sponsor submit error:", e);
        return false;
    }
};

export const updateSponsorStatus = async (id: string, status: string): Promise<void> => {
    try {
        const { error } = await supabase.from('sponsors').update({ status }).eq('id', id);
        if (error) throw error;
    } catch (e) { console.error("Error updating sponsor status:", e); throw e; }
};

export const activateSponsor = async (id: string, startDate: string, duration: SponsorDuration, amount: number, invoiceNumber: string): Promise<void> => {
    let finalEndDate: string | null = null;
    const end = new Date(startDate);
    switch(duration) {
        case '1_month': end.setMonth(end.getMonth() + 1); break;
        case '3_months': end.setMonth(end.getMonth() + 3); break;
        case '6_months': end.setMonth(end.getMonth() + 6); break;
        case '12_months': end.setFullYear(end.getFullYear() + 1); break;
    }
    finalEndDate = end.toISOString().split('T')[0];

    try {
        const { error } = await supabase.from('sponsors').update({
            status: 'approved',
            start_date: startDate,
            end_date: finalEndDate,
            amount: amount,
            invoice_number: invoiceNumber,
            plan: duration 
        }).eq('id', id);
        if (error) throw error;
    } catch (e) { console.error("Error activating sponsor:", e); throw e; }
};

export const startShopSubscription = async (vatNumber: string): Promise<void> => {
    try {
        const { data: sponsor } = await supabase
            .from('sponsors')
            .select('*')
            .eq('vat_number', vatNumber)
            .eq('type', 'shop')
            .eq('status', 'approved')
            .is('start_date', null)
            .maybeSingle();

        if (!sponsor) return; 

        const today = new Date();
        const startDate = today.toISOString().split('T')[0];
        const endDateObj = new Date(today);

        const duration = sponsor.plan as SponsorDuration || '1_month';
        switch(duration) {
            case '1_month': endDateObj.setMonth(endDateObj.getMonth() + 1); break;
            case '3_months': endDateObj.setMonth(endDateObj.getMonth() + 3); break;
            case '6_months': endDateObj.setMonth(endDateObj.getMonth() + 6); break;
            case '12_months': endDateObj.setFullYear(endDateObj.getFullYear() + 1); break;
        }
        const endDate = endDateObj.toISOString().split('T')[0];

        await supabase.from('sponsors').update({
            start_date: startDate,
            end_date: endDate
        }).eq('id', sponsor.id);
    } catch(e) {}
};

export const rejectSponsor = async (id: string, reason: string, notes: string): Promise<void> => {
    try {
        const { error } = await supabase.from('sponsors').update({
            status: 'rejected',
            rejection_reason: reason,
            admin_notes: notes
        }).eq('id', id);
        if (error) throw error;
    } catch(e) { console.error("Error rejecting sponsor:", e); throw e; }
};

export const cancelSponsor = async (id: string, reason: string): Promise<void> => {
    try {
        const { error } = await supabase.from('sponsors').update({
            status: 'cancelled',
            admin_notes: `[Annullato] ${reason}`
        }).eq('id', id);
        if (error) throw error;
    } catch(e) { console.error("Error cancelling sponsor:", e); throw e; }
};

export const deleteSponsor = async (id: string): Promise<void> => {
    try {
        const { error } = await supabase.from('sponsors').delete().eq('id', id);
        if (error) throw error;
    } catch(e) { 
        console.error("Error deleting sponsor:", e); 
        throw e;
    }
};

export const deleteSponsorsBulk = async (ids: string[]): Promise<void> => {
    if (ids.length === 0) return;
    try {
        const { error } = await supabase.from('sponsors').delete().in('id', ids);
        if (error) throw error;
    } catch (e) {
        console.error("Error bulk deleting sponsors:", e);
        throw e;
    }
};

export const updateSponsorExpiration = async (id: string, newDate: string): Promise<void> => {
    try {
        const { error } = await supabase.from('sponsors').update({ end_date: newDate }).eq('id', id);
        if (error) throw error;
    } catch(e) { console.error("Error updating expiration:", e); throw e; }
};

export const convertSponsorToPoi = (req: SponsorRequest): PointOfInterest => {
    let finalCat: PoiCategory = 'shop';
    if (req.poiCategory) {
        finalCat = req.poiCategory;
    } else if (req.type === 'guide') {
        finalCat = 'discovery';
    } else if (req.adminNotes) {
        const cat = extractCategoryFromNotes(req.adminNotes);
        if (cat) finalCat = cat;
    }

    let coords = GEO_CONFIG.DEFAULT_CENTER; 

    return {
        id: `sponsor-${req.id}`,
        cityId: req.cityId,
        name: req.companyName,
        description: req.message || extractDescriptionFromNotes(req.adminNotes) || "Partner Ufficiale Touring Diary", 
        imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=400',
        category: finalCat,
        rating: 5,
        votes: 0,
        coords: coords,
        address: req.address || 'Partner Certificato',
        isSponsored: true,
        tier: req.tier,
        vatNumber: req.vatNumber
    };
};

// --- IMPLEMENTAZIONE ASYNC REALE PER CRM ---

export const getPartnerHistoryAsync = async (vatNumber: string): Promise<SponsorRequest[]> => {
    if (!vatNumber) return [];
    try {
        // Recupera TUTTI i record per questa Partita IVA, ordinati dal più recente
        const { data, error } = await supabase
            .from('sponsors')
            .select('*')
            .eq('vat_number', vatNumber)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        return (data as DatabaseSponsor[]).map(mapDbSponsorToApp);
    } catch (e) {
        console.error("Error fetching partner history:", e);
        return [];
    }
};

export const addPartnerLogAsync = async (vatNumber: string, log: PartnerLog): Promise<void> => {
    if (!vatNumber) return;
    try {
        // 1. Trova il record attivo più recente (o pending) a cui appendere il log
        const { data: records } = await supabase
            .from('sponsors')
            .select('id, partner_logs')
            .eq('vat_number', vatNumber)
            .order('created_at', { ascending: false })
            .limit(1);

        if (!records || records.length === 0) return;
        
        const targetRecord = records[0];
        const currentLogs = (targetRecord.partner_logs as any) || [];
        const newLogs = [...currentLogs, log];
        
        // 2. Aggiorna
        const { error } = await supabase
            .from('sponsors')
            .update({ partner_logs: newLogs })
            .eq('id', targetRecord.id);

        if (error) throw error;
        
    } catch (e) {
        console.error("Error adding partner log:", e);
    }
};

export const markPartnerLogsAsRead = async (vatNumber: string) => {
     try {
        const { data: records } = await supabase
            .from('sponsors')
            .select('id, partner_logs')
            .eq('vat_number', vatNumber);

        if (!records) return;

        for (const record of records) {
             const logs = (record.partner_logs as PartnerLog[]) || [];
             const hasUnread = logs.some(l => l.direction === 'inbound' && l.isUnread);
             
             if (hasUnread) {
                 const updated = logs.map(l => l.direction === 'inbound' ? { ...l, isUnread: false } : l);
                 await supabase.from('sponsors').update({ partner_logs: updated }).eq('id', record.id);
             }
        }
    } catch (e) {
        console.error("Error marking partner logs read:", e);
    }
};

export const togglePartnerLogReadStatus = (vat: string, id: string) => {};
export const updateSponsorInternalNotes = (id: string, n: string) => {
    // Fire & Forget update
    supabase.from('sponsors').update({ admin_notes: n }).eq('id', id).then();
};
export const dismissPartnerAlert = (vat: string) => {};
export const getDismissedAlerts = () => [];
export const getSponsorRating = (id: string) => null;
export const getGuideReviews = (id: string) => [];
export const getActiveGuideSponsors = (id: string) => [];
export const extendAllActiveSponsors = (d: number, e: boolean) => ({count:0, skipped:0});

// DEPRECATED SYNC (Removed in favor of Async)
export const getPartnerHistory = (vatNumber: string): SponsorRequest[] => []; 
export const addPartnerLog = (vat: string, log: PartnerLog) => {};
