-- Enable REPLICA IDENTITY FULL for stickers table to ensure complete row data in realtime updates
ALTER TABLE public.stickers REPLICA IDENTITY FULL;