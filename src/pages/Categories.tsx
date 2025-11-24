import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Search, Filter, Trophy, Gift, Calendar, Star, MessageCircle, Zap, Briefcase, Target, Medal, Image, Users, IndianRupee, BarChart3, LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

// Icon mapping
const ICON_MAP: Record<string, LucideIcon> = {
  Trophy, Gift, Calendar, Star, MessageCircle, Zap, 
  Briefcase, Target, Medal, Image, Users, IndianRupee, BarChart3
};

interface Category {
  id: string;
  name: string;
  slug: string;
  icon_name: string | null;
  color_class: string | null;
  route_path: string | null;
  is_active: boolean;
  display_order: number | null;
}

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();

    // Real-time subscription for instant updates
    const channel = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'template_categories',
        },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('template_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-navy-dark pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <h1 className="text-2xl font-bold text-foreground mb-4">All Categories</h1>
        
        {/* Search Bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="gold-border bg-secondary text-foreground pl-11 h-12"
            />
          </div>
          <button className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors">
            <Filter className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </header>

      {/* Categories Grid */}
      <div className="px-6 py-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No categories found</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filteredCategories.map((category) => {
              const Icon = ICON_MAP[category.icon_name || 'Trophy'] || Trophy;
              return (
                <Link
                  key={category.id}
                  to={category.route_path || '/'}
                  className="gold-border bg-card rounded-2xl p-5 flex flex-col items-center justify-center gap-3 hover:gold-glow transition-all"
                >
                  <div className={`w-14 h-14 ${category.color_class || 'bg-primary'} rounded-2xl flex items-center justify-center`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-center text-foreground leading-tight">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}