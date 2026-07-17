-- =============================================================================
-- Design System Alignment — default tipografici admin più leggibili
-- Separato dal seed admin_cc_* (20260717190000): responsabilità distinte.
-- Aggiorna solo se il valore è ancora quello seed storico troppo piccolo.
-- =============================================================================

UPDATE public.design_system_rules
SET text_size = 'text-sm', updated_at = NOW()
WHERE component_key = 'admin_section_card_subtitle'
  AND text_size IN ('text-xs', 'text-[10px]');

UPDATE public.design_system_rules
SET text_size = 'text-sm', updated_at = NOW()
WHERE component_key IN ('admin_btn_primary', 'admin_btn_primary_mobile')
  AND text_size = 'text-xs';

UPDATE public.design_system_rules
SET text_size = 'text-xs', updated_at = NOW()
WHERE component_key = 'admin_table_head'
  AND text_size = 'text-[10px]';

UPDATE public.design_system_rules
SET text_size = 'text-xs', updated_at = NOW()
WHERE component_key = 'admin_table_head_mobile'
  AND text_size = 'text-[10px]';
