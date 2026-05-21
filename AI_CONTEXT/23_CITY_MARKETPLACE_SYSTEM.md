# 🛍️ DOC 23: CITY MARKETPLACE SYSTEM (v1.0 — CERTIFIED)

Questo documento descrive il sistema di shopping locale e marketplace (Le Botteghe) di TouringDiary.

---

## DESCRIZIONE SEMPLICE
È il marketplace delle eccellenze locali: una vetrina per negozi, artigiani e produttori tipici della città, dove gli utenti possono scoprire prodotti ed effettuare acquisti.

## DESCRIZIONE TECNICA
Il sistema si basa su due tabelle relazionate: `shops` (i partner) e `shop_products` (il catalogo). È integrato con il sistema sponsor per garantire visibilità prioritaria alle botteghe "Gold" o "Premium".

---

## PIPELINE RUNTIME
1. **Trigger**: L'utente accede alla sezione "Shopping" o al Marketplace globale.
2. **Service**: `shopService.ts` esegue `getShopsByFilter(cityId)`.
3. **Query Database**: Join tra `shops` e `shop_products`.
4. **Ranking Logic**: Le botteghe vengono ordinate per `level` (premium) e `badge` (gold), quindi per popolarità (likes/rating).
5. **Risposta UI**: Rendering della pagina `ShopPage.tsx` con griglia di card negozi e preview prodotti.

---

## COMPONENTI ARCHITETTURALI
*   **Tabelle Database**: `shops`, `shop_products`.
*   **Services**: `shopService.ts`.
*   **Hooks**: `useShopData` (implied).
*   **Componenti UI**: `ShopPage.tsx`, `ShopCard.tsx`, `ProductDetailOverlay.tsx`.

## ENTITÀ DATI (shops)
*   `id`: UUID.
*   `name`: Nome della bottega.
*   `category`: Settore (es. Artigianato, Gastronomia).
*   `is_tipico`: Flag per prodotti d'eccellenza territoriale.
*   `vat_number`: Identificativo per integrazione Sponsor CRM.
*   `products`: Relazione 1:N con `shop_products`.
