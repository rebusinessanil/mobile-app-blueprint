import { useState } from "react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTemplateCategories } from "@/hooks/useTemplates";

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState("");
  const { categories, loading } = useTemplateCategories();

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Map category slug to route
  const getCategoryPath = (slug: string) => {
    if (slug === 'rank-promotion') return '/rank-selection';
    return `/banner-create/${slug}`;
  };

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
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filteredCategories.map((category) => (
              <Link
                key={category.id}
                to={getCategoryPath(category.slug)}
                className="gold-border bg-card rounded-2xl p-5 flex flex-col items-center justify-center gap-3 hover:gold-glow transition-all"
              >
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-2xl">
                  {category.icon || '📁'}
                </div>
                <span className="text-xs font-semibold text-center text-foreground leading-tight">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}