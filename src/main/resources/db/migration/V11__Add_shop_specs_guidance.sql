-- ============================================================
-- Migration: V11__Add_shop_specs_guidance.sql
-- Adds dynamic `specs` (JSONB) and `guidance` (TEXT) columns
-- to the `products` table, plus a non-null default for `specs`.
-- ============================================================
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '[]'::jsonb NOT NULL,
    ADD COLUMN IF NOT EXISTS guidance TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN products.specs IS
    'Dynamic specification key-value pairs as JSON array. '
    'Example: [{"label":"Loại tài khoản","value":"ChatGPT Plus"},{"label":"Bộ nhớ","value":"32K tokens"}]';
COMMENT ON COLUMN products.guidance IS
    'Markdown guidance text for deployment instructions, warranty, and FAQ.';

-- ============================================================
-- Backfill: ensure existing products get an empty array default
-- (handled by DEFAULT '[]' above, but defensive for pre-4.x PostgreSQL)
-- ============================================================
UPDATE products SET specs = '[]'::jsonb WHERE specs IS NULL;
