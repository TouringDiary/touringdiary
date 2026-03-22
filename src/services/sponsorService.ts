
import { supabase } from './supabaseClient';
import { Sponsor, SponsorRequest, PointOfInterest } from '../types';

// --- TYPES ---
export type SponsorStats = {};

// Helper per ottenere la data odierna in formato YYYY-MM-DD per Supabase
const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Helper di mappatura che trasforma il record del DB in un oggetto Sponsor per l'app
const mapDbSponsorToApp = (dbSponsor: any): Sponsor => ({
    id: dbSponsor.id,
    name: dbSponsor.name,
    description: dbSponsor.description,
    imageUrl: dbSponsor.image_url,
    coords: { lat: dbSponsor.coords_lat || 0, lng: dbSponsor.coords_lng || 0 },
    address: dbSponsor.address,
    poiCategory: dbSponsor.poi_category,
    cityId: dbSponsor.city_id,
    vatNumber: dbSponsor.vat_number,
    tier: dbSponsor.tier,
    // Valori di default per campi opzionali del tipo Sponsor non presenti nella query
    gallery: [],
    rating: 0,
    reviewsCount: 0,
    phone: '',
    email: '',
    website: '',
    createdAt: '',
    updatedAt: '',
    poiSubCategory: undefined
});

export const fetchSponsorsByCityAsync = async (cityId: string): Promise<Sponsor[]> => {
    if (!cityId) return [];

    const today = getTodayDateString();

    const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .eq('city_id', cityId)
        .eq('status', 'approved') // Filtro 1: Solo sponsor approvati
        .not('start_date', 'is', null) // Filtro 2: La sponsorizzazione deve essere iniziata
        .gte('end_date', today); // Filtro 3: La data di fine deve essere oggi o futura

    if (error) {
        console.error('Error fetching active sponsors:', error.message);
        return [];
    }

    return (data || []).map(mapDbSponsorToApp);
};

/**
 * @deprecated Questa funzione è deprecata. Usare direttamente fetchSponsorsByCityAsync.
 * Wrapper temporaneo per garantire la compatibilità all'indietro.
 */
export const getActiveGuideSponsors = async (cityId: string): Promise<Sponsor[]> => {
    console.warn("getActiveGuideSponsors è deprecata. Eseguire refactoring per usare fetchSponsorsByCityAsync.");
    // Chiama la vera implementazione e garantisce un array di ritorno
    try {
        const sponsors = await fetchSponsorsByCityAsync(cityId);
        // Filtra solo le guide se necessario (la logica dipende dal modello dati)
        return sponsors.filter(s => s.poiCategory === 'guide'); // Esempio di filtro
    } catch (error) {
        console.error("Errore nel wrapper di getActiveGuideSponsors:", error);
        return []; // Garantisce sempre un array anche in caso di errore
    }
};


/**
 * Attiva o aggiorna l'abbonamento di uno sponsor per la sua vetrina (shop).
 * @param {string} sponsorId - L'ID dello sponsor da aggiornare.
 * @param {'standard' | 'premium'} tier - Il livello di abbonamento scelto.
 * @returns {Promise<{ success: boolean; error?: any }>} - L'esito dell'operazione.
 */
export const startShopSubscription = async (sponsorId: string, tier: 'standard' | 'premium'): Promise<{ success: boolean; error?: any }> => {
    if (!sponsorId || !tier) {
        console.error("startShopSubscription: Sponsor ID and tier are required.");
        return { success: false, error: 'Sponsor ID and tier are required.' };
    }

    try {
        const startDate = new Date();
        const endDate = new Date();

        // Imposta la durata dell'abbonamento in base al livello
        if (tier === 'standard') {
            // Abbonamento Standard: 6 mesi
            endDate.setMonth(startDate.getMonth() + 6);
        } else if (tier === 'premium') {
            // Abbonamento Premium: 1 anno
            endDate.setFullYear(startDate.getFullYear() + 1);
        }

        const { error } = await supabase
            .from('sponsors')
            .update({
                tier: tier,
                status: 'approved',
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                updated_at: new Date().toISOString(),
            })
            .eq('id', sponsorId);

        if (error) {
            console.error('Error updating sponsor subscription in Supabase:', error.message);
            throw error; // Lancia l'errore per essere gestito dal chiamante
        }

        console.log(`Subscription for sponsor ${sponsorId} successfully started. Tier: ${tier}`);
        return { success: true };

    } catch (error) {
        console.error('An unexpected error occurred in startShopSubscription:', error);
        return { success: false, error };
    }
};

export const convertSponsorToPoi = (sponsor: Sponsor): PointOfInterest => {
    return {
        // Campi Obbligatori
        id: `sponsor-${sponsor.id}`,
        name: sponsor.name,
        description: sponsor.description || `Visita ${sponsor.name}, un partner consigliato da Touring-Diary.`,
        imageUrl: sponsor.imageUrl,
        category: sponsor.poiCategory || 'activity',
        coords: sponsor.coords, // Usa le coordinate mappate
        rating: sponsor.rating || 0, // Usa i valori di default dal mapper
        votes: sponsor.reviewsCount || 0, // Usa i valori di default dal mapper

        // Campi Opzionali Utili
        address: sponsor.address,
        cityId: sponsor.cityId,
        isSponsored: true,
        tier: sponsor.tier,
    };
};

