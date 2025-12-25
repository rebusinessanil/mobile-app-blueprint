/**
 * Demo data for guest mode - showcases the app's value proposition
 */

export const DEMO_PROFILE = {
  name: "Guest User",
  balance: 0,
  profile_photo: null,
  role: "Guest",
};

export const DEMO_RANKS = [
  { id: "demo-1", name: "Bronze", icon: "🥉", gradient: "bg-gradient-to-br from-amber-700 to-amber-900", color: "#cd7f32" },
  { id: "demo-2", name: "Silver", icon: "🥈", gradient: "bg-gradient-to-br from-gray-400 to-gray-600", color: "#c0c0c0" },
  { id: "demo-3", name: "Gold", icon: "🥇", gradient: "bg-gradient-to-br from-yellow-500 to-yellow-700", color: "#ffd700" },
  { id: "demo-4", name: "Platinum", icon: "💎", gradient: "bg-gradient-to-br from-blue-300 to-blue-500", color: "#e5e4e2" },
  { id: "demo-5", name: "Diamond", icon: "💠", gradient: "bg-gradient-to-br from-cyan-400 to-blue-600", color: "#b9f2ff" },
  { id: "demo-6", name: "Crown Ambassador", icon: "👑", gradient: "bg-gradient-to-br from-purple-500 to-pink-600", color: "#9b59b6" },
];

export const DEMO_TRIPS = [
  { id: "demo-trip-1", title: "Jaisalmer Trip", short_title: "🏜️", trip_image_url: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400" },
  { id: "demo-trip-2", title: "Vietnam Tour", short_title: "🌴", trip_image_url: "https://images.unsplash.com/photo-1528127269322-539801943592?w=400" },
  { id: "demo-trip-3", title: "Dubai Adventure", short_title: "🏙️", trip_image_url: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400" },
  { id: "demo-trip-4", title: "Thailand Escape", short_title: "🌺", trip_image_url: "https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=400" },
];

export const DEMO_BIRTHDAYS = [
  { id: "demo-bday-1", title: "Classic Birthday", short_title: "🎂", Birthday_image_url: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400" },
  { id: "demo-bday-2", title: "Elegant Celebration", short_title: "🎁", Birthday_image_url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400" },
  { id: "demo-bday-3", title: "Golden Wishes", short_title: "✨", Birthday_image_url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400" },
];

export const DEMO_ANNIVERSARIES = [
  { id: "demo-anni-1", title: "Work Anniversary", short_title: "💼", Anniversary_image_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400" },
  { id: "demo-anni-2", title: "Success Milestone", short_title: "🏆", Anniversary_image_url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400" },
  { id: "demo-anni-3", title: "Team Celebration", short_title: "💞", Anniversary_image_url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400" },
];

export const DEMO_MOTIVATIONAL = [
  { id: "demo-moti-1", title: "Success Mindset", short_title: "⚡", Motivational_image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400" },
  { id: "demo-moti-2", title: "Rise & Shine", short_title: "🌟", Motivational_image_url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400" },
  { id: "demo-moti-3", title: "Dream Big", short_title: "🚀", Motivational_image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400" },
];

export const DEMO_FESTIVALS = [
  { id: "demo-fest-1", festival_name: "Diwali Celebration", poster_url: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400" },
  { id: "demo-fest-2", festival_name: "New Year Wishes", poster_url: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=400" },
  { id: "demo-fest-3", festival_name: "Holi Colors", poster_url: "https://images.unsplash.com/photo-1576398289164-c48dc021b4e1?w=400" },
];

export const DEMO_CATEGORIES = [
  { id: "cat-1", name: "Rank Promotion", slug: "rank-promotion", icon: "🏆", display_order: 1 },
  { id: "cat-2", name: "Bonanza Promotion", slug: "bonanza-promotion", icon: "🎁", display_order: 2 },
  { id: "cat-3", name: "Birthday", slug: "birthday", icon: "🎂", display_order: 3 },
  { id: "cat-4", name: "Anniversary", slug: "anniversary", icon: "💞", display_order: 4 },
  { id: "cat-5", name: "Motivational", slug: "motivational", icon: "⚡", display_order: 5 },
  { id: "cat-6", name: "Festival", slug: "festival", icon: "🎉", display_order: 6 },
];

export const DEMO_STORIES = [
  { id: "story-1", title: "Team Achievement", poster_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400", event_type: "achievement" },
  { id: "story-2", title: "Rank Celebration", poster_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400", event_type: "rank" },
  { id: "story-3", title: "Success Story", poster_url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400", event_type: "motivation" },
];

// Create demo templates from the above data
export const DEMO_TEMPLATES = [
  // Rank templates
  ...DEMO_RANKS.map((rank, i) => ({
    id: `tmpl-rank-${i}`,
    name: rank.name,
    rank_id: rank.id,
    cover_thumbnail_url: `https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300`,
  })),
  // Trip templates
  ...DEMO_TRIPS.map((trip, i) => ({
    id: `tmpl-trip-${i}`,
    name: trip.title,
    trip_id: trip.id,
    cover_thumbnail_url: trip.trip_image_url,
  })),
  // Birthday templates
  ...DEMO_BIRTHDAYS.map((bday, i) => ({
    id: `tmpl-bday-${i}`,
    name: bday.title,
    birthday_id: bday.id,
    cover_thumbnail_url: bday.Birthday_image_url,
  })),
  // Anniversary templates
  ...DEMO_ANNIVERSARIES.map((anni, i) => ({
    id: `tmpl-anni-${i}`,
    name: anni.title,
    anniversary_id: anni.id,
    cover_thumbnail_url: anni.Anniversary_image_url,
  })),
  // Motivational templates
  ...DEMO_MOTIVATIONAL.map((moti, i) => ({
    id: `tmpl-moti-${i}`,
    name: moti.title,
    motivational_banner_id: moti.id,
    cover_thumbnail_url: moti.Motivational_image_url,
  })),
  // Festival templates
  ...DEMO_FESTIVALS.map((fest, i) => ({
    id: `tmpl-fest-${i}`,
    name: fest.festival_name,
    festival_id: fest.id,
    cover_thumbnail_url: fest.poster_url,
  })),
];
