export interface Trip {
  id: string;
  name: string;
  color: string;
  gradient: string;
  icon: string;
  destination: string;
}

export const trips: Trip[] = [
  { 
    id: "jaisalmer", 
    name: "Jaisalmer", 
    destination: "Rajasthan, India",
    color: "from-amber-600 to-orange-700",
    gradient: "bg-gradient-to-br from-amber-600 to-orange-700",
    icon: "🏜️"
  },
  { 
    id: "vietnam", 
    name: "Vietnam", 
    destination: "Southeast Asia",
    color: "from-emerald-600 to-green-700",
    gradient: "bg-gradient-to-br from-emerald-600 to-green-700",
    icon: "🌏"
  },
  { 
    id: "dubai", 
    name: "Dubai", 
    destination: "UAE",
    color: "from-blue-600 to-cyan-700",
    gradient: "bg-gradient-to-br from-blue-600 to-cyan-700",
    icon: "🏙️"
  },
  { 
    id: "thailand", 
    name: "Thailand", 
    destination: "Southeast Asia",
    color: "from-purple-600 to-pink-700",
    gradient: "bg-gradient-to-br from-purple-600 to-pink-700",
    icon: "🏝️"
  },
  { 
    id: "singapore", 
    name: "Singapore", 
    destination: "Southeast Asia",
    color: "from-red-600 to-rose-700",
    gradient: "bg-gradient-to-br from-red-600 to-rose-700",
    icon: "🦁"
  },
  { 
    id: "maldives", 
    name: "Maldives", 
    destination: "Indian Ocean",
    color: "from-cyan-600 to-blue-700",
    gradient: "bg-gradient-to-br from-cyan-600 to-blue-700",
    icon: "🏖️"
  },
  { 
    id: "bali", 
    name: "Bali", 
    destination: "Indonesia",
    color: "from-teal-600 to-green-700",
    gradient: "bg-gradient-to-br from-teal-600 to-green-700",
    icon: "🌺"
  },
  { 
    id: "paris", 
    name: "Paris", 
    destination: "France",
    color: "from-pink-600 to-rose-700",
    gradient: "bg-gradient-to-br from-pink-600 to-rose-700",
    icon: "🗼"
  },
  { 
    id: "switzerland", 
    name: "Switzerland", 
    destination: "Europe",
    color: "from-slate-600 to-gray-700",
    gradient: "bg-gradient-to-br from-slate-600 to-gray-700",
    icon: "⛰️"
  },
  { 
    id: "new-york", 
    name: "New York", 
    destination: "USA",
    color: "from-indigo-600 to-blue-700",
    gradient: "bg-gradient-to-br from-indigo-600 to-blue-700",
    icon: "🗽"
  },
  { 
    id: "london", 
    name: "London", 
    destination: "UK",
    color: "from-red-700 to-blue-800",
    gradient: "bg-gradient-to-br from-red-700 to-blue-800",
    icon: "🏰"
  },
  { 
    id: "australia", 
    name: "Australia", 
    destination: "Oceania",
    color: "from-yellow-600 to-amber-700",
    gradient: "bg-gradient-to-br from-yellow-600 to-amber-700",
    icon: "🦘"
  },
  { 
    id: "mauritius", 
    name: "Mauritius", 
    destination: "Indian Ocean",
    color: "from-blue-600 to-teal-700",
    gradient: "bg-gradient-to-br from-blue-600 to-teal-700",
    icon: "🌴"
  },
  { 
    id: "seychelles", 
    name: "Seychelles", 
    destination: "Indian Ocean",
    color: "from-emerald-600 to-cyan-700",
    gradient: "bg-gradient-to-br from-emerald-600 to-cyan-700",
    icon: "🐚"
  },
  { 
    id: "kashmir", 
    name: "Kashmir", 
    destination: "India",
    color: "from-green-700 to-emerald-800",
    gradient: "bg-gradient-to-br from-green-700 to-emerald-800",
    icon: "🏔️"
  },
  { 
    id: "goa", 
    name: "Goa", 
    destination: "India",
    color: "from-orange-600 to-amber-700",
    gradient: "bg-gradient-to-br from-orange-600 to-amber-700",
    icon: "🏖️"
  },
];