// --- ADMIN-ONLY FUNCTIONS ---

// Mappa una richiesta di sponsorizzazione dal DB al formato per l'UI admin
const mapDbSponsorRequestToApp = (dbRequest: any): SponsorRequest => ({
    id: dbRequest.id,
    companyName: dbRequest.company_name,
    vatNumber: dbRequest.vat_number,
    address: dbRequest.address,
    cityId: dbRequest.city_id,
    requesterName: dbRequest.requester_name,
    requesterEmail: dbRequest.requester_email,
    requesterPhone: dbRequest.requester_phone,
    message: dbRequest.message,
    status: dbRequest.status,
    tier: dbRequest.tier,
    poiCategory: dbRequest.poi_category,
    rejectionReason: dbRequest.rejection_reason,
    createdAt: dbRequest.created_at,
    // Join con la tabella 'cities'
    cityName: dbRequest.city_id || 'N/A',
    pricing_version_id: dbRequest.pricing_version_id,
});

// Recupera le richieste di sponsorizzazione con paginazione e filtri
export const getSponsorsPaginated = async (
    page: number,
    pageSize: number,
    filter: 'pending' | 'approved' | 'rejected'
) => {
    // --- MODIFICA ---
    // Corretto il calcolo dell'offset per essere compatibile con Supabase (la pagina 1 è a offset 0).
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error, count } = await supabase
        .from('sponsor_requests')
        .select('*', { count: 'exact' })
        .eq('status', filter)
        .range(from, to)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    
    return {
        data: (data || []).map(mapDbSponsorRequestToApp),
        count: count || 0,
    };
};

// Recupera una singola richiesta di sponsor per ID
export const getSponsorById = async (id: string): Promise<SponsorRequest | null> => {
    const { data, error } = await supabase
        .from('sponsor_requests')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) {
        console.error('Error fetching sponsor by ID:', error.message);
        return null;
    }
    return data ? mapDbSponsorRequestToApp(data) : null;
};

/**
 * Crea un nuovo record 'sponsors' a partire da una 'sponsor_requests'.
 * Questo è il primo passo dell'attivazione manuale da parte di un admin.
 * @param {SponsorRequest} requestData - L'oggetto completo della richiesta di sponsorizzazione.
 * @returns {Promise<Sponsor>} Il record sponsor appena creato.
 */
export const createSponsorFromRequest = async (requestData: SponsorRequest): Promise<Sponsor> => {
    
    // Mappatura dei campi corretta per la tabella 'sponsors'
    const sponsorPayload = {
        company_name: requestData.companyName,
        vat_number: requestData.vatNumber,
        address: requestData.address,
        city_id: requestData.cityId,
        poi_category: requestData.poiCategory,
        tier: requestData.tier || 'silver', // CORRETTO: Aggiunto fallback a 'silver'
        pricing_version_id: requestData.pricing_version_id,
        
        // Lo stato iniziale prima dell'attivazione della subscription
        status: 'waiting_payment' 
    };

    const { data, error } = await supabase
        .from('sponsors')
        .insert(sponsorPayload)
        .select()
        .single();

    if (error) {
        console.error("Errore durante la creazione dello sponsor da richiesta:", error);
        throw new Error("Impossibile creare il record sponsor nel database.");
    }

    return data as Sponsor;
};


// Aggiorna lo stato di una richiesta (approved, rejected)
export const updateSponsorStatus = async (id: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    const { data, error } = await supabase
        .from('sponsor_requests')
        .update({ status, rejection_reason: rejectionReason })
        .eq('id', id)
        .select();

    if (error) throw new Error(error.message);
    return data;
};

// Elimina una richiesta di sponsor
export const deleteSponsor = async (id: string) => {
    const { error } = await supabase.from('sponsor_requests').delete().eq('id', id);
    if (error) throw new Error(error.message);
};

// Crea un nuovo sponsor (logica admin, non richiesta pubblica)
export const createSponsor = async (sponsorData: Partial<SponsorRequest>) => {
    const { data, error } = await supabase.from('sponsor_requests').insert([sponsorData]).select();
    if (error) throw new Error(error.message);
    return data;
};

// Aggiorna i dati di uno sponsor
export const updateSponsor = async (id: string, sponsorData: Partial<SponsorRequest>) => {
    const { data, error } = await supabase.from('sponsor_requests').update(sponsorData).eq('id', id).select();
    if (error) throw new Error(error.message);
    return data;
};

