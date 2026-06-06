-- V30: Remove sample shop products
-- =================================

-- Delete sample products (FlyCam and SWP391)
DELETE FROM products WHERE slug IN ('h', 's');

-- Verify deletion
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM products WHERE slug IN ('h', 's')) THEN
        RAISE WARNING 'Sample products still exist after migration';
    ELSE
        RAISE NOTICE 'Sample products deleted successfully';
    END IF;
END $$;
