-- Enable REPLICA IDENTITY FULL for realtime on all story tables
ALTER TABLE stories_generated REPLICA IDENTITY FULL;
ALTER TABLE stories_events REPLICA IDENTITY FULL;
ALTER TABLE stories_festivals REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication if not already added
DO $$
BEGIN
  -- Check and add stories_generated
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'stories_generated'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE stories_generated;
  END IF;

  -- Check and add stories_events
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'stories_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE stories_events;
  END IF;

  -- Check and add stories_festivals
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'stories_festivals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE stories_festivals;
  END IF;
END $$;