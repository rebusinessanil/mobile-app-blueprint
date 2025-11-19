-- Fix template_backgrounds table column name
ALTER TABLE template_backgrounds 
RENAME COLUMN "Bronze 01" TO display_order;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_template_backgrounds_template_id 
ON template_backgrounds(template_id);

CREATE INDEX IF NOT EXISTS idx_template_backgrounds_display_order 
ON template_backgrounds(display_order);

-- Enable realtime for template_backgrounds
ALTER TABLE template_backgrounds REPLICA IDENTITY FULL;

-- Enable realtime for templates table for cover updates
ALTER TABLE templates REPLICA IDENTITY FULL;