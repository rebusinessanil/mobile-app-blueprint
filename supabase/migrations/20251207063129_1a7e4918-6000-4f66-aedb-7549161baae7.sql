-- Fix stories_events RLS: restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can view stories_events" ON stories_events;

CREATE POLICY "Authenticated users can view stories_events"
ON stories_events FOR SELECT TO authenticated
USING (true);