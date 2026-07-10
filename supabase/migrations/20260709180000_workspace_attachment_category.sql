-- Global Workspace Panel — Fase 5: categorie allegati workspace

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workspace_attachment_category') THEN
    CREATE TYPE public.workspace_attachment_category AS ENUM (
      'documents',
      'tickets',
      'bookings',
      'expenses',
      'misc'
    );
  END IF;
END
$$;

ALTER TABLE public.workspace_attachments
  ADD COLUMN IF NOT EXISTS category public.workspace_attachment_category NOT NULL DEFAULT 'misc';

UPDATE public.workspace_attachments
SET category = 'misc'
WHERE category IS NULL;

CREATE INDEX IF NOT EXISTS workspace_attachments_workspace_category_idx
  ON public.workspace_attachments (workspace_id, category, created_at DESC);

COMMENT ON COLUMN public.workspace_attachments.category IS
  'Categoria allegato workspace (hub Allegati — documents, tickets, bookings, expenses, misc).';
