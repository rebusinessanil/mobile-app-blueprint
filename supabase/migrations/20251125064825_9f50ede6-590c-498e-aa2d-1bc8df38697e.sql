-- Ensure template_backgrounds has proper slot_number structure and constraints
-- This migration ensures strict one-to-one slot-to-background mapping per template

-- First, check if slot_number column exists and is correct type
DO $$ 
BEGIN
  -- Update slot_number to NUMERIC if it exists but is wrong type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'template_backgrounds' 
    AND column_name = 'slot_number'
  ) THEN
    -- Ensure slot_number is numeric
    ALTER TABLE template_backgrounds 
    ALTER COLUMN slot_number TYPE NUMERIC USING slot_number::numeric;
  END IF;
END $$;

-- Create unique constraint on (template_id, slot_number) if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_template_slot'
  ) THEN
    ALTER TABLE template_backgrounds
    ADD CONSTRAINT unique_template_slot UNIQUE (template_id, slot_number);
  END IF;
END $$;

-- Add check constraint to ensure slot_number is between 1 and 16
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_slot_number_range'
  ) THEN
    ALTER TABLE template_backgrounds
    ADD CONSTRAINT check_slot_number_range CHECK (slot_number >= 1 AND slot_number <= 16);
  END IF;
END $$;

-- Create index for faster lookups by template_id and slot_number
CREATE INDEX IF NOT EXISTS idx_template_backgrounds_template_slot 
ON template_backgrounds(template_id, slot_number);

-- Add helpful comment
COMMENT ON CONSTRAINT unique_template_slot ON template_backgrounds IS 
'Ensures strict one-to-one mapping: each slot number can only have one background per template';