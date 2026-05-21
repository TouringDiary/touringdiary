-- Migration for Suitcase Evolution v2

-- 1. Update suitcases table
ALTER TABLE public.suitcases 
ADD COLUMN IF NOT EXISTS custom_categories jsonb DEFAULT '[]'::jsonb;

-- 2. Update suitcase_items table
ALTER TABLE public.suitcase_items 
ADD COLUMN IF NOT EXISTS accepted_from_ai boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_suggestion_context text,
ADD COLUMN IF NOT EXISTS suggested_at timestamp with time zone DEFAULT now();

-- 3. Add comment for documentation
COMMENT ON COLUMN public.suitcases.custom_categories IS 'Portabile JSONB structure for custom categories: id, name, icon_key, order, source, created_at, meta';
COMMENT ON COLUMN public.suitcase_items.ai_suggestion_context IS 'Stores context like trip type, season, or destination for the suggestion';
