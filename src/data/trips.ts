export interface Trip {
  id: string;
  name: string;
  color: string;
  gradient: string;
  icon: string;
}

export const trips: Trip[] = [
  { 
    id: "jaisalmer", 
    name: "Jaisalmer", 
    color: "from-yellow-600 to-orange-700",
    gradient: "bg-gradient-to-br from-yellow-600 to-orange-700",
    icon: "🏜️"
  },
  { 
    id: "vietnam", 
    name: "Vietnam", 
    color: "from-green-600 to-emerald-700",
    gradient: "bg-gradient-to-br from-green-600 to-emerald-700",
    icon: "🇻🇳"
  },
  { 
    id: "dubai", 
    name: "Dubai", 
    color: "from-blue-600 to-cyan-700",
    gradient: "bg-gradient-to-br from-blue-600 to-cyan-700",
    icon: "🏙️"
  },
  { 
    id: "thailand", 
    name: "Thailand", 
    color: "from-purple-600 to-pink-700",
    gradient: "bg-gradient-to-br from-purple-600 to-pink-700",
    icon: "🇹🇭"
  },
  { 
    id: "singapore", 
    name: "Singapore", 
    color: "from-red-600 to-rose-700",
    gradient: "bg-gradient-to-br from-red-600 to-rose-700",
    icon: "🇸🇬"
  },
];
