-- Add unique constraint to ensure one background per slot per template
ALTER TABLE template_backgrounds 
ADD CONSTRAINT template_backgrounds_template_slot_unique 
UNIQUE (template_id, display_order);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_template_backgrounds_template_display 
ON template_backgrounds(template_id, display_order);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT template_backgrounds_template_slot_unique 
ON template_backgrounds 
IS 'Ensures each slot (display_order) can only have one background per template';