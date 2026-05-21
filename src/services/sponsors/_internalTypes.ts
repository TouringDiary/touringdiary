/**

* Helper per ottenere la data odierna
* in formato YYYY-MM-DD compatibile con Supabase/Postgres.
  */
export const getTodayDateString = (): string => {
    return new Date().toISOString().split('T')[0];
};

/**

* Coordinate geografiche frontend.
  */
export interface SponsorCoordinates {
    lat: number;
    lng: number;
}

/**

* Payload frontend per la sottomissione
* di una richiesta sponsor/pubblicitaria.
*
* DTO canonico frontend.
* Nessun parsing CSV o normalizzazione implicita.
  */
export interface SponsorSubmitFormData {
    companyName: string;
    vatNumber: string;
    contactName: string;

    adminEmail: string;
    adminPhone: string;

    address: string;
    cityId: string;

    description: string;

    imageUrl?: string;

    coords?: SponsorCoordinates;

    /**
  
    * Lista lingue supportate.
    * Parsing UI/CSV esterno al DTO.
      */
    languages?: string[];

    /**
  
    * Lista specializzazioni guida/operator.
    * Parsing UI/CSV esterno al DTO.
      */
    specialties?: string[];

    licenseNumber?: string;
}
