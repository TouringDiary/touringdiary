
import { useCallback } from 'react';
import { SponsorRequest } from '../types/index';

export const useSponsorExport = () => {
    const exportToCSV = useCallback((requests: SponsorRequest[]) => {
        if (requests.length === 0) {
            alert("Nessun dato da esportare.");
            return;
        }
        const headers = ["ID", "Azienda", "Contatto", "Email", "P.IVA", "Città", "Stato", "Tipo", "Tier", "Importo", "Data Creazione", "Scadenza"];
        const rows = requests.map(r => [
            r.id,
            `"${r.companyName}"`,
            `"${r.contactName}"`,
            r.email,
            r.vatNumber || "",
            r.cityId || "",
            r.status,
            r.type,
            r.tier || "",
            r.amount || 0,
            r.date,
            r.endDate || ""
        ]);
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `sponsor_export_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    return { exportToCSV };
};
