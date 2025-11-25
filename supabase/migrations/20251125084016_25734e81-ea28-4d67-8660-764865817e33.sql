-- Add story_id field to templates table for story-specific template isolation
ALTER TABLE templates
ADD COLUMN story_id uuid REFERENCES stories(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_templates_story_id ON templates(story_id);

-- Add comment for documentation
COMMENT ON COLUMN templates.story_id IS 'Links template to a specific story, ensuring story-specific template and background isolation';