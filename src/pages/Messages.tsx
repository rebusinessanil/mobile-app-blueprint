import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import { Search, MessageSquare, PartyPopper, Trophy, Wallet, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Messages() {
  const [searchQuery, setSearchQuery] = useState("");

  const messages = [
    {
      icon: PartyPopper,
      title: "Banner Created Successfully",
      message: "Your Rank Promotion banner has been created and is ready to download.",
      time: "2 hours ago",
      unread: true,
    },
    {
      icon: Trophy,
      title: "Team Achievement",
      message: "Congratulations! Your team has reached a new milestone.",
      time: "5 hours ago",
      unread: false,
    },
    {
      icon: Wallet,
      title: "Wallet Top-up Required",
      message: "Your wallet balance is low. Please top up to continue creating banners.",
      time: "1 day ago",
      unread: true,
    },
    {
      icon: Sparkles,
      title: "New Templates Available",
      message: "Check out our latest collection of festival banner templates.",
      time: "2 days ago",
      unread: false,
    },
  ];

  const filteredMessages = messages.filter(
    (msg) =>
      msg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-navy-dark pb-24 overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-4 sm:px-6 py-4 border-b border-primary/20">
        <div className="max-w-screen-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Messages</h1>
            <p className="text-sm text-primary">
              {messages.filter((m) => m.unread).length} unread messages
            </p>
          </div>
          <button className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors">
            <MessageSquare className="w-5 h-5 text-primary" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="gold-border bg-secondary text-foreground pl-11 h-12"
          />
        </div>
        </div>
      </header>

      {/* Messages List */}
      <div className="px-4 sm:px-6 py-6 space-y-4 max-w-screen-md mx-auto">
        {filteredMessages.map((message, index) => {
          const Icon = message.icon;
          return (
            <div
              key={index}
              className={`gold-border bg-card rounded-2xl p-5 flex gap-4 hover:gold-glow transition-all cursor-pointer ${
                message.unread ? "border-primary" : "border-primary/30"
              }`}
            >
              <div className="flex-shrink-0 w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{message.title}</h3>
                  {message.unread && (
                    <span className="flex-shrink-0 w-3 h-3 bg-primary rounded-full"></span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{message.message}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>🕐</span>
                  <span>{message.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}