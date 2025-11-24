-- Add unique constraint on (template_id, slot_number) to enforce one background per slot per template
ALTER TABLE template_backgrounds 
ADD CONSTRAINT unique_template_slot UNIQUE (template_id, slot_number);

-- Add check constraint to ensure slot_number is between 1 and 16
ALTER TABLE template_backgrounds 
ADD CONSTRAINT check_slot_range CHECK (slot_number >= 1 AND slot_number <= 16);