-- Rename display_order to slot_number for clarity
ALTER TABLE template_backgrounds 
RENAME COLUMN display_order TO slot_number;

-- Add documentation comments
COMMENT ON COLUMN template_backgrounds.slot_number IS 'UI slot index (1-16) - maps directly to banner preview grid position. Enforced by unique constraint on (template_id, slot_number)';
COMMENT ON TABLE template_backgrounds IS 'Stores up to 16 background variants per template/rank. Each row represents exactly one slot for one specific template, ensuring perfect isolation.';
