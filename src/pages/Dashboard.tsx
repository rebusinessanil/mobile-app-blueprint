import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Menu, Bell, Star, Calendar, Zap, Award } from "lucide-react";
import { useTemplateCategories, useTemplates } from "@/hooks/useTemplates";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const { categories } = useTemplateCategories();
  const { templates: allTemplates } = useTemplates();
  const [userId, setUserId] = useState<string | null>(null);
  const { profile } = useProfile(userId ?? undefined);

  // Get authenticated user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  const quickActions = [
    { icon: Calendar, label: "Festival Banner", color: "bg-icon-purple" },
    { icon: Zap, label: "Motivational Quote", color: "bg-icon-orange" },
    { icon: Award, label: "Achievements", color: "bg-icon-purple" },
    { label: "Special Offer Today", color: "bg-secondary", special: true },
  ];

  // Get templates for each category
  const getCategoryTemplates = (categoryId: string) => {
    return allTemplates.filter(t => t.category_id === categoryId).slice(0, 3);
  };

  return (
    <div className="min-h-screen bg-navy-dark pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">ReBusiness</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {profile?.name || "User"}!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors">
              <Menu className="w-5 h-5 text-primary" />
            </button>
            <button className="relative w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors">
              <Bell className="w-5 h-5 text-primary" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-xs font-bold flex items-center justify-center text-white">
                2
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={`/create/${action.label.toLowerCase().replace(/\s+/g, "-")}`}
              className="gold-border bg-card p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 hover:gold-glow transition-all"
            >
              {action.special ? (
                <div className="text-xs font-semibold text-foreground leading-tight">
                  {action.label}
                </div>
              ) : (
                <>
                  <div className={`w-12 h-12 ${action.color} rounded-2xl flex items-center justify-center`}>
                    {action.icon && <action.icon className="w-6 h-6 text-white" />}
                  </div>
                  <span className="text-xs font-semibold text-foreground">{action.label}</span>
                </>
              )}
            </Link>
          ))}
        </div>

        {/* Category Sections - Backend Integrated */}
        {categories.map((category) => {
          const categoryTemplates = getCategoryTemplates(category.id);
          
          return (
            <div key={category.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  <h2 className="text-lg font-bold text-foreground">{category.name}</h2>
                </div>
                <Link 
                  to={category.slug === 'rank-promotion' ? '/rank-selection' : `/categories/${category.slug}`}
                  className="text-primary text-sm font-semibold hover:underline"
                >
                  See All →
                </Link>
              </div>

              {/* Template Scroll - Dynamic from Backend */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {categoryTemplates.length > 0 ? (
                  categoryTemplates.map((template) => (
                    <Link
                      key={template.id}
                      to={category.slug === 'rank-promotion' ? '/rank-selection' : `/template/${template.id}`}
                      className="min-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 hover:gold-glow transition-all"
                    >
                      {template.cover_thumbnail_url ? (
                        <div className="h-32 relative">
                          <img 
                            src={template.cover_thumbnail_url} 
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                            <p className="text-white text-xs text-center font-medium truncate">
                              Backend Integrated ✓
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="h-32 bg-gradient-to-br from-secondary to-card flex items-center justify-center">
                          <div className="text-center px-2">
                            <p className="text-white font-bold text-sm">CHANGE COVER</p>
                            <p className="text-primary text-xs mt-1">{"{ BACKEND }"}</p>
                          </div>
                        </div>
                      )}
                      <div className="p-2 text-center">
                        <p className="text-xs text-muted-foreground truncate">{template.name}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="min-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 p-4">
                    <p className="text-xs text-muted-foreground text-center">No templates yet</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}