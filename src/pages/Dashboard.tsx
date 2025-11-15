import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Menu, Bell, Star, Calendar, Zap, Award, Gift } from "lucide-react";

export default function Dashboard() {
  const quickActions = [
    { icon: Calendar, label: "Festival Banner", color: "bg-icon-purple" },
    { icon: Zap, label: "Motivational Quote", color: "bg-icon-orange" },
    { icon: Award, label: "Achievements", color: "bg-icon-purple" },
    { label: "Special Offer Today", color: "bg-secondary", special: true },
  ];

  const categories = [
    {
      title: "Rank Promotion",
      icon: "🏆",
      link: "/rank-selection",
      templates: Array(3).fill({ title: "CHANE COVER", subtitle: "{ BACKEND INTEGRATED }" }),
    },
    {
      title: "Bonanza",
      icon: "🎁",
      templates: Array(3).fill({ title: "CHANE COVER", subtitle: "{ BACKEND INTEGRATED }" }),
    },
    {
      title: "BIRTHDAY - ANNIVERSARY BANNER",
      icon: "🎀",
      templates: Array(3).fill({ title: "CHANE COVER", subtitle: "{ BACKEND INTEGRATED }" }),
    },
  ];

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
              <p className="text-sm text-muted-foreground">Welcome back, John Doe!</p>
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

        {/* Category Sections */}
        {categories.map((category, catIndex) => (
          <div key={catIndex} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{category.icon}</span>
                <h2 className="text-lg font-bold text-foreground">{category.title}</h2>
              </div>
              <Link 
                to={category.link || "/categories"} 
                className="text-primary text-sm font-semibold hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {category.templates.map((template, index) => (
                <Link
                  key={index}
                  to={`/template/${catIndex}-${index}`}
                  className="flex-shrink-0 w-36 h-48 gold-border bg-gradient-to-br from-card to-secondary rounded-2xl flex flex-col items-center justify-center text-center p-4 hover:gold-glow transition-all"
                >
                  <h3 className="text-lg font-bold text-foreground">{template.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{template.subtitle}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}