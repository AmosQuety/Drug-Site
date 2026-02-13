-- ==========================================
-- PharmaSearch Unified Schema (MVP)
-- Includes: Drugs table, Safety Fields, and Fuzzy Search
-- ==========================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Repair/Update Unified Drugs Table
-- This ensures 'id' and 'user_id' exist even on old tables.
ALTER TABLE public."Drugs" ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4();
ALTER TABLE public."Drugs" ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."Drugs" ALTER COLUMN expiry_date TYPE DATE USING (NULLIF(expiry_date, '')::DATE);

-- CREATE TABLE block (for new projects)
CREATE TABLE IF NOT EXISTS public."Drugs" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    generic_name TEXT NOT NULL,
    manufacturer TEXT,
    dosage_form TEXT NOT NULL,
    strength TEXT NOT NULL,
    category TEXT,
    batch_number TEXT,
    expiry_date DATE,
    wholesaler_name TEXT NOT NULL,
    availability TEXT DEFAULT 'In stock',
    city TEXT NOT NULL,
    contact_method TEXT NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    fts_search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(brand_name, '') || ' ' || coalesce(generic_name, '') || ' ' || coalesce(manufacturer, ''))
    ) STORED
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS drugs_fts_idx ON public."Drugs" USING GIN (fts_search_vector);
CREATE INDEX IF NOT EXISTS drugs_brand_trgm_idx ON public."Drugs" USING GIN (brand_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS drugs_generic_trgm_idx ON public."Drugs" USING GIN (generic_name gin_trgm_ops);

-- 4. RLS
ALTER TABLE public."Drugs" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public."Drugs";
DROP POLICY IF EXISTS "Wholesalers can manage own drugs" ON public."Drugs";

CREATE POLICY "Allow public read access" ON public."Drugs" FOR SELECT USING (true);
CREATE POLICY "Wholesalers can manage own drugs" ON public."Drugs" FOR ALL TO authenticated
    USING (auth.uid() = user_id AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'wholesaler' AND (auth.jwt() -> 'user_metadata' ->> 'status') = 'approved');

-- 6. Stored Procedure for Autocomplete (Final Fix)
DROP FUNCTION IF EXISTS search_drugs_autocomplete(TEXT);
CREATE OR REPLACE FUNCTION search_drugs_autocomplete(search_term TEXT)
RETURNS TABLE (
    res_id UUID,
    res_brand_name TEXT,
    res_generic_name TEXT,
    res_dosage_form TEXT,
    res_strength TEXT,
    res_score REAL
) SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM set_config('pg_trgm.similarity_threshold', '0.2', true);
    RETURN QUERY
    SELECT 
        tbl.id, tbl.brand_name, tbl.generic_name, tbl.dosage_form, tbl.strength,
        GREATEST(similarity(tbl.brand_name, search_term), similarity(tbl.generic_name, search_term)) as s_score
    FROM public."Drugs" AS tbl
    WHERE tbl.brand_name % search_term OR tbl.generic_name % search_term OR tbl.brand_name ILIKE ('%' || search_term || '%') OR tbl.generic_name ILIKE ('%' || search_term || '%')
    ORDER BY s_score DESC, tbl.brand_name ASC LIMIT 10;
END;
$$ LANGUAGE plpgsql;
