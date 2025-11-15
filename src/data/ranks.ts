export interface Rank {
  id: string;
  name: string;
  color: string;
  gradient: string;
  icon: string;
}

export const ranks: Rank[] = [
  { 
    id: "bronze", 
    name: "Bronze", 
    color: "from-amber-700 to-amber-900",
    gradient: "bg-gradient-to-br from-amber-700 to-amber-900",
    icon: "🥉"
  },
  { 
    id: "silver", 
    name: "Silver", 
    color: "from-gray-400 to-gray-600",
    gradient: "bg-gradient-to-br from-gray-400 to-gray-600",
    icon: "🥈"
  },
  { 
    id: "gold", 
    name: "Gold", 
    color: "from-yellow-400 to-yellow-600",
    gradient: "bg-gradient-to-br from-yellow-400 to-yellow-600",
    icon: "🥇"
  },
  { 
    id: "platinum", 
    name: "Platinum", 
    color: "from-slate-300 to-slate-500",
    gradient: "bg-gradient-to-br from-slate-300 to-slate-500",
    icon: "💎"
  },
  { 
    id: "emerald", 
    name: "Emerald", 
    color: "from-emerald-500 to-emerald-700",
    gradient: "bg-gradient-to-br from-emerald-500 to-emerald-700",
    icon: "💚"
  },
  { 
    id: "topaz", 
    name: "Topaz", 
    color: "from-amber-500 to-orange-600",
    gradient: "bg-gradient-to-br from-amber-500 to-orange-600",
    icon: "🧡"
  },
  { 
    id: "ruby-star", 
    name: "Ruby Star", 
    color: "from-red-600 to-rose-800",
    gradient: "bg-gradient-to-br from-red-600 to-rose-800",
    icon: "⭐"
  },
  { 
    id: "sapphire", 
    name: "Sapphire", 
    color: "from-blue-600 to-blue-800",
    gradient: "bg-gradient-to-br from-blue-600 to-blue-800",
    icon: "💙"
  },
  { 
    id: "star-sapphire", 
    name: "Star Sapphire", 
    color: "from-indigo-600 to-purple-700",
    gradient: "bg-gradient-to-br from-indigo-600 to-purple-700",
    icon: "🌟"
  },
  { 
    id: "diamond", 
    name: "Diamond", 
    color: "from-cyan-400 to-blue-500",
    gradient: "bg-gradient-to-br from-cyan-400 to-blue-500",
    icon: "💎"
  },
  { 
    id: "blue-diamond", 
    name: "Blue Diamond", 
    color: "from-blue-500 to-blue-700",
    gradient: "bg-gradient-to-br from-blue-500 to-blue-700",
    icon: "💠"
  },
  { 
    id: "black-diamond", 
    name: "Black Diamond", 
    color: "from-gray-800 to-black",
    gradient: "bg-gradient-to-br from-gray-800 to-black",
    icon: "🖤"
  },
  { 
    id: "royal-diamond", 
    name: "Royal Diamond", 
    color: "from-purple-600 to-purple-900",
    gradient: "bg-gradient-to-br from-purple-600 to-purple-900",
    icon: "👑"
  },
  { 
    id: "crown-diamond", 
    name: "Crown Diamond", 
    color: "from-yellow-500 to-amber-700",
    gradient: "bg-gradient-to-br from-yellow-500 to-amber-700",
    icon: "👑💎"
  },
  { 
    id: "ambassador", 
    name: "Ambassador", 
    color: "from-teal-600 to-emerald-700",
    gradient: "bg-gradient-to-br from-teal-600 to-emerald-700",
    icon: "🎖️"
  },
  { 
    id: "royal-ambassador", 
    name: "Royal Ambassador", 
    color: "from-purple-700 to-indigo-900",
    gradient: "bg-gradient-to-br from-purple-700 to-indigo-900",
    icon: "👑🎖️"
  },
  { 
    id: "crown-ambassador", 
    name: "Crown Ambassador", 
    color: "from-amber-600 to-yellow-800",
    gradient: "bg-gradient-to-br from-amber-600 to-yellow-800",
    icon: "👑🏆"
  },
  { 
    id: "brand-ambassador", 
    name: "Brand Ambassador", 
    color: "from-pink-600 to-rose-800",
    gradient: "bg-gradient-to-br from-pink-600 to-rose-800",
    icon: "🌟🏆"
  },
];