/**
 * Chiama la RPC per creare la sottoscrizione e impostare lo stato 'approved'.
 * Lavora sulla tabella 'sponsors'.
 * @param {string} sponsorId - L'ID del record nella tabella 'sponsors'.
 * @param {string} planKey - La chiave del piano (es. 'silver', 'gold', 'guide').
 */
export const approveSponsorWithSubscription = async (sponsorId: string, planKey: string) => {
    const { data, error } = await supabase.rpc('approve_sponsor_with_subscription', {
        p_sponsor_id: sponsorId,
        p_plan_key: planKey
    });

    if (error) {
        console.error('Errore durante la chiamata RPC approve_sponsor_with_subscription:', error);
        throw new Error(`La creazione della sottoscrizione è fallita: ${error.message}`);
    }
    return data;
};

export const submitSponsorRequest = async (
    formData: any,
    activeType: string,
    selectedPlan: string
): Promise<boolean> => {

    // NOTA: Il campo 'tier' è richiesto dalla tabella 'sponsor_requests'.
    // Non essendo direttamente fornito dai dati del form in questo momento,
    // viene impostato un valore di default 'standard'.
    // La logica di approvazione permette comunque all'admin di definire il tier finale.
    const tierToSave: 'standard' | 'premium' = 'standard';

    try {
        const { error } = await supabase
            .from('sponsor_requests')
            .insert({
                // Campi mappati da formData
                company_name: formData.companyName,
                vat_number: formData.vatNumber,
                requester_name: formData.contactName,
                requester_email: formData.adminEmail,
                requester_phone: formData.adminPhone,
                address: formData.address,
                city_id: formData.cityId,
                message: formData.description,

                // Campi derivati dagli argomenti della funzione
                poi_category: activeType,
                pricing_version_id: selectedPlan,
                
                // Valori di default/fissi
                tier: tierToSave,
                status: 'pending',
            });

        if (error) {
            console.error('Error inserting sponsor request:', error.message);
            return false;
        }

        return true;

    } catch (err) {
        console.error('Unexpected error in submitSponsorRequest:', err);
        return false;
    }
};


// --- STUB FUNCTIONS ---

export const getSponsorTiers = async (...args: any[]) => {
    console.warn("getSponsorTiers not implemented yet");
    return [];
};

export const getSponsorStats = async (...args: any[]) => {
    console.warn("getSponsorStats not implemented yet");
    return null;
};

export const getAllSponsorsForDashboard = async (...args: any[]) => {
    console.warn("getAllSponsorsForDashboard not implemented yet");
    return null;
};

export const getPartnerHistoryAsync = async (...args: any[]) => {
    console.warn("getPartnerHistoryAsync not implemented yet");
    return null;
};

export const getSponsorsAsync = async (...args: any[]) => {
    console.warn("getSponsorsAsync not implemented yet");
    return [];
};

export const activateSponsor = async (...args: any[]) => {
    console.warn("activateSponsor not implemented yet");
    return null;
};

export const addPartnerLogAsync = async (...args: any[]) => {
    console.warn("addPartnerLogAsync not implemented yet");
    return null;
};

export const cancelSponsor = async (...args: any[]) => {
    console.warn("cancelSponsor not implemented yet");
    return null;
};

export const deleteSponsorsBulk = async (...args: any[]) => {
    console.warn("deleteSponsorsBulk not implemented yet");
    return null;
};

export const dismissPartnerAlert = async (...args: any[]) => {
    console.warn("dismissPartnerAlert not implemented yet");
    return null;
};

export const extendAllActiveSponsors = async (...args: any[]) => {
    console.warn("extendAllActiveSponsors not implemented yet");
    return null;
};



export const getDismissedAlerts = async (...args: any[]) => {
    console.warn("getDismissedAlerts not implemented yet");
    return null;
};

export const getSponsorRating = async (...args: any[]) => {
    console.warn("getSponsorRating not implemented yet");
    return null;
};

export const getSponsorRequestsByEmail = async (...args: any[]) => {
    console.warn("getSponsorRequestsByEmail not implemented yet");
    return null;
};

export const markPartnerLogsAsRead = async (...args: any[]) => {
    console.warn("markPartnerLogsAsRead not implemented yet");
    return null;
};

export const markUserLogsAsRead = async (...args: any[]) => {
    console.warn("markUserLogsAsRead not implemented yet");
    return null;
};

export const rejectSponsor = async (...args: any[]) => {
    console.warn("rejectSponsor not implemented yet");
    return null;
};

export const sendUserMessage = async (...args: any[]) => {
    console.warn("sendUserMessage not implemented yet");
    return null;
};

export const togglePartnerLogReadStatus = async (...args: any[]) => {
    console.warn("togglePartnerLogReadStatus not implemented yet");
    return null;
};

export const updateSponsorExpiration = async (...args: any[]) => {
    console.warn("updateSponsorExpiration not implemented yet");
    return null;
};

export const updateSponsorInternalNotes = async (...args: any[]) => {
    console.warn("updateSponsorInternalNotes not implemented yet");
    return null;
};
