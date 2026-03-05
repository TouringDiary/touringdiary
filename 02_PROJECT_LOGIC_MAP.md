
# 🧠 DOC 02: PROJECT LOGIC_MAP (v43.0 - UI UNIFICATION)

## 1. ARCHITETTURA STATE MANAGEMENT
...

## 10. UI COMPONENT STRATEGY (Unified System)
Per ridurre la duplicazione e migliorare la manutenibilità:

1.  **UniversalCard:** Un unico componente gestisce tutte le visualizzazioni dei POI (Griglie, Sidebar, Liste).
    *   **Variant 'horizontal':** Layout 1/3 immagine a sinistra, usato per liste Top 5.
    *   **Variant 'vertical':** Layout immagine in alto, usato per griglie e colonne sponsor.
    *   **Prop 'fluid':** Adatta la larghezza al contenitore padre (utile per le sidebar responsive).

2.  **UniversalPoiModal:** Un unico punto di ingresso per i dettagli dei luoghi.
    *   **Logic Branching:** Analizza `poi.resourceType` al mount.
    *   **Standard View:** Layout "Hero + Tabs" per monumenti, ristoranti, hotel.
    *   **Business View:** Layout "Card Profile" per guide, tour operator e servizi.

---
*Logica aggiornata al 19/12/2025*
