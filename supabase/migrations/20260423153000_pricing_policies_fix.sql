-- 1. Abilitazione RLS (già attiva, ma per sicurezza)
ALTER TABLE pricing_versions ENABLE ROW LEVEL SECURITY;

-- 2. Policy di SELECT: Pubblica (chiunque può vedere i prezzi attivi)
-- Esiste già: public_read_pricing_versions

-- 3. Policy di INSERT: Solo per Admin
CREATE POLICY "admin_insert_pricing_versions" ON pricing_versions
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() 
    AND role IN ('admin_all', 'admin_limited')
  )
);

-- 4. Policy di UPDATE: Solo per Admin
CREATE POLICY "admin_update_pricing_versions" ON pricing_versions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() 
    AND role IN ('admin_all', 'admin_limited')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() 
    AND role IN ('admin_all', 'admin_limited')
  )
);

-- 5. Policy per campaigns (REALE TABELLA DB)
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_campaigns" ON campaigns
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() 
    AND role IN ('admin_all', 'admin_limited')
  )
);
