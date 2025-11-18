-- Create ranks table to store all rank types
CREATE TABLE IF NOT EXISTS public.ranks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  gradient TEXT NOT NULL,
  icon TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add rank_id foreign key to templates table
ALTER TABLE public.templates 
ADD COLUMN rank_id TEXT REFERENCES public.ranks(id);

-- Create index for faster queries
CREATE INDEX idx_templates_rank_id ON public.templates(rank_id);

-- Enable RLS on ranks table
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ranks table
CREATE POLICY "Anyone can view active ranks"
  ON public.ranks FOR SELECT
  USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Only admins can manage ranks"
  ON public.ranks FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Insert the 18 ranks from the application
INSERT INTO public.ranks (id, name, color, gradient, icon, display_order) VALUES
  ('bronze', 'Bronze', 'from-amber-700 to-amber-900', 'bg-gradient-to-br from-amber-700 to-amber-900', '🥉', 1),
  ('silver', 'Silver', 'from-gray-400 to-gray-600', 'bg-gradient-to-br from-gray-400 to-gray-600', '🥈', 2),
  ('gold', 'Gold', 'from-yellow-400 to-yellow-600', 'bg-gradient-to-br from-yellow-400 to-yellow-600', '🥇', 3),
  ('platinum', 'Platinum', 'from-cyan-300 to-cyan-500', 'bg-gradient-to-br from-cyan-300 to-cyan-500', '💎', 4),
  ('emerald', 'Emerald', 'from-emerald-400 to-emerald-600', 'bg-gradient-to-br from-emerald-400 to-emerald-600', '💚', 5),
  ('topaz', 'Topaz', 'from-orange-400 to-orange-600', 'bg-gradient-to-br from-orange-400 to-orange-600', '🧡', 6),
  ('ruby-star', 'Ruby Star', 'from-rose-500 to-rose-700', 'bg-gradient-to-br from-rose-500 to-rose-700', '⭐', 7),
  ('sapphire', 'Sapphire', 'from-blue-500 to-blue-700', 'bg-gradient-to-br from-blue-500 to-blue-700', '💙', 8),
  ('star-sapphire', 'Star Sapphire', 'from-indigo-500 to-indigo-700', 'bg-gradient-to-br from-indigo-500 to-indigo-700', '🌟', 9),
  ('diamond', 'Diamond', 'from-purple-400 to-purple-600', 'bg-gradient-to-br from-purple-400 to-purple-600', '💜', 10),
  ('blue-diamond', 'Blue Diamond', 'from-sky-400 to-sky-600', 'bg-gradient-to-br from-sky-400 to-sky-600', '🔷', 11),
  ('black-diamond', 'Black Diamond', 'from-gray-700 to-gray-900', 'bg-gradient-to-br from-gray-700 to-gray-900', '🖤', 12),
  ('royal-diamond', 'Royal Diamond', 'from-violet-500 to-violet-700', 'bg-gradient-to-br from-violet-500 to-violet-700', '👑', 13),
  ('crown-diamond', 'Crown Diamond', 'from-pink-500 to-pink-700', 'bg-gradient-to-br from-pink-500 to-pink-700', '💖', 14),
  ('ambassador', 'Ambassador', 'from-teal-500 to-teal-700', 'bg-gradient-to-br from-teal-500 to-teal-700', '🎖️', 15),
  ('royal-ambassador', 'Royal Ambassador', 'from-fuchsia-500 to-fuchsia-700', 'bg-gradient-to-br from-fuchsia-500 to-fuchsia-700', '🏆', 16),
  ('crown-ambassador', 'Crown Ambassador', 'from-amber-500 to-amber-700', 'bg-gradient-to-br from-amber-500 to-amber-700', '👑', 17),
  ('brand-ambassador', 'Brand Ambassador', 'from-rose-600 to-rose-800', 'bg-gradient-to-br from-rose-600 to-rose-800', '🌹', 18);

-- Add trigger for updated_at
CREATE TRIGGER update_ranks_updated_at
  BEFORE UPDATE ON public.ranks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();