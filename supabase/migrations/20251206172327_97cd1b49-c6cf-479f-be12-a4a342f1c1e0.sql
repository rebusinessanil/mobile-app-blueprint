-- Enable FULL replica identity for stickers table (needed for complete row data in realtime updates)
ALTER TABLE public.stickers REPLICA IDENTITY FULL;